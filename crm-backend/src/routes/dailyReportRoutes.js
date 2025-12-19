import express from "express";
import { createDailyReport, getDailyReports } from "../controllers/dailyReportController.js";
import { uploadSingle } from "../middlewares/upload.js";

const router = express.Router();

// Save report (with optional file)
router.post("/", (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, createDailyReport);

// Admin fetch reports
router.get("/", getDailyReports);

export default router;
