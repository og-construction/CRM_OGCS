// ✅ Updated Lead Model (backend): add leadType (Buyer / Contractor / Seller / Manufacturer)

import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ✅ NEW
    leadType: {
      type: String,
      enum: ["Buyer", "Contractor", "Seller", "Manufacturer"],
      default: "Buyer",
      index: true,
    },

    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true },

    phone: { type: String, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },

    city: { type: String, trim: true },
    address: { type: String, trim: true },

    description: { type: String, trim: true },

    source: { type: String, trim: true, default: "Manual" },

    status: {
      type: String,
      enum: ["New", "Follow-Up", "Closed", "Converted"],
      default: "New",
      index: true,
    },
  },
  { timestamps: true }
);

LeadSchema.index({ owner: 1, phone: 1 }, { unique: false, sparse: true });
LeadSchema.index({ owner: 1, email: 1 }, { unique: false, sparse: true });

export default mongoose.model("Lead", LeadSchema);
