import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { getLatestLocations } from "../controllers/adminLocationController.js";


const router = express.Router();

// GET /api/admin/locations/latest?page=1&limit=20&q=
router.get("/latest", protect, adminOnly, getLatestLocations);

export default router;
