import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    leadType: {
      type: String,
      enum: ["Buyer", "Contractor", "Seller", "Manufacturer"],
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    company: {
      type: String,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    normalizedPhone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    city: {
      type: String,
      trim: true,
      index: true,
    },

    address: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["New", "Follow-Up", "Closed", "Converted"],
      default: "New",
      index: true,
    },

    source: {
      type: String,
      trim: true,
      default: "Manual",
      index: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // ✅ Follow-up fields (for FollowUpSystem)
    followUpDate: { type: Date, index: true },
    followUpNotes: { type: String, trim: true },

    lastVisitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visit",
    },
  },
  { timestamps: true }
);

/* =========================
   🔐 DUPLICATE PREVENTION
   ========================= */

// One lead per phone per owner
leadSchema.index(
  { ownerId: 1, normalizedPhone: 1 },
  { unique: true, sparse: true }
);

// Optional: One lead per email per owner
leadSchema.index(
  { ownerId: 1, email: 1 },
  { unique: true, sparse: true }
);

/* =========================
   SAFE EXPORT
   ========================= */
const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
export default Lead;
