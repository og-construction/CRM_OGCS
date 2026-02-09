import express from "express";
import {
  createNotification,
  getNotifications,
  updateNotificationRead,
  deleteNotification,
} from "../controllers/notificationController.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Protect all notification routes
router.get("/", protect, getNotifications);
router.post("/", protect, createNotification);
router.patch("/:id/read", protect, updateNotificationRead);
router.delete("/:id", protect, deleteNotification);

export default router;
