import SystemSettings from "../models/SystemSettings.js";

const getOrCreateDoc = async () => {
  let doc = await SystemSettings.findOne();
  if (!doc) doc = await SystemSettings.create({});
  return doc;
};

// ✅ GET /api/admin/settings
export const getAdminSettings = async (req, res) => {
  try {
    const doc = await getOrCreateDoc();
    return res.json({ status: "success", data: doc });
  } catch (err) {
    console.error("getAdminSettings error:", err);
    return res
      .status(500)
      .json({ message: "Server error while loading settings" });
  }
};

// ✅ PUT /api/admin/settings
export const updateAdminSettings = async (req, res) => {
  try {
    const doc = await getOrCreateDoc();

    // ✅ Remove immutable/readonly fields (most important)
    const payload = { ...(req.body || {}) };
    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;

    // ✅ safest update: assign + save (avoids _id update issues completely)
    Object.assign(doc, payload);
    await doc.save();

    return res.json({ status: "success", data: doc });
  } catch (err) {
    console.error("updateAdminSettings error:", err);
    return res
      .status(500)
      .json({ message: "Server error while saving settings" });
  }
};
