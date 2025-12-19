import mongoose from "mongoose";

const CommunicationLogSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["email", "call", "whatsapp"], required: true },

    toEmail: { type: String, default: "" },
    toPhone: { type: String, default: "" },

    subject: { type: String, default: "" },
    message: { type: String, default: "" },

    relatedTo: {
      leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
      name: { type: String, default: "" },
      company: { type: String, default: "" },
    },

    status: { type: String, enum: ["sent", "failed", "logged"], default: "logged" },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("CommunicationLog", CommunicationLogSchema);
