import CommunicationLog from "../models/CommunicationLog.js";
import { sendEmailSMTP } from "../utils/sendEmail.js";

export const getLogs = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "30", 10), 1), 200);
    const logs = await CommunicationLog.find().sort({ createdAt: -1 }).limit(limit);
    return res.json({ data: logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createLog = async (req, res) => {
  try {
    const doc = await CommunicationLog.create(req.body);
    return res.status(201).json({ message: "Log saved", data: doc });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Invalid payload" });
  }
};

export const sendEmailAndLog = async (req, res) => {
  try {
    const { toEmail, subject, message, relatedTo } = req.body;

    if (!toEmail || !subject || !message) {
      return res.status(400).json({ message: "toEmail, subject, message required" });
    }

    let status = "sent";
    let error = "";

    try {
      await sendEmailSMTP({
        to: toEmail,
        subject,
        text: message,
        html: `<div style="font-family:Arial;white-space:pre-wrap">${escapeHtml(
          message
        )}</div>`,
      });
    } catch (e) {
      status = "failed";
      error = e?.message || "Email send failed";
    }

    const log = await CommunicationLog.create({
      type: "email",
      toEmail,
      subject,
      message,
      relatedTo: relatedTo || {},
      status,
      error,
    });

    if (status === "failed") {
      return res.status(500).json({ message: error, data: log });
    }

    return res.status(200).json({ message: "Email sent ✅", data: log });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
