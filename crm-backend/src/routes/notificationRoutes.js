import express from "express";
import {
  createNotification,
  getNotifications,
  updateNotificationRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// GET list, POST create
router.get("/", getNotifications);
router.post("/", createNotification);

// PATCH read status
router.patch("/:id/read", updateNotificationRead);

// DELETE
router.delete("/:id", deleteNotification);

export default router;
