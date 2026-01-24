import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getMyLeads,
  createMyLead,
  updateMyLead,
  deleteMyLead,
  importMyLeads,
  updateLeadFollowUp, 
  getMyFollowUps,
  getMyFollowUpsSummary,
} from "../controllers/leadsController.js";

const router = express.Router();

// ===================
// LEADS CRUD
// ===================
router.get("/my", protect, getMyLeads);
router.post("/my", protect, createMyLead);
router.put("/my/:id", protect, updateMyLead);
router.delete("/my/:id", protect, deleteMyLead);
router.post("/my/import", protect, importMyLeads);
router.patch("/my/:id/followup", protect, updateLeadFollowUp);

// Follow-up dashboard APIs
router.get("/my/followups", protect, getMyFollowUps);
router.get("/my/followups/summary", protect, getMyFollowUpsSummary);



export default router;
