import Quote from "../models/Quote.js";
import Lead from "../models/leadModel.js";

const startOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getAdminOverview = async (req, res) => {
  try {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekEnd = endOfDay(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000));

    // ---------------------------
    // QUOTES (✅ use updatedAt so old data works)
    // ---------------------------
    const [
      pendingQuotes,
      weekCreated,
      weekApproved,
      weekRejected,
      approvedAmountAgg,
    ] = await Promise.all([
      Quote.countDocuments({ status: "pending" }),

      Quote.countDocuments({ createdAt: { $gte: weekStart, $lte: todayEnd } }),

      Quote.countDocuments({
        status: "approved",
        updatedAt: { $gte: weekStart, $lte: todayEnd },
      }),

      Quote.countDocuments({
        status: "rejected",
        updatedAt: { $gte: weekStart, $lte: todayEnd },
      }),

      Quote.aggregate([
        {
          $match: {
            status: "approved",
            updatedAt: { $gte: weekStart, $lte: todayEnd },
          },
        },
        { $group: { _id: null, approvedAmount: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const weekApprovedAmount = approvedAmountAgg?.[0]?.approvedAmount || 0;

    // ---------------------------
    // LEADS
    // ---------------------------
    const [
      totalLeads,
      newLeadsThisWeek,
      followUpsDueToday,
      followUpsDueThisWeek,
      leadsByStatusAgg,
    ] = await Promise.all([
      Lead.countDocuments({}),

      Lead.countDocuments({ createdAt: { $gte: weekStart, $lte: todayEnd } }),

      Lead.countDocuments({
        nextFollowUpAt: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: "Closed" },
      }),

      Lead.countDocuments({
        nextFollowUpAt: { $gte: weekStart, $lte: weekEnd },
        status: { $ne: "Closed" },
      }),

      Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const statusBreakdown = {
      New: 0,
      "Follow-Up": 0,
      Closed: 0,
      Converted: 0,
    };

    for (const row of leadsByStatusAgg) {
      if (row?._id && statusBreakdown[row._id] !== undefined) {
        statusBreakdown[row._id] = row.count;
      }
    }

    // ---------------------------
    // TOP SALES EXEC (this week)
    // ---------------------------
    const topSalesExecutivesThisWeek = await Quote.aggregate([
      { $match: { createdAt: { $gte: weekStart, $lte: todayEnd } } },
      {
        $group: {
          _id: "$salesExecutive",
          created: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { created: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          email: "$user.email",
          created: 1,
          totalAmount: 1,
        },
      },
    ]);

    return res.json({
      quotes: {
        pendingQuotes,
        week: {
          created: weekCreated,
          approved: weekApproved,
          rejected: weekRejected,
          approvedAmount: weekApprovedAmount,
        },
      },
      leads: {
        totalLeads,
        newLeadsThisWeek,
        followUpsDueToday,
        followUpsDueThisWeek,
        statusBreakdown,
      },
      topSalesExecutivesThisWeek,
      meta: { weekStart, todayStart, todayEnd },
    });
  } catch (err) {
    console.error("getAdminOverview error:", err);
    return res.status(500).json({ message: "Server error while building admin overview" });
  }
};
