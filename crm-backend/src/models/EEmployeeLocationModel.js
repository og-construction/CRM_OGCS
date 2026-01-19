import mongoose from "mongoose";

const EmployeeLocationSchema = new mongoose.Schema(
  {
    // 🔗 Reference to User / Employee
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 📍 Latitude & Longitude
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },

    // 🎯 GPS accuracy in meters
    accuracy: {
      type: Number,
      default: null,
    },

    // ⏱ Actual capture time (important for day-route)
    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // 🌐 Source of location
    source: {
      type: String,
      enum: ["browser", "mobile", "gps", "unknown"],
      default: "browser",
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// 🔥 Performance indexes
EmployeeLocationSchema.index({ userId: 1, capturedAt: -1 });
EmployeeLocationSchema.index({ capturedAt: -1 });

export default mongoose.model("EmployeeLocation", EmployeeLocationSchema);
