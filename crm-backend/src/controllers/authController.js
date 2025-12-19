// src/controllers/authController.js
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// ✅ LOGIN (admin + sales)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);

    return res.json({
      status: "success",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error while logging in" });
  }
};

// ✅ GET SALES EXECUTIVES (ADMIN)
export const getSalesExecutives = async (req, res) => {
  try {
    const salesUsers = await User.find({ role: "sales" })
      .select("name email phone jobStatus isActive createdAt")
      .sort({ createdAt: -1 });

    return res.json({
      status: "success",
      data: salesUsers,
    });
  } catch (err) {
    console.error("getSalesExecutives error:", err);
    return res
      .status(500)
      .json({ message: "Server error while fetching sales executives" });
  }
};

// ✅ CREATE SALES EXECUTIVE (ADMIN)
export const createSalesExecutive = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      altPhone,
      aadhaar,
      pan,
      permanentAddress,
      presentAddress,
      jobStatus,
      govDocPath,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !aadhaar ||
      !pan ||
      !permanentAddress ||
      !presentAddress
    ) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields." });
    }

    const existing = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const salesUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: "sales",
      phone,
      altPhone,
      aadhaar,
      pan,
      permanentAddress,
      presentAddress,
      jobStatus: jobStatus || "office",
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
        createdAt: salesUser.createdAt,
      },
    });
  } catch (err) {
    console.error("createSalesExecutive error:", err);
    return res
      .status(500)
      .json({ message: "Server error while creating sales executive" });
  }
};
