import express from "express";
import {
  createVisitingPlace,
  listVisitingPlaces,
  getVisitingPlace,
  updateVisitingPlace,
  deleteVisitingPlace,
} from "../controllers/visitingPlaceController.js";

import { uploadVisitFiles } from "../middlewares/upload.js";
import { protect } from "../middlewares/authMiddleware.js"; // adjust path to your project

const router = express.Router();

router.get("/", protect, listVisitingPlaces);
router.post("/", protect, uploadVisitFiles, createVisitingPlace);

router.get("/:id", protect, getVisitingPlace);
router.put("/:id", protect, uploadVisitFiles, updateVisitingPlace);
router.delete("/:id", protect, deleteVisitingPlace);

export default router;
