import DailyReport from "../models/DailyReport.js";

const MIN_WORDS = 20;

const countWords = (text = "") =>
  String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

export const createDailyReport = async (req, res) => {
  try {
    const { reportDate, memberName, reportText } = req.body;

    if (!reportDate || !memberName || !reportText) {
      return res.status(400).json({ message: "reportDate, memberName, reportText are required." });
    }

    const wc = countWords(reportText);
    if (wc < MIN_WORDS) {
      return res.status(400).json({ message: `Daily report must be at least ${MIN_WORDS} words.` });
    }

    let attachment = {};
    if (req.file) {
      attachment = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/${process.env.UPLOAD_DIR || "uploads"}/${req.file.filename}`,
      };
    }

    const doc = await DailyReport.create({
      reportDate,
      memberName,
      reportText,
      wordCount: wc,
      attachment,
      // createdBy: req.user?._id || null, // enable later when auth is ready
    });

    return res.status(201).json({ message: "Daily report saved ✅", data: doc });
  } catch (err) {
    console.error("createDailyReport:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const getDailyReports = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const skip = (page - 1) * limit;

    const q = (req.query.q || "").trim();
    const date = (req.query.date || "").trim(); // optional YYYY-MM-DD

    const filter = {};
    if (date) filter.reportDate = date;
    if (q) {
      filter.$or = [
        { memberName: { $regex: q, $options: "i" } },
        { reportText: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      DailyReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      DailyReport.countDocuments(filter),
    ]);

    return res.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error("getDailyReports:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
