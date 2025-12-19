import mongoose from "mongoose";

const DailyReportSchema = new mongoose.Schema(
  {
    reportDate: { type: String, required: true }, // YYYY-MM-DD
    memberName: { type: String, required: true, trim: true, maxlength: 120 },

    reportText: { type: String, required: true, trim: true, maxlength: 5000 },
    wordCount: { type: Number, required: true },

    attachment: {
      originalName: { type: String, default: "" },
      filename: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      size: { type: Number, default: 0 },
      url: { type: String, default: "" }, // /uploads/filename
    },

    // Optional: if later you want link to logged-in user
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("DailyReport", DailyReportSchema);
