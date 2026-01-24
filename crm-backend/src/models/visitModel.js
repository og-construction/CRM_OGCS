import mongoose from "mongoose";

/* =========================
   Met Person Sub-Schema
   ========================= */
const metPersonSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },

    leadType: {
      type: String,
      enum: ["Buyer", "Contractor", "Seller", "Manufacturer"],
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    conversationNotes: {
      type: String,
      trim: true,
    },

    outcome: {
      type: String,
      enum: [
        "Interested",
        "Not Interested",
        "Call Back",
        "Quotation Asked",
        "Meeting Fixed",
      ],
      default: "Interested",
    },

    followUpDate: {
      type: Date,
    },
  },
  { _id: false }
);

/* =========================
   Visit Schema
   ========================= */
const visitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    placeName: {
      type: String,
      required: true,
      trim: true,
    },

    siteType: {
      type: String,
      enum: ["Site", "Office", "Store", "Factory", "Other"],
      default: "Site",
    },

    address: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
      index: true,
    },

    /* ✅ CORRECT GEOJSON (NO DEFAULT EMPTY ARRAY) */
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },

    visitedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    checkInAt: {
      type: Date,
    },

    checkOutAt: {
      type: Date,
    },

    metPeople: {
      type: [metPersonSchema],
      default: [],
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

/* =========================
   INDEXES
   ========================= */
visitSchema.index({ location: "2dsphere" });
visitSchema.index({ userId: 1, visitedAt: -1 });

/* =========================
   SAFE EXPORT
   ========================= */
const Visit = mongoose.models.Visit || mongoose.model("Visit", visitSchema);
export default Visit;
