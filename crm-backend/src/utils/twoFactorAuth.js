// src/utils/twoFactorAuth.js
import crypto from "crypto";
import logger from "../config/logger.js";

/**
 * Generate time-based OTP token
 */
export const generateTOTPSecret = () => {
  const secret = crypto.randomBytes(20).toString("base64");
  return secret;
};

/**
 * Generate OTP code for verification
 */
export const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
};

/**
 * Verify OTP code
 */
export const verifyOTPCode = (storedCode, providedCode) => {
  if (!storedCode || !providedCode) return false;
  return storedCode === providedCode;
};

/**
 * Check if OTP code has expired (valid for 5 minutes)
 */
export const isOTPExpired = (createdAt, expiryMinutes = 5) => {
  const now = new Date();
  const diffMinutes = (now - new Date(createdAt)) / (1000 * 60);
  return diffMinutes > expiryMinutes;
};

/**
 * Send OTP via email (stub - implement with your email service)
 */
export const sendOTPViaEmail = async (email, otpCode, userName = "") => {
  try {
    // TODO: Integrate with your email service (Nodemailer, SendGrid, etc.)
    logger.info("OTP sent to email", {
      email,
      otpCode: otpCode.substring(0, 2) + "****", // mask in logs
    });

    // Example email template
    const emailContent = `
      <h2>Two-Factor Authentication</h2>
      <p>Hello ${userName},</p>
      <p>Your One-Time Password (OTP) is:</p>
      <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${otpCode}</h1>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return true;
  } catch (err) {
    logger.error("Failed to send OTP", { error: err.message, email });
    return false;
  }
};

/**
 * Send OTP via SMS (stub - implement with SMS service)
 */
export const sendOTPViaSMS = async (phone, otpCode) => {
  try {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    logger.info("OTP sent to SMS", {
      phone: phone.substring(0, 5) + "****", // mask in logs
      otpCode: otpCode.substring(0, 2) + "****",
    });

    return true;
  } catch (err) {
    logger.error("Failed to send OTP via SMS", { error: err.message, phone });
    return false;
  }
};

/**
 * Middleware for 2FA verification
 */
export const require2FA = (req, res, next) => {
  const { is2FAEnabled, is2FAVerified } = req.user || {};

  if (is2FAEnabled && !is2FAVerified) {
    return res.status(403).json({
      success: false,
      message: "2FA verification required",
      code: "2FA_REQUIRED",
    });
  }

  next();
};

/**
 * Rate limiting for OTP attempts (prevent brute force)
 */
const otpAttempts = {}; // In production, use Redis

export const trackOTPAttempt = (identifier) => {
  if (!otpAttempts[identifier]) {
    otpAttempts[identifier] = {
      attempts: 0,
      lastAttempt: Date.now(),
    };
  }

  otpAttempts[identifier].attempts++;
  otpAttempts[identifier].lastAttempt = Date.now();

  // Reset after 15 minutes
  if (Date.now() - otpAttempts[identifier].lastAttempt > 15 * 60 * 1000) {
    delete otpAttempts[identifier];
  }

  return otpAttempts[identifier].attempts;
};

export const checkOTPAttemptLimit = (identifier, maxAttempts = 5) => {
  const attempts = otpAttempts[identifier]?.attempts || 0;
  return attempts >= maxAttempts;
};

export const resetOTPAttempts = (identifier) => {
  delete otpAttempts[identifier];
};

export default {
  generateTOTPSecret,
  generateOTPCode,
  verifyOTPCode,
  isOTPExpired,
  sendOTPViaEmail,
  sendOTPViaSMS,
  require2FA,
  trackOTPAttempt,
  checkOTPAttemptLimit,
  resetOTPAttempts,
};
