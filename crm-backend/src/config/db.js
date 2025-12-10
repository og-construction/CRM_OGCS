const mongoose = require("mongoose");
const config = require("./env");

const connectDB = async () => {
  try {
    if (!config.mongoUri) {
      throw new Error("Mongo URI is not defined. Check .env");
    }
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
