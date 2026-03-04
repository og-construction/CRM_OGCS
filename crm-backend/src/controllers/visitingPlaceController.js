import VisitingPlace from "../models/VisitingPlace.js";

const pickFileMeta = (file) => {
  if (!file) return null;
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    url: `/${process.env.UPLOAD_DIR || "uploads"}/visits/${file.filename}`,
  };
};

// ✅ POST /api/visits
export const createVisit = async (req, res) => {
  try {
    const {
      companyName,
      personName,
      partyType,
      contactName,
      contactPhone,
      contactEmail,
      address,
      status,
      visitedAt,
      notes,
      priority,
      nextFollowUpAt,
    } = req.body;

    if (!companyName || !partyType || !contactName || !visitedAt) {
      return res.status(400).json({
        message: "companyName, partyType, contactName, visitedAt are required.",
      });
    }

    const dt = new Date(visitedAt);
    if (Number.isNaN(dt.getTime())) {
      return res.status(400).json({ message: "visitedAt must be a valid date" });
    }

    const followDt = nextFollowUpAt ? new Date(nextFollowUpAt) : null;
    const nextFollowUpValid =
      followDt && !Number.isNaN(followDt.getTime()) ? followDt : null;

    const visitImage = pickFileMeta(req.files?.visitImage?.[0]);
    const visitingCardImage = pickFileMeta(req.files?.visitingCardImage?.[0]);

    const doc = await VisitingPlace.create({
      companyName: String(companyName).trim(),
      personName: String(personName || "").trim(),
      partyType: String(partyType).trim(),
      contactName: String(contactName).trim(),
      contactPhone: String(contactPhone || "").trim(),
      contactEmail: String(contactEmail || "").trim().toLowerCase(),
      address: String(address || "").trim(),
      initiatedBy: req.user?._id, // protect middleware must set req.user
      status: String(status || "Visited").trim(),
      visitedAt: dt,
      notes: String(notes || "").trim(),

      priority: String(priority || "Medium").trim(),
      nextFollowUpAt: nextFollowUpValid,

      visitImage: visitImage || undefined,
      visitingCardImage: visitingCardImage || undefined,
    });

    return res.status(201).json({ message: "Visit saved", data: doc });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

// ✅ GET /api/visits
export const listVisits = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(5, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;

    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    const partyType = String(req.query.partyType || "").trim();
    const priority = String(req.query.priority || "").trim();
    const onlyMine = String(req.query.onlyMine || "1") === "1";

    const filter = {};
    if (onlyMine && req.user?._id) filter.initiatedBy = req.user._id;
    if (status) filter.status = status;
    if (partyType) filter.partyType = partyType;
    if (priority) filter.priority = priority;
    if (q) filter.$text = { $search: q };

    const [items, total] = await Promise.all([
      VisitingPlace.find(filter)
        .sort({ visitedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      VisitingPlace.countDocuments(filter),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));

    return res.json({ page, limit, total, pages, items });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

// ✅ GET /api/visits/:id
export const getVisit = async (req, res) => {
  try {
    const doc = await VisitingPlace.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json({ data: doc });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

// ✅ PATCH /api/visits/:id
export const updateVisit = async (req, res) => {
  try {
    const id = req.params.id;
    const patch = { ...req.body };

    if (patch.visitedAt) {
      const dt = new Date(patch.visitedAt);
      if (!Number.isNaN(dt.getTime())) patch.visitedAt = dt;
      else delete patch.visitedAt;
    }

    if (patch.nextFollowUpAt) {
      const dt = new Date(patch.nextFollowUpAt);
      if (!Number.isNaN(dt.getTime())) patch.nextFollowUpAt = dt;
      else patch.nextFollowUpAt = null;
    }

    const visitImage = pickFileMeta(req.files?.visitImage?.[0]);
    const visitingCardImage = pickFileMeta(req.files?.visitingCardImage?.[0]);

    if (visitImage) patch.visitImage = visitImage;
    if (visitingCardImage) patch.visitingCardImage = visitingCardImage;

    const doc = await VisitingPlace.findByIdAndUpdate(id, patch, { new: true });
    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json({ message: "Updated", data: doc });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

// ✅ DELETE /api/visits/:id
export const deleteVisit = async (req, res) => {
  try {
    const doc = await VisitingPlace.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted" });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};