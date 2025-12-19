// src/models/Quote.js
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }, // qty * unitPrice
});

const quoteSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["quotation", "invoice"],
      required: true,
    },

    customerName: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    customerEmail: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    projectName: { type: String, trim: true },

    items: {
      type: [itemSchema],
      required: true,
      validate: [(val) => val.length > 0, "At least one item is required"],
    },

    taxPercent: { type: Number, default: 0 },
    notes: { type: String, trim: true },

    subtotal: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    salesExecutive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: { type: Date },
  },
  { timestamps: true }
);

// ❗ IMPORTANT:
// No pre("save") hooks here. If you had ANY old pre hooks,
// DELETE them completely. The controller will calculate totals.

module.exports = mongoose.model("Quote", quoteSchema);
