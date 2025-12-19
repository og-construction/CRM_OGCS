// src/models/Lead.js
import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" }, // store 10 digits
    email: { type: String, trim: true, lowercase: true, default: "" },
    city: { type: String, trim: true, default: "" },
    requirement: { type: String, trim: true, default: "" },

    source: { type: String, trim: true, default: "Manual" },
    status: {
      type: String,
      enum: ["New", "Follow-Up", "Closed", "Converted"],
      default: "New",
    },

    // ✅ Follow-up system fields
    nextFollowUpAt: { type: Date, default: null },
    lastFollowUpAt: { type: Date, default: null },

    // 🔒 who owns this lead in CRM (sales executive)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // optional: admin who created/imported
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// helps prevent duplicates per user (email/phone)
leadSchema.index({ assignedTo: 1, email: 1 });
leadSchema.index({ assignedTo: 1, phone: 1 });

export default mongoose.model("Lead", leadSchema);
