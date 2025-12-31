import mongoose from "mongoose";

const EmployeeLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number }, // meters
    capturedAt: { type: Date, default: Date.now, index: true },
    source: { type: String, default: "browser" },
  },
  { timestamps: true }
);

EmployeeLocationSchema.index({ userId: 1, capturedAt: -1 });

export default mongoose.model("EmployeeLocation", EmployeeLocationSchema);
