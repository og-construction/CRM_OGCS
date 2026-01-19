import mongoose from "mongoose";

const AdminSettingsSchema = new mongoose.Schema(
  {
    // Add your settings fields here (examples)
    companyName: { type: String, default: "OGCS" },
    supportEmail: { type: String, default: "support@ogcs.co.in" },
  },
  { timestamps: true }
);

export default mongoose.model("AdminSettings", AdminSettingsSchema);
