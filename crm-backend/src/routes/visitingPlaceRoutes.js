import express from "express";
import {
  createVisitingPlace,
  listVisitingPlaces,
  getVisitingPlace,
  updateVisitingPlace,
  deleteVisitingPlace,
} from "../controllers/visitingPlaceController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { uploadVisitFiles } from "../middlewares/upload.js"; // ✅ must exist

const router = express.Router();

/**
 * Mounted on: /api/visits
 * GET    /api/visits
 * POST   /api/visits
 * GET    /api/visits/:id
 * PATCH  /api/visits/:id
 * DELETE /api/visits/:id
 */

router.get("/", protect, listVisitingPlaces);
router.post("/", protect, uploadVisitFiles, createVisitingPlace);

router.get("/:id", protect, getVisitingPlace);
router.patch("/:id", protect, uploadVisitFiles, updateVisitingPlace);
router.delete("/:id", protect, deleteVisitingPlace);

export default router;
