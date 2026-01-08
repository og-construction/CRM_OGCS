import EmployeeLocation from "../models/EmployeeLocation.js";

/**
 * GET /api/admin/locations/latest
 * Query: q, page, limit
 * Returns latest location per employee (user)
 */
export const getLatestLocationByEmployee = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const skip = (page - 1) * limit;

    const q = String(req.query.q || "").trim();

    const basePipeline = [
      { $sort: { capturedAt: -1 } },
      {
        $group: {
          _id: "$userId",
          latest: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$latest" } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ];

    const pipeline = [...basePipeline];

    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { "user.name": { $regex: q, $options: "i" } },
            { "user.email": { $regex: q, $options: "i" } },
          ],
        },
      });
    }

    // total count
    const countRes = await EmployeeLocation.aggregate([...pipeline, { $count: "total" }]);
    const total = countRes?.[0]?.total || 0;

    // page data
    const items = await EmployeeLocation.aggregate([
      ...pipeline,
      { $sort: { capturedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return res.json({
      status: "success",
      data: items.map((r) => ({
        _id: r._id,
        userId: r.userId,
        employee: { _id: r.user._id, name: r.user.name, email: r.user.email, role: r.user.role },
        lat: r.lat,
        lng: r.lng,
        accuracy: r.accuracy || 0,
        source: r.source || "browser",
        capturedAt: r.capturedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("getLatestLocationByEmployee:", err);
    return res.status(500).json({ message: "Failed to load latest locations" });
  }
};

/**
 * GET /api/admin/locations/day-route
 * Query: userId (required), date=YYYY-MM-DD (required)
 * Returns all points for that day (sorted)
 */
export const getEmployeeDayRoute = async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();
    const date = String(req.query.date || "").trim();

    if (!userId || !date) {
      return res.status(400).json({ message: "userId and date are required" });
    }

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const points = await EmployeeLocation.find({
      userId,
      capturedAt: { $gte: start, $lte: end },
    })
      .sort({ capturedAt: 1 })
      .lean();

    return res.json({
      status: "success",
      data: points.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        accuracy: p.accuracy || 0,
        capturedAt: p.capturedAt,
        source: p.source || "browser",
      })),
    });
  } catch (err) {
    console.error("getEmployeeDayRoute:", err);
    return res.status(500).json({ message: "Failed to load day route" });
  }
};
