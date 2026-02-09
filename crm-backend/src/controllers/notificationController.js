import Notification from "../models/Notification.js";

const getDayName = (dateVal) => {
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return "";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[d.getDay()];
};

// ✅ Create notification
export const createNotification = async (req, res) => {
  try {
    const { title, description, notifyDate } = req.body;

    if (!title?.trim() || !description?.trim() || !notifyDate) {
      return res.status(400).json({ message: "Title, description and notifyDate are required" });
    }

    const dt = new Date(notifyDate);
    if (Number.isNaN(dt.getTime())) {
      return res.status(400).json({ message: "notifyDate must be a valid date" });
    }

    const day = getDayName(dt);

    const item = await Notification.create({
      title: title.trim(),
      description: description.trim(),
      notifyDate: dt,
      day,
      isRead: false,

      // ✅ store who created (requires model field)
      createdBy: req.user?._id,
    });

    return res.status(201).json({ message: "Notification created", item });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ List notifications (latest first)
export const getNotifications = async (req, res) => {
  try {
    // ✅ If you want everyone to see ALL notifications:
    // const filter = {};

    // ✅ If you want user-wise notifications:
    const filter = { createdBy: req.user?._id };

    const items = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ Mark as read/unread
export const updateNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    const item = await Notification.findOneAndUpdate(
      { _id: id, createdBy: req.user?._id }, // ✅ user-safe
      { isRead: Boolean(isRead) },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: "Notification not found" });

    return res.json({ message: "Updated", item });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ Delete
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Notification.findOneAndDelete({
      _id: id,
      createdBy: req.user?._id, // ✅ user-safe
    });

    if (!item) return res.status(404).json({ message: "Notification not found" });

    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
