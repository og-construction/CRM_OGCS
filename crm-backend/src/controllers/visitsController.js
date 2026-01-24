// src/controllers/visitsController.js
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Visit from "../models/visitModel.js";
import Lead from "../models/leadModel.js";

const normalizePhone = (v) => String(v || "").replace(/\D/g, "").slice(-10);

/** ✅ Build safe GeoJSON location (ONLY if coordinates valid) */
const buildSafeLocation = (body) => {
  const coords = body?.location?.coordinates;

  if (Array.isArray(coords) && coords.length === 2) {
    const [lng, lat] = coords.map(Number);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return { type: "Point", coordinates: [lng, lat] };
    }
  }
  return undefined; // do not save location field if invalid
};

/**
 * ✅ POST /api/visits/my
 * Returns: Visit document (direct object)
 */
export const createVisit = asyncHandler(async (req, res) => {
  const body = req.body || {};

  if (!body.placeName || String(body.placeName).trim().length < 2) {
    res.status(400);
    throw new Error("placeName is required");
  }

  const safeLocation = buildSafeLocation(body);

  const visit = await Visit.create({
    userId: req.user._id,
    placeName: String(body.placeName).trim(),
    siteType: body.siteType || "Site",
    address: String(body.address || "").trim(),
    city: String(body.city || "").trim(),

    ...(safeLocation ? { location: safeLocation } : {}),

    visitedAt: body.visitedAt ? new Date(body.visitedAt) : new Date(),
    checkInAt: body.checkInAt ? new Date(body.checkInAt) : new Date(),
    checkOutAt: body.checkOutAt ? new Date(body.checkOutAt) : null,

    metPeople: Array.isArray(body.metPeople) ? body.metPeople : [],
    tags: Array.isArray(body.tags) ? body.tags : [],
  });

  // ✅ IMPORTANT: return visit directly (frontend expects _id/placeName at root)
  res.status(201).json(visit);
});

/**
 * ✅ GET /api/visits/my
 * Supports:
 * - date=YYYY-MM-DD (optional)  [UTC day]
 * - from=YYYY-MM-DD&to=YYYY-MM-DD (optional)
 * - page & limit (optional)
 *
 * Returns: { items, page, pages, total, limit }
 */
export const getMyVisits = asyncHandler(async (req, res) => {
  const { date, from, to, page = 1, limit = 20 } = req.query;

  const q = { userId: req.user._id };

  // ✅ date filter (single day - UTC)
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    q.visitedAt = { $gte: start, $lte: end };
  }

  // ✅ range filter (overrides date if provided)
  if (from || to) {
    const fromDt = from ? new Date(from) : null;
    const toDt = to ? new Date(to) : null;

    if (fromDt && Number.isNaN(fromDt.getTime())) {
      res.status(400);
      throw new Error("Invalid from date");
    }
    if (toDt && Number.isNaN(toDt.getTime())) {
      res.status(400);
      throw new Error("Invalid to date");
    }

    q.visitedAt = {};
    if (fromDt) q.visitedAt.$gte = fromDt;
    if (toDt) q.visitedAt.$lte = toDt;
  }

  const p = Math.max(1, Number(page) || 1);
  const lim = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (p - 1) * lim;

  const [items, total] = await Promise.all([
    Visit.find(q)
      .sort({ visitedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .populate("metPeople.leadId", "leadType name company phone email status"),
    Visit.countDocuments(q),
  ]);

  const pages = Math.max(1, Math.ceil(total / lim) || 1);

  // ✅ STANDARD SHAPE (frontend expects items)
  res.json({ items, page: p, pages, total, limit: lim });
});

/**
 * ✅ POST /api/visits/:visitId/create-lead
 * Body: { idx } OR { metIndex }
 * Returns: { lead, message }
 */
export const createLeadFromMetPerson = asyncHandler(async (req, res) => {
  const { visitId } = req.params;

  // ✅ accept both idx (frontend) and metIndex (alternate)
  const metIndexRaw = req.body?.idx ?? req.body?.metIndex;
  const metIndex = Number(metIndexRaw);

  if (!mongoose.Types.ObjectId.isValid(visitId)) {
    res.status(400);
    throw new Error("Invalid visitId");
  }
  if (!Number.isInteger(metIndex) || metIndex < 0) {
    res.status(400);
    throw new Error("idx/metIndex is required and must be a valid number");
  }

  const visit = await Visit.findOne({ _id: visitId, userId: req.user._id });
  if (!visit) {
    res.status(404);
    throw new Error("Visit not found");
  }

  const mp = visit.metPeople?.[metIndex];
  if (!mp) {
    res.status(400);
    throw new Error("Invalid met person index");
  }

  // Already linked
  if (mp.leadId) {
    const existing = await Lead.findOne({ _id: mp.leadId, ownerId: req.user._id });
    return res.json({ lead: existing, message: "Already linked" });
  }

  const normalizedPhone = normalizePhone(mp.phone);
  const email = String(mp.email || "").trim().toLowerCase();

  // ✅ Duplicate prevention: owner + phone OR email
  let lead = null;
  if (normalizedPhone || email) {
    lead = await Lead.findOne({
      ownerId: req.user._id,
      $or: [
        normalizedPhone ? { normalizedPhone } : null,
        email ? { email } : null,
      ].filter(Boolean),
    });
  }

  // If not found, create
  if (!lead) {
    lead = await Lead.create({
      ownerId: req.user._id,
      leadType: mp.leadType || "Buyer",
      name: mp.name,
      company: mp.company || "",
      phone: normalizedPhone ? (mp.phone || "") : "",
      normalizedPhone,
      email,
      city: visit.city || "",
      address: visit.address || "",
      description: mp.conversationNotes || "",
      source: "Visit",
      status: "New",
      lastVisitId: visit._id,
    });
  } else {
    // Update lastVisitId (keep latest visit)
    lead.lastVisitId = visit._id;
    await lead.save();
  }

  // Link it back into visit.metPeople
  visit.metPeople[metIndex].leadId = lead._id;
  await visit.save();

  res.json({ lead, message: "Lead linked/created successfully" });
});

/**
 * ✅ PATCH /api/visits/my/:id/location
 * Body: { location: { type:"Point", coordinates:[lng,lat] } }
 * Returns: { ok:true, visitId, location }
 */
export const updateMyVisitLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { location } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid visit id");
  }

  if (!location || location.type !== "Point" || !Array.isArray(location.coordinates)) {
    res.status(400);
    throw new Error("Invalid location");
  }

  const [lng, lat] = location.coordinates.map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    res.status(400);
    throw new Error("Invalid coordinates");
  }

  const visit = await Visit.findOne({ _id: id, userId: req.user._id });
  if (!visit) {
    res.status(404);
    throw new Error("Visit not found");
  }

  visit.location = { type: "Point", coordinates: [lng, lat] };
  await visit.save();

  res.json({ ok: true, visitId: visit._id, location: visit.location });
});


export const updateVisitLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coords = req.body?.location?.coordinates;
  let loc;

  if (Array.isArray(coords) && coords.length === 2) {
    const [lng, lat] = coords.map(Number);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      loc = { type: "Point", coordinates: [lng, lat] };
    }
  }

  if (!loc) {
    res.status(400);
    throw new Error("Valid location.coordinates [lng,lat] required");
  }

  const visit = await Visit.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    { $set: { location: loc } },
    { new: true }
  );

  if (!visit) {
    res.status(404);
    throw new Error("Visit not found");
  }

  res.json({ success: true, location: visit.location });
});


export const updateLeadFollowUp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { followUpDate, status, description } = req.body;

  const lead = await Lead.findOne({ _id: id, ownerId: req.user._id });
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  if (followUpDate) lead.followUpDate = new Date(followUpDate); // if field exists in schema
  if (status) lead.status = status;
  if (description) lead.description = description;

  await lead.save();
  res.json({ success: true, lead });
});
