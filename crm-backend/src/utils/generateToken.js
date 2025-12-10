// src/utils/generateToken.js
const jwt = require("jsonwebtoken");
const config = require("../config/env");

const generateToken = (user) => {
  if (!config.jwtSecret) {
    throw new Error("JWT secret is not configured");
  }

  // user can be full user object or just an id
  const payload =
    typeof user === "object" && user?._id
      ? { id: user._id, role: user.role, email: user.email }
      : { id: user };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

module.exports = generateToken;
