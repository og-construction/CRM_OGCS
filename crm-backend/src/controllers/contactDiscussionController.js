import ContactDiscussion from "../models/ContactDiscussion.js";

const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

export const createContactDiscussion = async (req, res) => {
  try {
    const { name, email, companyName, role, phone, discussionNote } = req.body;

    if (!name || !email || !companyName || !role || !phone || !discussionNote) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const doc = await ContactDiscussion.create({
      name,
      email,
      companyName,
      role,
      phone,
      discussionNote
    });

    return res.status(201).json({
      message: "Saved successfully.",
      data: doc
    });
  } catch (err) {
    console.error("createContactDiscussion error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllContactDiscussions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ContactDiscussion.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactDiscussion.countDocuments()
    ]);

    return res.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    console.error("getAllContactDiscussions error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
