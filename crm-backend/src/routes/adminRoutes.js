import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { getAdminSettings, updateAdminSettings } from "../controllers/adminSettingsController.js";
import { getAdminOverview } from "../controllers/adminController.js";
import { getAdminDailyReports } from "../controllers/dailyReportController.js";


const router = express.Router();

router.get("/overview", protect, adminOnly, getAdminOverview);
router.get("/daily-reports", protect, adminOnly, getAdminDailyReports);

// Admin settings
router.get("/settings", protect, adminOnly, getAdminSettings);
router.put("/settings", protect, adminOnly, updateAdminSettings);

export default router;
