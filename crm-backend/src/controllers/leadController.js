// src/controllers/leadController.js
import Lead from "../models/Lead.js";

const allowedStatuses = ["New", "Follow-Up", "Closed", "Converted"];
const allowedLeadTypes = ["Buyer", "Contractor", "Seller", "Manufacturer"];

const trimStr = (v) => String(v ?? "").trim();
const lowerStr = (v) => trimStr(v).toLowerCase();

const cleanPhone10 = (v) => {
  const digits = String(v ?? "").replace(/\D/g, "");
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

const isValidEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ✅ Works with BOTH schema styles: ownerId OR owner
const ownerFilter = (userId) => ({
  $or: [{ ownerId: userId }, { owner: userId }],
});

/**
 * ✅ BUILD QUERY (status + leadType + search)
 */
const buildSearchQuery = (userId, search = "", status = "All", leadType = "All") => {
  const q = ownerFilter(userId);

  if (status && status !== "All") q.status = status;
  if (leadType && leadType !== "All") q.leadType = leadType;

  const s = trimStr(search);
  if (s) {
    const sDigits = s.replace(/\D/g, "");
    q.$and = q.$and || [];
    q.$and.push({
      $or: [
        { name: { $regex: s, $options: "i" } },
        { company: { $regex: s, $options: "i" } },
        { city: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        ...(sDigits ? [{ phone: { $regex: sDigits } }] : []),
      ],
    });
  }

  return q;
};

/**
 * =========================================================
 * GET /api/leads/my?status=All&leadType=Buyer&search=
 * =========================================================
 */
export const getMyLeads = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const { status = "All", leadType = "All", search = "" } = req.query;

    if (leadType !== "All" && !allowedLeadTypes.includes(leadType)) {
      return res.status(400).json({ message: "Invalid lead type" });
    }

    const query = buildSearchQuery(req.user._id, search, status, leadType);
    const items = await Lead.find(query).sort({ createdAt: -1 });

    return res.json({ items });
  } catch (err) {
    console.error("getMyLeads error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * =========================================================
 * POST /api/leads/my
 * =========================================================
 */
export const createMyLead = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const name = trimStr(req.body.name);
    const company = trimStr(req.body.company);
    const phone = cleanPhone10(req.body.phone);
    const email = lowerStr(req.body.email);
    const city = trimStr(req.body.city);
    const address = trimStr(req.body.address);
    const description = trimStr(req.body.description);
    const source = trimStr(req.body.source) || "Manual";
    const status = trimStr(req.body.status) || "New";
    const leadType = trimStr(req.body.leadType) || "Buyer";

    if (!name) return res.status(400).json({ message: "Name is required" });

    if (!allowedLeadTypes.includes(leadType)) {
      return res.status(400).json({ message: "Invalid lead type" });
    }

    if (phone && phone.length !== 10) {
      return res.status(400).json({ message: "Phone must be 10 digits" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // ✅ Duplicate check (same owner + phone OR email)
    const dup = await Lead.findOne({
      ...ownerFilter(req.user._id),
      $or: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])],
    });

    if (dup) {
      return res.status(409).json({ message: "Duplicate lead (same phone/email)" });
    }

    const lead = await Lead.create({
      ownerId: req.user._id,
      owner: req.user._id, // compatibility
      leadType,
      name,
      company,
      phone: phone || undefined,
      email: email || undefined,
      city,
      address,
      description,
      source,
      status,
    });

    return res.status(201).json({ lead });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate lead (unique index hit)" });
    }

    console.error("createMyLead error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * =========================================================
 * PUT /api/leads/my/:id
 * =========================================================
 */
export const updateMyLead = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const lead = await Lead.findOne({ _id: id, ...ownerFilter(req.user._id) });
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    const name = trimStr(req.body.name);
    const company = trimStr(req.body.company);
    const phone = cleanPhone10(req.body.phone);
    const email = lowerStr(req.body.email);
    const city = trimStr(req.body.city);
    const address = trimStr(req.body.address);
    const description = trimStr(req.body.description);
    const source = trimStr(req.body.source);
    const status = trimStr(req.body.status);
    const leadType = trimStr(req.body.leadType);

    if (name === "") return res.status(400).json({ message: "Name is required" });

    if (leadType && !allowedLeadTypes.includes(leadType)) {
      return res.status(400).json({ message: "Invalid lead type" });
    }

    if (phone && phone.length !== 10) {
      return res.status(400).json({ message: "Phone must be 10 digits" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    lead.name = name || lead.name;
    lead.company = company;
    lead.phone = phone || undefined;
    lead.email = email || undefined;
    lead.city = city;
    lead.address = address;
    lead.description = description;
    lead.source = source || lead.source;

    if (status) lead.status = status;
    if (leadType) lead.leadType = leadType;

    // migration safety
    if (!lead.ownerId) lead.ownerId = req.user._id;
    if (!lead.owner) lead.owner = req.user._id;

    await lead.save();
    return res.json({ lead });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate lead (unique index hit)" });
    }

    console.error("updateMyLead error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * =========================================================
 * DELETE /api/leads/my/:id
 * =========================================================
 */
export const deleteMyLead = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const lead = await Lead.findOne({ _id: id, ...ownerFilter(req.user._id) });
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    await lead.deleteOne();
    return res.json({ message: "Lead deleted" });
  } catch (err) {
    console.error("deleteMyLead error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * =========================================================
 * POST /api/leads/my/import
 * =========================================================
 */
export const importMyLeads = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const items = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.items)
      ? req.body.items
      : [];

    if (!items.length) {
      return res.status(400).json({ message: "No items provided for import" });
    }

    let added = 0;
    let skippedDuplicate = 0;
    let skippedInvalid = 0;

    for (const raw of items) {
      const name = trimStr(raw?.name);
      const company = trimStr(raw?.company);
      const phone = cleanPhone10(raw?.phone);
      const email = lowerStr(raw?.email);
      const city = trimStr(raw?.city);
      const address = trimStr(raw?.address);
      const description = trimStr(raw?.description);
      const source = trimStr(raw?.source) || "Import";
      const status = trimStr(raw?.status) || "New";
      const leadType = trimStr(raw?.leadType) || "Buyer";

      if (!name) { skippedInvalid++; continue; }
      if (!allowedLeadTypes.includes(leadType)) { skippedInvalid++; continue; }
      if (phone && phone.length !== 10) { skippedInvalid++; continue; }
      if (!isValidEmail(email)) { skippedInvalid++; continue; }
      if (status && !allowedStatuses.includes(status)) { skippedInvalid++; continue; }

      const dup = await Lead.findOne({
        ...ownerFilter(req.user._id),
        $or: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])],
      });

      if (dup) { skippedDuplicate++; continue; }

      await Lead.create({
        ownerId: req.user._id,
        owner: req.user._id,
        leadType,
        name,
        company,
        phone: phone || undefined,
        email: email || undefined,
        city,
        address,
        description,
        source,
        status,
      });

      added++;
    }

    return res.json({ added, skippedDuplicate, skippedInvalid });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate lead (unique index hit)" });
    }

    console.error("importMyLeads error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   ✅ FOLLOW-UP APIs (Fix 404 in Notification.jsx)
   ========================================================= */

/** Local helpers */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * ✅ PATCH /api/leads/my/:id/followup
 * Body: { followUpDate, followUpNotes }
 */
export const updateLeadFollowUp = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { followUpDate, followUpNotes } = req.body;

    if (!followUpDate) {
      return res.status(400).json({ message: "followUpDate is required" });
    }

    const dt = new Date(followUpDate);
    if (Number.isNaN(dt.getTime())) {
      return res.status(400).json({ message: "followUpDate must be a valid date" });
    }

    const lead = await Lead.findOne({ _id: id, ...ownerFilter(req.user._id) });
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    lead.followUpDate = dt;
    lead.followUpNotes = trimStr(followUpNotes) || "";

    await lead.save();
    return res.json({ message: "Follow-up updated", lead });
  } catch (err) {
    console.error("updateLeadFollowUp error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

/**
 * ✅ GET /api/leads/my/followups/summary
 * Response: { today, upcoming, overdue }
 */
export const getMyFollowUpsSummary = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const s = startOfToday();
    const e = endOfToday();

    const base = {
      ...ownerFilter(req.user._id),
      followUpDate: { $ne: null },
    };

    const [today, upcoming, overdue] = await Promise.all([
      Lead.countDocuments({ ...base, followUpDate: { $gte: s, $lte: e } }),
      Lead.countDocuments({ ...base, followUpDate: { $gt: e } }),
      Lead.countDocuments({ ...base, followUpDate: { $lt: s } }),
    ]);

    return res.json({ today, upcoming, overdue });
  } catch (err) {
    console.error("getMyFollowUpsSummary error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

/**
 * ✅ GET /api/leads/my/followups?bucket=today&page=1&limit=50
 * Response: { items, page, pages, total, limit }
 */
export const getMyFollowUps = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const bucket = String(req.query.bucket || "today").toLowerCase();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const skip = (page - 1) * limit;

    const s = startOfToday();
    const e = endOfToday();

    const filter = {
      ...ownerFilter(req.user._id),
      followUpDate: { $ne: null },
    };

    if (bucket === "today") filter.followUpDate = { $gte: s, $lte: e };
    else if (bucket === "upcoming") filter.followUpDate = { $gt: e };
    else if (bucket === "overdue") filter.followUpDate = { $lt: s };
    else return res.status(400).json({ message: "Invalid bucket. Use today|upcoming|overdue" });

    const [items, total] = await Promise.all([
      Lead.find(filter)
        .sort({ followUpDate: 1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name leadType company city status followUpDate followUpNotes phone email"),
      Lead.countDocuments(filter),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));

    return res.json({ items, page, pages, total, limit });
  } catch (err) {
    console.error("getMyFollowUps error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

