export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

// export const errorHandler = (err, req, res, next) => {
//   console.error(err);
//   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(statusCode).json({
//     message: err.message || "Server error",
//     stack: process.env.NODE_ENV === "production" ? "🥷" : err.stack,
//   });
// };

export const errorHandler = (err, req, res, next) => {
  console.error("❌ ERROR:", err.message);
  console.error(err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "🥷" : err.stack,
  });
};