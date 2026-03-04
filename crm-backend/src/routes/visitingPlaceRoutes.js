import express from "express";
import {
  createVisit,
  listVisits,
  getVisit,
  updateVisit,
  deleteVisit,
} from "../controllers/visitingPlaceController.js";

import { protect } from "../middlewares/authMiddleware.js";

// ✅ IMPORTANT:
// Use the correct path where uploadVisitFiles exists in YOUR project.
// If you created it in src/utils/upload.js then use "../utils/upload.js"
// If you already have it in src/middlewares/upload.js then keep that.
import { uploadVisitFiles } from "../utils/upload.js";

const router = express.Router();

/**
 * Mounted on: /api/visits
 * GET    /api/visits
 * POST   /api/visits
 * GET    /api/visits/:id
 * PATCH  /api/visits/:id
 * DELETE /api/visits/:id
 */

router.get("/", protect, listVisits);
router.post("/", protect, uploadVisitFiles, createVisit);

router.get("/:id", protect, getVisit);
router.patch("/:id", protect, uploadVisitFiles, updateVisit);
router.delete("/:id", protect, deleteVisit);

export default router;