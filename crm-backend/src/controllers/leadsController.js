// src/controllers/leadsController.js
import asyncHandler from "express-async-handler";
import Lead from "../models/leadModel.js";

const normalizePhone = (v) => String(v || "").replace(/\D/g, "").slice(-10);

/**
 * ✅ GET /api/leads/my
 * Supports: status, leadType, search, page, limit
 * Returns: { success, items, page, pages, total, limit }
 */
export const getMyLeads = asyncHandler(async (req, res) => {
  const { status = "All", leadType = "All", search = "", page = 1, limit = 20 } = req.query;

  const q = { ownerId: req.user._id };

  if (status !== "All") q.status = status;
  if (leadType !== "All") q.leadType = leadType;

  if (search?.trim()) {
    const s = search.trim();
    const rx = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    q.$or = [
      { name: rx },
      { company: rx },
      { phone: rx },
      { email: rx },
      { city: rx },
    ];
  }

  const p = Math.max(1, Number(page) || 1);
  const lim = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (p - 1) * lim;

  const [items, total] = await Promise.all([
    Lead.find(q).sort({ createdAt: -1 }).skip(skip).limit(lim),
    Lead.countDocuments(q),
  ]);

  const pages = Math.max(1, Math.ceil(total / lim));

  res.json({ success: true, items, page: p, pages, total, limit: lim });
});

/**
 * ✅ POST /api/leads/my
 * Returns: { lead }
 */
export const createMyLead = asyncHandler(async (req, res) => {
  const body = req.body || {};

  if (!body.name) {
    res.status(400);
    throw new Error("Name is required");
  }

  const normalizedPhone = normalizePhone(body.phone);
  const email = String(body.email || "").trim().toLowerCase();

  // ✅ Pre-check duplicates (good UX)
  const duplicate = await Lead.findOne({
    ownerId: req.user._id,
    $or: [
      normalizedPhone ? { normalizedPhone } : null,
      email ? { email } : null,
    ].filter(Boolean),
  });

  if (duplicate) {
    res.status(409);
    throw new Error("Lead already exists for this phone/email");
  }

  try {
    const lead = await Lead.create({
      ownerId: req.user._id,
      leadType: body.leadType || "Buyer",
      name: String(body.name).trim(),
      company: String(body.company || "").trim(),
      phone: normalizedPhone ? String(body.phone || "").trim() : "",
      normalizedPhone,
      email,
      city: String(body.city || "").trim(),
      address: String(body.address || "").trim(),
      description: String(body.description || "").trim(),
      source: String(body.source || "Manual").trim(),
      status: body.status || "New",
      lastVisitId: body.lastVisitId || null,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
      followUpNotes: body.followUpNotes !== undefined ? String(body.followUpNotes || "") : undefined,
    });

    res.status(201).json({ success: true, lead });
  } catch (err) {
    // ✅ DB-level unique index protection
    if (err?.code === 11000) {
      res.status(409);
      throw new Error("Duplicate lead already exists (phone/email)");
    }
    throw err;
  }
});

/**
 * ✅ PUT /api/leads/my/:id
 * Prevent duplicates on update too.
 */
export const updateMyLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await Lead.findOne({ _id: id, ownerId: req.user._id });
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const body = req.body || {};
  const normalizedPhone = normalizePhone(body.phone ?? lead.phone);
  const email = body.email !== undefined ? String(body.email || "").trim().toLowerCase() : lead.email;

  // ✅ if phone/email is changing -> check duplicates (exclude current lead)
  const shouldCheckDup =
    (normalizedPhone && normalizedPhone !== lead.normalizedPhone) ||
    (email && email !== lead.email);

  if (shouldCheckDup) {
    const duplicate = await Lead.findOne({
      ownerId: req.user._id,
      _id: { $ne: lead._id },
      $or: [
        normalizedPhone ? { normalizedPhone } : null,
        email ? { email } : null,
      ].filter(Boolean),
    });

    if (duplicate) {
      res.status(409);
      throw new Error("Another lead already exists for this phone/email");
    }
  }

  lead.leadType = body.leadType ?? lead.leadType;
  lead.name = body.name ?? lead.name;
  lead.company = body.company ?? lead.company;

  if (body.phone !== undefined) lead.phone = String(body.phone || "").trim();
  lead.normalizedPhone = normalizedPhone || lead.normalizedPhone;

  if (body.email !== undefined) lead.email = email;

  lead.city = body.city ?? lead.city;
  lead.address = body.address ?? lead.address;
  lead.description = body.description ?? lead.description;
  lead.source = body.source ?? lead.source;
  lead.status = body.status ?? lead.status;

  // ✅ Follow-up fields
  if (body.followUpDate !== undefined) {
    lead.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
  }
  if (body.followUpNotes !== undefined) {
    lead.followUpNotes = String(body.followUpNotes || "");
  }

  try {
    const saved = await lead.save();
    res.json({ success: true, lead: saved });
  } catch (err) {
    if (err?.code === 11000) {
      res.status(409);
      throw new Error("Duplicate lead already exists (phone/email)");
    }
    throw err;
  }
});

/**
 * ✅ DELETE /api/leads/my/:id
 */
export const deleteMyLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lead = await Lead.findOne({ _id: id, ownerId: req.user._id });
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }
  await lead.deleteOne();
  res.json({ success: true });
});

/**
 * ✅ POST /api/leads/my/import
 * Frontend sends: { items: [...] }
 * Returns: { added, skippedDuplicate, skippedInvalid }
 */
export const importMyLeads = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : null;
  if (!items) {
    res.status(400);
    throw new Error("Import must be an array in { items: [...] }");
  }

  let added = 0;
  let skippedDuplicate = 0;
  let skippedInvalid = 0;

  for (const row of items) {
    if (!row?.name) {
      skippedInvalid++;
      continue;
    }

    const normalizedPhone = normalizePhone(row.phone);
    const email = String(row.email || "").trim().toLowerCase();

    // ✅ dedupe by phone/email (cheap check)
    if (normalizedPhone || email) {
      const exists = await Lead.findOne({
        ownerId: req.user._id,
        $or: [
          normalizedPhone ? { normalizedPhone } : null,
          email ? { email } : null,
        ].filter(Boolean),
      });

      if (exists) {
        skippedDuplicate++;
        continue;
      }
    }

    try {
      await Lead.create({
        ownerId: req.user._id,
        leadType: row.leadType || "Buyer",
        name: String(row.name).trim(),
        company: String(row.company || "").trim(),
        phone: normalizedPhone ? String(row.phone || "").trim() : "",
        normalizedPhone,
        email,
        city: String(row.city || "").trim(),
        address: String(row.address || "").trim(),
        description: String(row.description || "").trim(),
        source: String(row.source || "Import").trim(),
        status: row.status || "New",
        followUpDate: row.followUpDate ? new Date(row.followUpDate) : undefined,
        followUpNotes: row.followUpNotes !== undefined ? String(row.followUpNotes || "") : undefined,
      });

      added++;
    } catch (err) {
      if (err?.code === 11000) {
        skippedDuplicate++;
        continue;
      }
      throw err;
    }
  }

  res.json({ success: true, added, skippedDuplicate, skippedInvalid });
});

/**
 * ✅ PATCH /api/leads/my/:id/followup
 * Body: { followUpDate, followUpNotes, status }
 */
export const updateLeadFollowUp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { followUpDate, followUpNotes, status } = req.body || {};

  const lead = await Lead.findOne({ _id: id, ownerId: req.user._id });
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  if (followUpDate !== undefined) {
    lead.followUpDate = followUpDate ? new Date(followUpDate) : null;
  }
  if (followUpNotes !== undefined) {
    lead.followUpNotes = String(followUpNotes || "");
  }

  // ✅ Automatically set Follow-Up status if date set and status not provided
  if (status) lead.status = status;
  else if (followUpDate) lead.status = "Follow-Up";

  await lead.save();

  res.json({ success: true, message: "Follow-up updated", lead });
});


export const getMyFollowUps = asyncHandler(async (req, res) => {
  const { from, to, bucket = "all", q = "", page = 1, limit = 50 } = req.query;

  const ownerId = req.user._id;

  const filter = {
    ownerId,
    followUpDate: { $ne: null },
  };

  // date range
  if (from || to) {
    filter.followUpDate = {};
    if (from) filter.followUpDate.$gte = new Date(from);
    if (to) filter.followUpDate.$lte = new Date(to);
  }

  // bucket filter: today/upcoming/overdue/all
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now); end.setHours(23, 59, 59, 999);

  if (bucket === "today") filter.followUpDate = { $gte: start, $lte: end };
  if (bucket === "upcoming") filter.followUpDate = { $gt: end };
  if (bucket === "overdue") filter.followUpDate = { $lt: start };

  // search
  if (q?.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { company: rx }, { phone: rx }, { email: rx }, { city: rx }];
  }

  const p = Math.max(1, Number(page) || 1);
  const lim = Math.min(100, Math.max(1, Number(limit) || 50));
  const skip = (p - 1) * lim;

  const [items, total] = await Promise.all([
    Lead.find(filter).sort({ followUpDate: 1 }).skip(skip).limit(lim),
    Lead.countDocuments(filter),
  ]);

  res.json({ success: true, items, page: p, pages: Math.max(1, Math.ceil(total / lim)), total, limit: lim });
});

export const getMyFollowUpsSummary = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;

  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now); end.setHours(23, 59, 59, 999);

  const base = { ownerId, followUpDate: { $ne: null } };

  const [today, upcoming, overdue] = await Promise.all([
    Lead.countDocuments({ ...base, followUpDate: { $gte: start, $lte: end }, status: "Follow-Up" }),
    Lead.countDocuments({ ...base, followUpDate: { $gt: end }, status: "Follow-Up" }),
    Lead.countDocuments({ ...base, followUpDate: { $lt: start }, status: "Follow-Up" }),
  ]);

  res.json({ success: true, today, upcoming, overdue });
});
