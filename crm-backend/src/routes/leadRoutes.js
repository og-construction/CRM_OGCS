// src/routes/leadRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";

import {
  getMyLeads,
  createLead,
  importLeads,
  getMyFollowUps,
  setMyFollowUp,
} from "../controllers/leadController.js";

const router = express.Router();

// ✅ Leads (Sales executive: only his leads)
router.get("/my", protect, getMyLeads);
router.post("/my", protect, createLead);
router.post("/my/import", protect, importLeads);

// ✅ Follow-ups
router.get("/my/followups", protect, getMyFollowUps);
router.patch("/my/:id/followup", protect, setMyFollowUp);

export default router;
