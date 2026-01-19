import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import EmployeeLocation from "../models/EmployeeLocation.js";

/**
 * GET /api/admin/locations/latest?page=&limit=&q=
 * Returns latest location per user + employee info
 */
export const getLatestLocations = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Number(req.query.limit || 20));
  const q = String(req.query.q || "").trim();
  const skip = (page - 1) * limit;

  const matchStage = {};
  if (q) {
    matchStage.$or = [
      { "user.name": { $regex: q, $options: "i" } },
      { "user.email": { $regex: q, $options: "i" } },
      { "user.phone": { $regex: q, $options: "i" } },
    ];
  }

  const basePipeline = [
    { $sort: { capturedAt: -1 } },
    {
      $group: {
        _id: "$userId",
        lat: { $first: "$lat" },
        lng: { $first: "$lng" },
        accuracy: { $first: "$accuracy" },
        capturedAt: { $first: "$capturedAt" },
        source: { $first: "$source" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ...(q ? [{ $match: matchStage }] : []),
    {
      $project: {
        _id: 1, // userId
        userId: "$_id", // for day-route
        lat: 1,
        lng: 1,
        accuracy: 1,
        capturedAt: 1,
        source: 1,
        employee: {
          _id: "$user._id",
          name: "$user.name",
          email: "$user.email",
          phone: "$user.phone",
        },
      },
    },
  ];

  const [data, countAgg] = await Promise.all([
    EmployeeLocation.aggregate([...basePipeline, { $skip: skip }, { $limit: limit }]),
    EmployeeLocation.aggregate([...basePipeline, { $count: "count" }]),
  ]);

  const total = countAgg?.[0]?.count || 0;

  return res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/**
 * GET /api/admin/locations/day-route?userId=...&date=YYYY-MM-DD
 * Returns all points for that IST day.
 * If empty -> fallback to latest available day for that user.
 */
export const getDayRoute = asyncHandler(async (req, res) => {
  const { userId, date } = req.query;

  if (!userId || !date) {
    return res.status(400).json({ message: "userId and date are required", data: [] });
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId", data: [] });
  }

  const uid = new mongoose.Types.ObjectId(userId);

  const getRangeIST = (ymd) => {
    const start = new Date(`${ymd}T00:00:00.000+05:30`);
    const end = new Date(`${ymd}T23:59:59.999+05:30`);
    return { start, end };
  };

  // 1) try requested date
  const { start, end } = getRangeIST(date);

  let rows = await EmployeeLocation.find({
    userId: uid,
    capturedAt: { $gte: start, $lte: end },
  })
    .sort({ capturedAt: 1 })
    .select("lat lng accuracy capturedAt source");

  if (rows.length) {
    return res.json({ data: rows, usedDate: date, fallback: false });
  }

  // 2) fallback to latest saved date for this user
  const latest = await EmployeeLocation.findOne({ userId: uid })
    .sort({ capturedAt: -1 })
    .select("capturedAt");

  if (!latest?.capturedAt) {
    return res.json({
      data: [],
      usedDate: date,
      fallback: false,
      message: "No location data exists for this user.",
    });
  }

  // convert latest capturedAt to IST date string
  const latestIST = new Date(latest.capturedAt.getTime() + 5.5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const r2 = getRangeIST(latestIST);

  rows = await EmployeeLocation.find({
    userId: uid,
    capturedAt: { $gte: r2.start, $lte: r2.end },
  })
    .sort({ capturedAt: 1 })
    .select("lat lng accuracy capturedAt source");

  return res.json({
    data: rows,
    usedDate: latestIST,
    fallback: true,
    message: `No data for ${date}. Showing latest available day: ${latestIST}`,
  });
});