import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

import { getAdminSettings, updateAdminSettings } from "../controllers/adminSettingsController.js";
import { getAdminOverview } from "../controllers/adminController.js";
import { getAdminDailyReports } from "../controllers/dailyReportController.js";
import { getLatestLocations, getDayRoute } from "../controllers/adminLocationController.js";

// Leads
import {
  adminGetLeads,
  adminGetLeadById,
  adminUpdateLead,
  adminAssignLead,
  adminDeleteLead,
} from "../controllers/adminLeadController.js";

const router = express.Router();

router.get("/overview", protect, adminOnly, getAdminOverview);
router.get("/daily-reports", protect, adminOnly, getAdminDailyReports);

// ✅ Locations
router.get("/locations/latest", protect, adminOnly, getLatestLocations);
router.get("/locations/day-route", protect, adminOnly, getDayRoute);

// Leads
router.get("/leads", protect, adminOnly, adminGetLeads);
router.get("/leads/:id", protect, adminOnly, adminGetLeadById);
router.put("/leads/:id", protect, adminOnly, adminUpdateLead);
router.put("/leads/:id/assign", protect, adminOnly, adminAssignLead);
router.delete("/leads/:id", protect, adminOnly, adminDeleteLead);

// Settings
router.get("/settings", protect, adminOnly, getAdminSettings);
router.put("/settings", protect, adminOnly, updateAdminSettings);

export default router;
