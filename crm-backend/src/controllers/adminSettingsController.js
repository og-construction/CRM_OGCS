import asyncHandler from "express-async-handler";
import AdminSettings from "../models/AdminSettings.js";

// ✅ GET Admin Settings
export const getAdminSettings = asyncHandler(async (req, res) => {
  let settings = await AdminSettings.findOne();

  // if no settings in DB, create default
  if (!settings) {
    settings = await AdminSettings.create({});
  }

  return res.json(settings);
});

// ✅ UPDATE Admin Settings
export const updateAdminSettings = asyncHandler(async (req, res) => {
  const settings = await AdminSettings.findOneAndUpdate(
    {},
    { $set: req.body },
    { new: true, upsert: true }
  );

  return res.json(settings);
});
