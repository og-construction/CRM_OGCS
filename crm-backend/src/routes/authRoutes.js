// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  login,
  createSalesExecutive,
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// Login (admin + sales)
router.post("/login", login);

// Admin creates sales executive
router.post("/sales-executive", protect, adminOnly, createSalesExecutive);

module.exports = router;
