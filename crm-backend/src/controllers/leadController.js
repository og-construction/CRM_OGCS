import Lead from "../models/Lead.js";

const allowedStatuses = ["New", "Follow-Up", "Closed", "Converted"];

const trimStr = (v) => String(v ?? "").trim();
const lowerStr = (v) => trimStr(v).toLowerCase();

const cleanPhone10 = (v) => {
  const digits = String(v ?? "").replace(/\D/g, "");
  // keep last 10 digits if user entered country code etc.
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

const isValidEmail = (email) => {
  if (!email) return true; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const buildSearchQuery = (ownerId, search = "", status = "All") => {
  const q = { owner: ownerId };

  if (status && status !== "All") q.status = status;

  const s = trimStr(search);
  if (s) {
    const sDigits = s.replace(/\D/g, "");
    q.$or = [
      { name: { $regex: s, $options: "i" } },
      { company: { $regex: s, $options: "i" } },
      { city: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
    ];
    if (sDigits) q.$or.push({ phone: { $regex: sDigits } });
  }

  return q;
};

// GET /api/leads/my?status=All&search=
export const getMyLeads = async (req, res) => {
  try {
    const { status = "All", search = "" } = req.query;

    const query = buildSearchQuery(req.user._id, search, status);
    const items = await Lead.find(query).sort({ createdAt: -1 });

    return res.json({ items });
  } catch (err) {
    console.error("getMyLeads error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/leads/my
export const createMyLead = async (req, res) => {
  try {
    const name = trimStr(req.body.name);
    const company = trimStr(req.body.company);
    const phone = cleanPhone10(req.body.phone);
    const email = lowerStr(req.body.email);
    const city = trimStr(req.body.city);
    const address = trimStr(req.body.address);
    const description = trimStr(req.body.description);
    const source = trimStr(req.body.source) || "Manual";
    const status = trimStr(req.body.status) || "New";

    if (!name) return res.status(400).json({ message: "Name is required" });

    if (phone && phone.length !== 10) {
      return res.status(400).json({ message: "Phone must be 10 digits" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Optional duplicate warning logic (NOT blocking)
    // If you want to block duplicates, change logic to return 409.
    const dup = await Lead.findOne({
      owner: req.user._id,
      $or: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : []),
      ],
    });

    const lead = await Lead.create({
      owner: req.user._id,
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

    return res.status(201).json({
      lead,
      duplicateFound: !!dup,
    });
  } catch (err) {
    console.error("createMyLead error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/leads/my/:id
export const updateMyLead = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findOne({ _id: id, owner: req.user._id });
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

    if (name === "") return res.status(400).json({ message: "Name is required" });

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

    await lead.save();
    return res.json({ lead });
  } catch (err) {
    console.error("updateMyLead error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/leads/my/:id
export const deleteMyLead = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findOne({ _id: id, owner: req.user._id });
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    await lead.deleteOne();
    return res.json({ message: "Lead deleted" });
  } catch (err) {
    console.error("deleteMyLead error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/leads/my/import
export const importMyLeads = async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];

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

      if (!name) {
        skippedInvalid++;
        continue;
      }

      if (phone && phone.length !== 10) {
        skippedInvalid++;
        continue;
      }

      if (!isValidEmail(email)) {
        skippedInvalid++;
        continue;
      }

      if (status && !allowedStatuses.includes(status)) {
        skippedInvalid++;
        continue;
      }

      // duplicate check (by owner + phone OR email)
      const dup = await Lead.findOne({
        owner: req.user._id,
        $or: [
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : []),
        ],
      });

      if (dup) {
        skippedDuplicate++;
        continue;
      }

      await Lead.create({
        owner: req.user._id,
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
    console.error("importMyLeads error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
