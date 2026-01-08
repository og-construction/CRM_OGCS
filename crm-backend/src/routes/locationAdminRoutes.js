import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { getLatestLocationByEmployee, getEmployeeDayRoute } from "../controllers/locationAdminController.js";

const router = express.Router();

// Admin-only
router.get("/latest", protect, adminOnly, getLatestLocationByEmployee);
router.get("/day-route", protect, adminOnly, getEmployeeDayRoute);

export default router;
