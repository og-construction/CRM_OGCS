// src/routes/leadRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";

import {
  getMyLeads,
  createMyLead,
  updateMyLead,
  deleteMyLead,
  importMyLeads,

  // ✅ Follow-up APIs
  updateLeadFollowUp,
  getMyFollowUps,
  getMyFollowUpsSummary,
} from "../controllers/leadController.js";

import {
  validateCreateLead,
  validateUpdateLead,
  validatePagination,
} from "../middlewares/validationMiddleware.js";

const router = express.Router();

/**
 * ==========================
 * LEADS CRUD (My Leads)
 * ==========================
 */
router.get("/my", protect, validatePagination, getMyLeads);
router.post("/my", protect, validateCreateLead, createMyLead);
router.post("/my/import", protect, importMyLeads);
router.put("/my/:id", protect, validateUpdateLead, updateMyLead);
router.delete("/my/:id", protect, deleteMyLead);

/**
 * ==========================
 * FOLLOW-UP DASHBOARD
 * ==========================
 * Used by Notification.jsx:
 *  - GET /api/leads/my/followups/summary
 *  - GET /api/leads/my/followups?bucket=today&page=1&limit=50
 */
router.get("/my/followups/summary", protect, getMyFollowUpsSummary);
router.get("/my/followups", protect, getMyFollowUps);

/**
 * ✅ Set follow-up date/notes on lead
 * PATCH /api/leads/my/:id/followup
 */
router.patch("/my/:id/followup", protect, updateLeadFollowUp);

export default router;
