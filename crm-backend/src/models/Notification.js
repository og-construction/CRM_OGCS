import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },

    // Date selected from form
    notifyDate: { type: Date, required: true },

    // Auto-calculated day name (Mon/Tue...)
    day: { type: String, required: true },

    // Simple read status
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
