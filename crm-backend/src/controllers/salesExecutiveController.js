// salesExecutiveController.js
import User from "../models/User.js";

/* ======================================================
   GET all sales executives (Admin)
   GET /api/auth/sales-executive   (or /sales-executives)
====================================================== */
export const getSalesExecutives = async (req, res, next) => {
  try {
    const list = await User.find({ role: "sales" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

/* ======================================================
   Activate/Deactivate sales executive (Admin)
   PATCH /api/auth/sales-executive/:id/active
   body: { isActive: true/false }
====================================================== */
export const setUserActiveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        status: "fail",
        message: "isActive must be boolean",
      });
    }

    const user = await User.findOne({ _id: id, role: "sales" });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Sales Executive not found",
      });
    }

    user.isActive = isActive;
    await user.save();

    const safeUser = await User.findById(user._id).select("-password");

    return res.status(200).json({
      status: "success",
      message: "Status updated",
      data: safeUser, // ✅ frontend reads res.data.data
    });
  } catch (err) {
    next(err);
  }
};

/* ======================================================
   Delete sales executive (Admin)
   DELETE /api/auth/sales-executive/:id
====================================================== */
export const deleteSalesExecutive = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: "sales" }).select("_id");
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Sales Executive not found",
      });
    }

    await User.deleteOne({ _id: id });

    return res.status(200).json({
      status: "success",
      message: "Deleted",
      data: { id }, // ✅ thunk expects res.data.data.id
    });
  } catch (err) {
    next(err);
  }
};
