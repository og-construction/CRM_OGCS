import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
  {
    leadSources: {
      type: [String],
      default: ["Manual", "Website", "WhatsApp", "Referral", "Campaign"],
    },

    leadStatuses: {
      type: [String],
      default: ["New", "Follow-Up", "Closed", "Converted"],
    },

    defaultLeadStatus: { type: String, default: "New" },

    defaultTaxPercent: { type: Number, default: 18 },
    currency: { type: String, default: "INR" },

    quotationPrefix: { type: String, default: "QT" },
    invoicePrefix: { type: String, default: "INV" },

    requireQuoteApproval: { type: Boolean, default: true },
    maxQuotesPerDay: { type: Number, default: 50 },

    emailNotifications: { type: Boolean, default: true },
    notifyAdminOnQuote: { type: Boolean, default: true },
    notifySalesOnApproval: { type: Boolean, default: true },

    financialYearStart: { type: String, default: "April" },
  },
  { timestamps: true }
);

export default mongoose.model("SystemSettings", systemSettingsSchema);
