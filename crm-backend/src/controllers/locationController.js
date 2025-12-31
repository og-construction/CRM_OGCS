import EmployeeLocation from "../models/EmployeeLocation.js";

export const pingLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy, capturedAt } = req.body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ message: "lat and lng must be numbers" });
    }

    const item = await EmployeeLocation.create({
      userId: req.user._id, // from JWT protect middleware
      lat,
      lng,
      accuracy: typeof accuracy === "number" ? accuracy : undefined,
      capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
      source: "browser",
    });

    return res.json({ ok: true, item });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
