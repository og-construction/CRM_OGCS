import logger from "../config/logger.js";

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  logger.warn("Not found error", { path: req.originalUrl, method: req.method });
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Log error with context
  logger.error("API Error", {
    statusCode,
    message: err.message,
    path: req.path,
    method: req.method,
    stack: err.stack,
    userId: req.user?._id,
    ip: req.ip,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};