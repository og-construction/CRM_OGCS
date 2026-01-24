import Lead from "../models/leadModel.js";

const allowedStatuses = ["New", "Follow-Up", "Closed", "Converted"];
const allowedLeadTypes = ["Buyer", "Contractor", "Seller", "Manufacturer"];

const trim = (v) => String(v ?? "").trim();

/**
 * GET /api/admin/leads
 */
export const adminGetLeads = async (req, res) => {
  try {
    const {
      status = "All",
      leadType = "All",
      search = "",
      owner = "",
    } = req.query;

    const q = {};

    if (status !== "All") q.status = status;
    if (leadType !== "All") q.leadType = leadType;
    if (owner) q.owner = owner;

    if (search) {
      const s = trim(search);
      const sDigits = s.replace(/\D/g, "");
      q.$or = [
        { name: { $regex: s, $options: "i" } },
        { company: { $regex: s, $options: "i" } },
        { city: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
      ];
      if (sDigits) q.$or.push({ phone: { $regex: sDigits } });
    }

    const items = await Lead.find(q)
      .sort({ createdAt: -1 })
      .populate("owner", "name email role")
      .populate("assignedTo", "name email role");

    return res.json({ items });
  } catch (err) {
    console.error("adminGetLeads:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/admin/leads/:id
 */
export const adminGetLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate("owner", "name email role")
      .populate("assignedTo", "name email role");

    if (!lead) return res.status(404).json({ message: "Lead not found" });

    return res.json({ lead });
  } catch (err) {
    console.error("adminGetLeadById:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/admin/leads/:id
 */
export const adminUpdateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    const allowed = [
      "name",
      "company",
      "phone",
      "email",
      "city",
      "address",
      "description",
      "source",
      "status",
      "leadType",
      "assignedTo",
      "owner",
    ];

    for (const k of allowed) {
      if (req.body[k] !== undefined) lead[k] = req.body[k];
    }

    if (lead.status && !allowedStatuses.includes(lead.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (lead.leadType && !allowedLeadTypes.includes(lead.leadType)) {
      return res.status(400).json({ message: "Invalid lead type" });
    }

    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate("owner", "name email role")
      .populate("assignedTo", "name email role");

    return res.json({ lead: populated });
  } catch (err) {
    console.error("adminUpdateLead:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/admin/leads/:id/assign
 */
export const adminAssignLead = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    lead.assignedTo = assignedTo || null;
    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate("owner", "name email role")
      .populate("assignedTo", "name email role");

    return res.json({ lead: populated });
  } catch (err) {
    console.error("adminAssignLead:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/admin/leads/:id
 */
export const adminDeleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    await lead.deleteOne();
    return res.json({ message: "Lead deleted" });
  } catch (err) {
    console.error("adminDeleteLead:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
