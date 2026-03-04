// src/config/rateLimiter.js
import rateLimit from "express-rate-limit";

// General API limiter - 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  skip: (req) => process.env.NODE_ENV === "development", // Skip in development
});

// Auth limiter - 5 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again after 15 minutes.",
  skipSuccessfulRequests: true, // Don't count successful requests
  key: (req) => req.body.email || req.ip, // Rate limit by email or IP
});

// Create limiter - 10 requests per hour
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "Too many resources created, please try again later.",
});

// Upload limiter - 5 uploads per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many file uploads, please try again later.",
});

// Search limiter - 30 requests per minute
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many search requests, please try again later.",
});

// General read limiter - 1000 requests per hour
export const readLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: "Too many requests, please try again later.",
});
