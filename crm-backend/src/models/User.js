// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // Basic details
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Role & status
    role: {
      type: String,
      enum: ["admin", "sales"],
      default: "sales",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Contact
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    altPhone: {
      type: String,
      trim: true,
    },

    // Govt IDs
    aadhaar: {
      type: String,
      required: true,
      trim: true,
    },

    pan: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    // Addresses
    permanentAddress: {
      type: String,
      required: true,
      trim: true,
    },

    presentAddress: {
      type: String,
      required: true,
      trim: true,
    },

    // Job status
    jobStatus: {
      type: String,
      enum: ["office", "remote"],
      default: "office",
    },

    // Uploaded document
    govDocPath: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// 🔐 Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
 