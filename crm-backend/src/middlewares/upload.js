import multer from "multer";
import path from "path";
import fs from "fs";

/** =======================
 *  Base upload folders
 *  ======================= */
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const BASE_DIR = path.join(process.cwd(), UPLOAD_DIR);
const VISIT_DIR = path.join(BASE_DIR, "visits");

if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
if (!fs.existsSync(VISIT_DIR)) fs.mkdirSync(VISIT_DIR, { recursive: true });

/** =======================
 *  Helpers
 *  ======================= */
const extSafe = (filename = "") => {
  const ext = path.extname(filename || "");
  return ext ? ext.toLowerCase() : "";
};

const safeBaseName = (filename = "file") => {
  const ext = path.extname(filename || "");
  const base = path.basename(filename || "file", ext);
  return base.replace(/[^\w\-]+/g, "_").slice(0, 60); // clean + limit
};

/** =======================
 *  1) uploadSingle (file)
 *  - Allows PDF/Images/Excel/Word
 *  - Saved in /uploads
 *  ======================= */
const allowedMimeSingle = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const storageSingle = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BASE_DIR),
  filename: (req, file, cb) => {
    const safeExt = extSafe(file?.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, unique);
  },
});

const fileFilterSingle = (req, file, cb) => {
  if (!file) return cb(null, true);
  if (allowedMimeSingle.has(file.mimetype)) return cb(null, true);
  return cb(new Error("Invalid file type. Only PDF/Images/Excel/Word allowed."), false);
};

const maxMb = Number(process.env.MAX_FILE_MB || 8);

export const uploadSingle = multer({
  storage: storageSingle,
  fileFilter: fileFilterSingle,
  limits: { fileSize: maxMb * 1024 * 1024 },
}).single("file"); // field name must be "file"

/** =======================
 *  2) uploadVisitFiles
 *  - Only images
 *  - Saved in /uploads/visits
 *  ======================= */
const allowedVisitImages = new Set(["image/jpeg", "image/png", "image/webp"]);

const storageVisit = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VISIT_DIR),
  filename: (req, file, cb) => {
    const ext = extSafe(file?.originalname);
    const base = safeBaseName(file?.originalname || "visit");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const fileFilterVisit = (req, file, cb) => {
  if (!file) return cb(null, true);
  if (allowedVisitImages.has(file.mimetype)) return cb(null, true);
  return cb(new Error("Only JPG/PNG/WEBP images allowed for visit uploads."), false);
};

const visitMaxMb = Number(process.env.VISIT_MAX_MB || 5);

export const uploadVisitFiles = multer({
  storage: storageVisit,
  fileFilter: fileFilterVisit,
  limits: { fileSize: visitMaxMb * 1024 * 1024 },
}).fields([
  { name: "visitImage", maxCount: 1 },
  { name: "visitingCardImage", maxCount: 1 },
]);
