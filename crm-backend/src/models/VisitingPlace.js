import mongoose from "mongoose";

const fileMetaSchema = new mongoose.Schema(
  {
    originalName: String,
    filename: String,
    mimeType: String,
    size: Number,
    url: String,
  },
  { _id: false }
);

const visitingPlaceSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    personName: { type: String, default: "", trim: true },

    partyType: {
      type: String,
      enum: ["Seller", "Manufacturer", "Buyer", "Customer"],
      required: true,
    },

    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, default: "", trim: true },
    contactEmail: { type: String, default: "", trim: true, lowercase: true },
    address: { type: String, default: "", trim: true },

    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["Planned", "Visited", "Follow-Up", "Closed", "Not Interested"],
      default: "Visited",
    },

    // ✅ CRM features
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    nextFollowUpAt: { type: Date, default: null },

    visitedAt: { type: Date, required: true },
    notes: { type: String, default: "", trim: true },

    // ✅ files
    visitImage: fileMetaSchema,
    visitingCardImage: fileMetaSchema,
  },
  { timestamps: true }
);

// ✅ search
visitingPlaceSchema.index({
  companyName: "text",
  personName: "text",
  contactName: "text",
  contactPhone: "text",
  contactEmail: "text",
  address: "text",
  notes: "text",
});

export default mongoose.model("VisitingPlace", visitingPlaceSchema);