// backend/controllers/leadController.js
import Lead from "../models/Lead.js";

const normalizePhone = (v) => String(v ?? "").replace(/\D/g, "").slice(-10);
const normalizeEmail = (v) => String(v ?? "").trim().toLowerCase();

const validateLead = (l) => {
  if (!String(l.name || "").trim()) return "Name is required";
  const phone = normalizePhone(l.phone);
  const email = normalizeEmail(l.email);

  if (!phone && !email) return "Phone or Email is required";
  if (phone && phone.length !== 10) return "Phone must be 10 digits";
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return "Email is invalid";
  return "";
};

export const getMyLeads = async (req, res) => {
  try {
    const { status = "", search = "" } = req.query;

    const query = { assignedTo: req.user._id };

    if (status && status !== "All") query.status = status;

    if (search) {
      const q = String(search).trim();
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json({ items: leads });
  } catch (err) {
    console.error("getMyLeads:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createLead = async (req, res) => {
  try {
    const payload = req.body || {};

    const leadData = {
      name: payload.name,
      company: payload.company || "",
      phone: normalizePhone(payload.phone),
      email: normalizeEmail(payload.email),
      city: payload.city || "",
      requirement: payload.requirement || "",
      source: payload.source || "Manual",
      status: payload.status || "New",
      assignedTo: req.user._id,
      createdBy: req.user._id,
    };

    const errMsg = validateLead(leadData);
    if (errMsg) return res.status(400).json({ message: errMsg });

    // duplicate check for this user
    if (leadData.phone) {
      const existsPhone = await Lead.findOne({
        assignedTo: req.user._id,
        phone: leadData.phone,
      });
      if (existsPhone)
        return res.status(400).json({ message: "Duplicate phone lead exists." });
    }
    if (leadData.email) {
      const existsEmail = await Lead.findOne({
        assignedTo: req.user._id,
        email: leadData.email,
      });
      if (existsEmail)
        return res.status(400).json({ message: "Duplicate email lead exists." });
    }

    const lead = await Lead.create(leadData);
    res.status(201).json({ message: "Lead created", lead });
  } catch (err) {
    console.error("createLead:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Excel/CSV import will send array of leads: {items:[...]}
export const importLeads = async (req, res) => {
  try {
    const items = req.body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items to import" });
    }

    // Build existing sets for dedupe
    const existing = await Lead.find({ assignedTo: req.user._id }).select(
      "phone email"
    );

    const phoneSet = new Set(existing.map((x) => x.phone).filter(Boolean));
    const emailSet = new Set(existing.map((x) => x.email).filter(Boolean));

    let added = 0;
    let skippedDuplicate = 0;
    let skippedInvalid = 0;

    const toInsert = [];

    for (const raw of items) {
      const leadData = {
        name: raw.name,
        company: raw.company || "",
        phone: normalizePhone(raw.phone),
        email: normalizeEmail(raw.email),
        city: raw.city || "",
        requirement: raw.requirement || "",
        source: raw.source || "Excel",
        status: raw.status || "New",
        assignedTo: req.user._id,
        createdBy: req.user._id,
      };

      const errMsg = validateLead(leadData);
      if (errMsg) {
        skippedInvalid++;
        continue;
      }

      const dupPhone = leadData.phone && phoneSet.has(leadData.phone);
      const dupEmail = leadData.email && emailSet.has(leadData.email);

      if (dupPhone || dupEmail) {
        skippedDuplicate++;
        continue;
      }

      if (leadData.phone) phoneSet.add(leadData.phone);
      if (leadData.email) emailSet.add(leadData.email);

      toInsert.push(leadData);
      added++;
    }

    if (toInsert.length) await Lead.insertMany(toInsert);

    res.json({
      message: "Import completed",
      added,
      skippedDuplicate,
      skippedInvalid,
    });
  } catch (err) {
    console.error("importLeads:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyFollowUps = async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ start/end of today (server time)
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Only follow-up leads
    const baseQuery = {
      assignedTo: userId,
      status: "Follow-Up",
      nextFollowUpAt: { $ne: null },
    };

    const [today, upcoming, overdue] = await Promise.all([
      Lead.find({ ...baseQuery, nextFollowUpAt: { $gte: start, $lte: end } }).sort({
        nextFollowUpAt: 1,
      }),
      Lead.find({ ...baseQuery, nextFollowUpAt: { $gt: end } }).sort({
        nextFollowUpAt: 1,
      }),
      Lead.find({ ...baseQuery, nextFollowUpAt: { $lt: start } }).sort({
        nextFollowUpAt: 1,
      }),
    ]);

    return res.json({ today, upcoming, overdue });
  } catch (err) {
    console.error("getMyFollowUps:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ set / update follow-up date for a lead
export const setMyFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { nextFollowUpAt, status } = req.body;

    const lead = await Lead.findOne({ _id: id, assignedTo: req.user._id });
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // update follow-up date
    if (nextFollowUpAt) {
      lead.nextFollowUpAt = new Date(nextFollowUpAt);
      lead.lastFollowUpAt = new Date();
      lead.status = "Follow-Up"; // force follow-up if date set
    }

    // optional status update
    if (status && ["New", "Follow-Up", "Closed", "Converted"].includes(status)) {
      lead.status = status;
      if (status !== "Follow-Up") {
        lead.nextFollowUpAt = null; // if closed/converted, clear follow-up date
      }
    }

    await lead.save();
    return res.json({ message: "Follow-up updated", lead });
  } catch (err) {
    console.error("setMyFollowUp:", err);
    return res.status(500).json({ message: "Server error" });
  }
};




// Admin: Get reports (filters optional)
export const getAdminDailyReports = async (req, res) => {
  try {
    const { date, member } = req.query;

    const filter = {};
    if (date) filter.reportDate = date;
    if (member) filter.memberName = new RegExp(member, "i");

    const reports = await DailyReport.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const totalReports = reports.length;
    const today = new Date().toISOString().slice(0, 10);

    const todayReports = reports.filter(
      (r) => r.reportDate === today
    ).length;

    const withAttachment = reports.filter(
      (r) => r.attachment?.url
    ).length;

    const uniqueMembers = new Set(reports.map((r) => r.memberName)).size;

    return res.json({
      status: "success",
      data: {
        summary: {
          totalReports,
          todayReports,
          withAttachment,
          uniqueMembers,
        },
        reports,
      },
    });
  } catch (err) {
    console.error("getAdminDailyReports error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load daily reports" });
  }
};
