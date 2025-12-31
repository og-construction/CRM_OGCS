import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { pingLocation } from "../controllers/locationController.js";

const router = express.Router();

router.post("/ping", protect, pingLocation);

export default router;
