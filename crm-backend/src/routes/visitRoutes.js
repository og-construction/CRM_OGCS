import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createVisit,
  getMyVisits,
  createLeadFromMetPerson,
  updateLeadFollowUp,
} from "../controllers/visitsController.js";

const router = express.Router();

// Create visit
router.post("/", protect, createVisit);

// My visits
router.get("/my", protect, getMyVisits);

// Convert metPerson -> lead
router.post("/:visitId/create-lead", protect, createLeadFromMetPerson);

router.patch("/my/:id/followup", protect, updateLeadFollowUp);


export default router;
