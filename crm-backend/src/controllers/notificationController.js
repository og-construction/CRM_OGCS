import Notification from "../models/Notification.js";

const getDayName = (dateStrOrDate) => {
  const d = new Date(dateStrOrDate);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[d.getDay()];
};

// ✅ Create notification
export const createNotification = async (req, res) => {
  try {
    const { title, description, notifyDate } = req.body;

    if (!title || !description || !notifyDate) {
      return res.status(400).json({ message: "Title, description and date are required" });
    }

    const day = getDayName(notifyDate);

    const item = await Notification.create({
      title,
      description,
      notifyDate,
      day,
      isRead: false,
    });

    return res.status(201).json({ message: "Notification created", item });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// ✅ List notifications (latest first)
export const getNotifications = async (req, res) => {
  try {
    const items = await Notification.find().sort({ createdAt: -1 }).limit(200);
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

    const item = await Notification.findByIdAndUpdate(
      id,
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
    const item = await Notification.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: "Notification not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
