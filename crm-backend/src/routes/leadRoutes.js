import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getMyLeads,
  createMyLead,
  updateMyLead,
  deleteMyLead,
  importMyLeads,
} from "../controllers/leadController.js";

const router = express.Router();

// /api/leads/my
router.get("/my", protect, getMyLeads);
router.post("/my", protect, createMyLead);
router.post("/my/import", protect, importMyLeads);
router.put("/my/:id", protect, updateMyLead);
router.delete("/my/:id", protect, deleteMyLead);

export default router;
