import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    // 🔹 NEW (but backward-safe)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null, // 🔥 IMPORTANT: not required
    },

    // 🔹 Backward compatibility
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

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

    // 🔹 New field
    description: { type: String, trim: true },

    // 🔹 OLD FIELD (keep for compatibility)
    requirement: { type: String, trim: true },

    source: { type: String, trim: true, default: "Manual" },

    status: {
      type: String,
      enum: ["New", "Follow-Up", "Closed", "Converted"],
      default: "New",
      index: true,
    },

    // Optional team assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Compound indexes for better query performance
LeadSchema.index({ owner: 1, createdAt: -1 }); // For user-specific lead listing with sorting
LeadSchema.index({ owner: 1, status: 1 }); // For filtering leads by status
LeadSchema.index({ owner: 1, leadType: 1 }); // For filtering by lead type
LeadSchema.index({ owner: 1, phone: 1 }, { unique: false, sparse: true }); // For duplicate phone check
LeadSchema.index({ owner: 1, email: 1 }, { unique: false, sparse: true }); // For duplicate email check
LeadSchema.index({ createdAt: -1 }); // For global lead timeline

export default mongoose.model("Lead", LeadSchema);





















// // ✅ Updated Lead Model (backend): add leadType (Buyer / Contractor / Seller / Manufacturer)

// import mongoose from "mongoose";

// const LeadSchema = new mongoose.Schema(
//   {
//     owner: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     // ✅ NEW
//     leadType: {
//       type: String,
//       enum: ["Buyer", "Contractor", "Seller", "Manufacturer"],
//       default: "Buyer",
//       index: true,
//     },

//     name: { type: String, required: true, trim: true },
//     company: { type: String, trim: true },

//     phone: { type: String, trim: true, index: true },
//     email: { type: String, trim: true, lowercase: true, index: true },

//     city: { type: String, trim: true },
//     address: { type: String, trim: true },

//     description: { type: String, trim: true },

//     source: { type: String, trim: true, default: "Manual" },

//     status: {
//       type: String,
//       enum: ["New", "Follow-Up", "Closed", "Converted"],
//       default: "New",
//       index: true,
//     },
//   },
//   { timestamps: true }
// );

// LeadSchema.index({ owner: 1, phone: 1 }, { unique: false, sparse: true });
// LeadSchema.index({ owner: 1, email: 1 }, { unique: false, sparse: true });

// export default mongoose.model("Lead", LeadSchema);