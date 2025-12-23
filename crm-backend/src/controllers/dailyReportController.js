import DailyReport from "../models/DailyReport.js";

const MIN_WORDS = 20;

const countWords = (text = "") =>
  String(text).trim().split(/\s+/).filter(Boolean).length;

export const createDailyReport = async (req, res) => {
  try {
    const { reportDate, memberName, reportText } = req.body;

    if (!reportDate || !memberName || !reportText) {
      return res.status(400).json({
        message: "reportDate, memberName, reportText are required.",
      });
    }

    const wc = countWords(reportText);
    if (wc < MIN_WORDS) {
      return res.status(400).json({
        message: `Daily report must be at least ${MIN_WORDS} words.`,
      });
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
      // createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      status: "success",
      message: "Daily report saved ✅",
      data: doc,
    });
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
    const date = (req.query.date || "").trim();

    const filter = {};
    if (date) filter.reportDate = date;
    if (q) {
      filter.$or = [
        { memberName: { $regex: q, $options: "i" } },
        { reportText: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      DailyReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      DailyReport.countDocuments(filter),
    ]);

    return res.json({
      status: "success",
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error("getDailyReports:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADMIN: reports + summary
export const getAdminDailyReports = async (req, res) => {
  try {
    const { date, member } = req.query;

    const filter = {};
    if (date) filter.reportDate = date;
    if (member) filter.memberName = new RegExp(member, "i");

    const reports = await DailyReport.find(filter).sort({ createdAt: -1 }).lean();

    const totalReports = reports.length;
    const today = new Date().toISOString().slice(0, 10);

    const todayReports = reports.filter((r) => r.reportDate === today).length;
    const withAttachment = reports.filter((r) => r.attachment?.url).length;
    const uniqueMembers = new Set(reports.map((r) => r.memberName)).size;

    return res.json({
      status: "success",
      data: {
        summary: { totalReports, todayReports, withAttachment, uniqueMembers },
        reports,
      },
    });
  } catch (err) {
    console.error("getAdminDailyReports error:", err);
    return res.status(500).json({ message: "Failed to load daily reports" });
  }
};
