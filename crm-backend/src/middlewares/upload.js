import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext ? ext.toLowerCase() : "";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, unique);
  },
});

const allowedMime = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const fileFilter = (req, file, cb) => {
  if (!file) return cb(null, true);
  if (allowedMime.has(file.mimetype)) return cb(null, true);
  cb(new Error("Invalid file type. Only PDF/Images/Excel/Word allowed."), false);
};

const maxMb = Number(process.env.MAX_FILE_MB || 8);
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxMb * 1024 * 1024 },
}).single("file"); // field name must be "file"
