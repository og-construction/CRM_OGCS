import mongoose from "mongoose";

const visitingPlaceSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    personName: { type: String, default: "", trim: true },

    // One field covers your "seller/manufacturer" + "buyer/customer"
    partyType: {
      type: String,
      enum: ["Seller", "Manufacturer", "Buyer", "Customer"],
      required: true,
    },

    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, default: "", trim: true },
    contactEmail: { type: String, default: "", trim: true },

    address: { type: String, default: "", trim: true },

    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["Planned", "Visited", "Follow-Up", "Closed", "Not Interested"],
      default: "Visited",
    },

    visitImage: {
      originalName: String,
      filename: String,
      mimeType: String,
      size: Number,
      url: String,
    },

    visitingCardImage: {
      originalName: String,
      filename: String,
      mimeType: String,
      size: Number,
      url: String,
    },

    visitedAt: { type: Date, required: true }, // date + time
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

visitingPlaceSchema.index({
  companyName: "text",
  personName: "text",
  contactName: "text",
  contactPhone: "text",
  address: "text",
  notes: "text",
});

export default mongoose.model("VisitingPlace", visitingPlaceSchema);
