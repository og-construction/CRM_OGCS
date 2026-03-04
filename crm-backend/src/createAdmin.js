// createAdmin.js (ESM version)

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import User from "./models/User.js";

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const createAdmin = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({ email: "admin@ogcs.co.in" });

    if (adminExists) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const admin = await User.create({
      name: "OGCS Admin",
      email: "admin@ogcs.co.in",
      phone: "9999999999",
      password: "Admin@123",
      role: "admin",

      // required fields in your schema
      presentAddress: "OGCS Office, Pune, Maharashtra, India",
      permanentAddress: "OGCS Office, Pune, Maharashtra, India",
      pan: "ABCDE1234F",
      aadhaar: "123412341234",
    });


    console.log("✅ Admin created:", admin.email);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();