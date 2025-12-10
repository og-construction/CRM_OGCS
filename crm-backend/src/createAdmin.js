// createAdmin.js (temporary file in src/)
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

(async () => {
  await connectDB();

  const adminExists = await User.findOne({ email: "admin@ogcs.co.in" });
  if (adminExists) {
    console.log("Admin already exists");
    process.exit(0);
  }

  const admin = await User.create({
    name: "OGCS Admin",
    email: "admin@ogcs.co.in",
    password: "Admin@123", // will be hashed
    role: "admin",
  });

  console.log("Admin created:", admin.email);
  process.exit(0);
})();
