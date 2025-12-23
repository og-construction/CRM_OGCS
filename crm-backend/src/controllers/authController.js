// src/controllers/authController.js
import fs from "fs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

/* ===============================
   helpers
================================ */
const unlinkSafe = (file) => {
  try {
    if (file?.path) fs.unlinkSync(file.path);
  } catch (e) {
    // don't crash if delete fails
    console.log("⚠️ file delete failed:", e.message);
  }
};

const trim = (v) => (v || "").toString().trim();
const digits = (v) => (v || "").toString().replace(/\D/g, "");

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhoneIN = (v) => /^[6-9]\d{9}$/.test(digits(v));
const isAadhaar = (v) => /^\d{12}$/.test(digits(v));
const isPAN = (v) => /^[A-Z]{5}\d{4}[A-Z]$/.test(String(v || "").toUpperCase());

/* ===============================
   ✅ LOGIN (admin + sales)
================================ */
export const login = async (req, res) => {
  try {
    const email = trim(req.body?.email).toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    if (user.isActive === false) { return res.status(403).json({ status: "fail", message: "Your account is deactivated. Please contact admin.", });}

    const token = generateToken(user);

    return res.json({
      status: "success",
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error while logging in" });
  }
};

/* ===============================
   ✅ GET SALES EXECUTIVES (ADMIN)
================================ */
export const getSalesExecutives = async (req, res) => {
  try {
    const salesUsers = await User.find({ role: "sales" })
      .select("name email phone jobStatus isActive createdAt")
      .sort({ createdAt: -1 });

    return res.json({ status: "success", data: salesUsers });
  } catch (err) {
    console.error("getSalesExecutives error:", err);
    return res.status(500).json({ message: "Server error while fetching sales executives" });
  }
};

/* ===============================
   ✅ CREATE SALES EXECUTIVE (ADMIN)
   + deletes uploaded file if request fails
================================ */
export const createSalesExecutive = async (req, res) => {
  // ✅ keep only if you want debug
  // console.log("BODY:", req.body);
  // console.log("FILE:", req.file);

  try {
    const name = trim(req.body?.name);
    const email = trim(req.body?.email).toLowerCase();
    const password = String(req.body?.password || "");

    const phone = trim(req.body?.phone);
    const altPhone = trim(req.body?.altPhone);

    const aadhaar = digits(req.body?.aadhaar);
    const pan = trim(req.body?.pan).toUpperCase();

    const permanentAddress = trim(req.body?.permanentAddress);
    const presentAddress = trim(req.body?.presentAddress);

    const jobStatus = trim(req.body?.jobStatus || "office").toLowerCase();

    // multer file -> store as URL-friendly path
    const govDocPath = req.file ? `/${req.file.path.replace(/\\/g, "/")}` : "";

    /* ---------- validation ---------- */
    const errors = {};

    if (!name) errors.name = "Name is required";
    else if (name.length < 3) errors.name = "Name must be at least 3 characters";

    if (!email) errors.email = "Email is required";
    else if (!isEmail(email)) errors.email = "Invalid email format";

    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters";

    if (!phone) errors.phone = "Phone is required";
    else if (!isPhoneIN(phone)) errors.phone = "Phone must be 10 digits (India)";

    if (altPhone) {
      if (!isPhoneIN(altPhone)) errors.altPhone = "Alt phone must be 10 digits (India)";
      if (digits(altPhone) === digits(phone)) errors.altPhone = "Alt phone cannot be same as phone";
    }

    if (!aadhaar) errors.aadhaar = "Aadhaar is required";
    else if (!isAadhaar(aadhaar)) errors.aadhaar = "Aadhaar must be 12 digits";

    if (!pan) errors.pan = "PAN is required";
    else if (!isPAN(pan)) errors.pan = "Invalid PAN format (ABCDE1234F)";

    if (!permanentAddress || permanentAddress.length < 10)
      errors.permanentAddress = "Permanent address too short";

    if (!presentAddress || presentAddress.length < 10)
      errors.presentAddress = "Present address too short";

    if (!["office", "remote"].includes(jobStatus))
      errors.jobStatus = "jobStatus must be office or remote";

    if (!govDocPath) errors.govDocFile = "Government document required";

    // ✅ If validation fails → delete uploaded file
    if (Object.keys(errors).length > 0) {
      unlinkSafe(req.file);
      return res.status(400).json({ message: "Validation failed", errors });
    }

    /* ---------- duplicate checks ---------- */
    const [emailExists, phoneExists, panExists, aadhaarExists] = await Promise.all([
      User.findOne({ email }).lean(),
      User.findOne({ phone }).lean(),
      User.findOne({ pan }).lean(),
      User.findOne({ aadhaar }).lean(),
    ]);

    if (emailExists) {
      unlinkSafe(req.file);
      return res.status(400).json({
        message: "Validation failed",
        errors: { email: "Email already exists" },
      });
    }
    if (phoneExists) {
      unlinkSafe(req.file);
      return res.status(400).json({
        message: "Validation failed",
        errors: { phone: "Phone already exists" },
      });
    }
    if (panExists) {
      unlinkSafe(req.file);
      return res.status(400).json({
        message: "Validation failed",
        errors: { pan: "PAN already exists" },
      });
    }
    if (aadhaarExists) {
      unlinkSafe(req.file);
      return res.status(400).json({
        message: "Validation failed",
        errors: { aadhaar: "Aadhaar already exists" },
      });
    }

    /* ---------- create ---------- */
    const salesUser = await User.create({
      name,
      email,
      password, // hashed in model pre-save
      role: "sales",
      phone,
      altPhone: altPhone || undefined,
      aadhaar,
      pan,
      permanentAddress,
      presentAddress,
      jobStatus,
      govDocPath,
    });

    return res.status(201).json({
      status: "success",
      data: {
        id: salesUser._id,
        name: salesUser.name,
        email: salesUser.email,
        role: salesUser.role,
        phone: salesUser.phone,
        jobStatus: salesUser.jobStatus,
        isActive: salesUser.isActive,
        govDocPath: salesUser.govDocPath,
        createdAt: salesUser.createdAt,
      },
    });
  } catch (err) {
    // ✅ if anything fails after upload → delete file
    unlinkSafe(req.file);

    // duplicate key fallback
    if (err?.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(400).json({
        message: "Validation failed",
        errors: { [field]: `${field} already exists` },
      });
    }

    // mongoose validation fallback
    if (err?.name === "ValidationError") {
      const errors = {};
      for (const k in err.errors) errors[k] = err.errors[k].message;
      return res.status(400).json({ message: "Validation failed", errors });
    }

    console.error("createSalesExecutive error:", err);
    return res.status(500).json({ message: "Server error while creating sales executive" });
  }
};







































// // src/controllers/authController.js
// import User from "../models/User.js";
// import generateToken from "../utils/generateToken.js";

// // ✅ LOGIN (admin + sales)
// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({
//       email: email.toLowerCase().trim(),
//     });

//     if (!user) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const isMatch = await user.matchPassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const token = generateToken(user);

//     return res.json({
//       status: "success",
//       data: {
//         token,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//         },
//       },
//     });
//   } catch (err) {
//     console.error("login error:", err);
//     return res.status(500).json({ message: "Server error while logging in" });
//   }
// };

// // ✅ GET SALES EXECUTIVES (ADMIN)
// export const getSalesExecutives = async (req, res) => {
//   try {
//     const salesUsers = await User.find({ role: "sales" })
//       .select("name email phone jobStatus isActive createdAt")
//       .sort({ createdAt: -1 });

//     return res.json({
//       status: "success",
//       data: salesUsers,
//     });
//   } catch (err) {
//     console.error("getSalesExecutives error:", err);
//     return res
//       .status(500)
//       .json({ message: "Server error while fetching sales executives" });
//   }
// };

// // ✅ CREATE SALES EXECUTIVE (ADMIN)
// export const createSalesExecutive = async (req, res) => {
//   console.log("authcontroller file")
//    console.log("REQ BODY:", req.body);
//   try {
//     const {
//       name,
//       email,
//       password,
//       phone,
//       altPhone,
//       aadhaar,
//       pan,
//       permanentAddress,
//       presentAddress,
//       jobStatus,
//       govDocPath,
//     } = req.body;

//     if (
//       !name ||
//       !email ||
//       !password ||
//       !phone ||
//       !aadhaar ||
//       !pan ||
//       !permanentAddress ||
//       !presentAddress
//     ) {
//       return res
//         .status(400)
//         .json({ message: "Please fill all required fields." });
//     }

//     const existing = await User.findOne({
//       email: email.toLowerCase().trim(),
//     });

//     if (existing) {
//       return res
//         .status(400)
//         .json({ message: "User with this email already exists" });
//     }

//     const salesUser = await User.create({
//       name,
//       email: email.toLowerCase().trim(),
//       password,
//       role: "sales",
//       phone,
//       altPhone,
//       aadhaar,
//       pan,
//       permanentAddress,
//       presentAddress,
//       jobStatus: jobStatus || "office",
//       govDocPath,
//     });

//     return res.status(201).json({
//       status: "success",
//       data: {
//         id: salesUser._id,
//         name: salesUser.name,
//         email: salesUser.email,
//         role: salesUser.role,
//         phone: salesUser.phone,
//         jobStatus: salesUser.jobStatus,
//         isActive: salesUser.isActive,
//         createdAt: salesUser.createdAt,
//       },
//     });
//   } catch (err) {
//     console.error("createSalesExecutive error:", err);
//     return res
//       .status(500)
//       .json({ message: "Server error while creating sales executive" });
//   }
// };
