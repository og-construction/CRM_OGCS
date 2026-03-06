// src/config/env.js
import path from "path";
import dotenv from "dotenv";

export function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env"); // ✅ SINGLE .env

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.log("❌ Failed to load .env:", result.error.message);
  } else {
    console.log("🟢 Using env file: .env");
  }
}