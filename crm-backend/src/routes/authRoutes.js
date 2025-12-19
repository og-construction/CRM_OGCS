// src/routes/authRoutes.js
import express from "express";

import {
  login,
  createSalesExecutive,
  getSalesExecutives,
} from "../controllers/authController.js";

import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Login (admin + sales)
router.post("/login", login);

// Admin creates sales executive
router.post("/sales-executive", protect, adminOnly, createSalesExecutive);
router.get("/sales-executive", protect, adminOnly, getSalesExecutives);

export default router;
