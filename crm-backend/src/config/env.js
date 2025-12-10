// src/config/env.js
const dotenv = require("dotenv");
dotenv.config();

const env = process.env.NODE_ENV || "development";
const isDev = env === "development";

module.exports = {
  env,
  port: process.env.PORT || 3181,
  mongoUri: isDev ? process.env.MONGO_URI_DEV : process.env.MONGO_URI_PROD,
  clientUrl: isDev ? process.env.CLIENT_URL_DEV : process.env.CLIENT_URL_PROD,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};
