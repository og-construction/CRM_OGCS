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

export const createVisitingPlace = async (req, res) => {
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
    } = req.body;

    if (!companyName || !partyType || !contactName || !visitedAt) {
      return res.status(400).json({
        message: "companyName, partyType, contactName, visitedAt are required.",
      });
    }

    const visitImage = pickFileMeta(req.files?.visitImage?.[0]);
    const visitingCardImage = pickFileMeta(req.files?.visitingCardImage?.[0]);

    const dt = new Date(visitedAt);
    if (Number.isNaN(dt.getTime())) {
      return res.status(400).json({ message: "visitedAt must be a valid date" });
    }

    const doc = await VisitingPlace.create({
      companyName: String(companyName).trim(),
      personName: String(personName || "").trim(),
      partyType: String(partyType).trim(),
      contactName: String(contactName).trim(),
      contactPhone: String(contactPhone || "").trim(),
      contactEmail: String(contactEmail || "").trim().toLowerCase(),
      address: String(address || "").trim(),
      initiatedBy: req.user?._id,
      status: String(status || "Visited").trim(),
      visitImage: visitImage || undefined,
      visitingCardImage: visitingCardImage || undefined,
      visitedAt: dt,
      notes: String(notes || "").trim(),
    });

    return res.status(201).json({ message: "Visit saved", data: doc });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const listVisitingPlaces = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(5, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;

    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    const partyType = String(req.query.partyType || "").trim();
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const onlyMine = String(req.query.onlyMine || "1") === "1";

    const base = {};
    if (onlyMine && req.user?._id) base.initiatedBy = req.user._id;

    if (status) base.status = status;
    if (partyType) base.partyType = partyType;

    if (from || to) {
      base.visitedAt = {};
      if (from && !Number.isNaN(from.getTime())) base.visitedAt.$gte = from;
      if (to && !Number.isNaN(to.getTime())) base.visitedAt.$lte = to;
    }

    const filter = { ...base };
    if (q) filter.$text = { $search: q };

    const [items, total] = await Promise.all([
      VisitingPlace.find(filter)
        .populate("initiatedBy", "name email role")
        .sort({ visitedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      VisitingPlace.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      page,
      limit,
      total,
      pages: totalPages,      // ✅ for frontend normalize
      totalPages: totalPages, // ✅ keep old
      items,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const getVisitingPlace = async (req, res) => {
  try {
    const doc = await VisitingPlace.findById(req.params.id).populate("initiatedBy", "name email role");
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json({ data: doc });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const updateVisitingPlace = async (req, res) => {
  try {
    const id = req.params.id;

    const visitImage = pickFileMeta(req.files?.visitImage?.[0]);
    const visitingCardImage = pickFileMeta(req.files?.visitingCardImage?.[0]);

    const patch = { ...req.body };

    if (patch.visitedAt) {
      const dt = new Date(patch.visitedAt);
      if (!Number.isNaN(dt.getTime())) patch.visitedAt = dt;
      else delete patch.visitedAt;
    }

    if (visitImage) patch.visitImage = visitImage;
    if (visitingCardImage) patch.visitingCardImage = visitingCardImage;

    const doc = await VisitingPlace.findByIdAndUpdate(id, patch, { new: true });
    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json({ message: "Updated", data: doc });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};

export const deleteVisitingPlace = async (req, res) => {
  try {
    const doc = await VisitingPlace.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted" });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Server error" });
  }
};
