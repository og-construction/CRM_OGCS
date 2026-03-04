import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const BASE_DIR = path.join(process.cwd(), UPLOAD_DIR);
const VISIT_DIR = path.join(BASE_DIR, "visits");

if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
if (!fs.existsSync(VISIT_DIR)) fs.mkdirSync(VISIT_DIR, { recursive: true });

const extSafe = (filename = "") => (path.extname(filename || "") || "").toLowerCase();

const safeBaseName = (filename = "file") => {
  const ext = path.extname(filename || "");
  const base = path.basename(filename || "file", ext);
  return base.replace(/[^\w\-]+/g, "_").slice(0, 60);
};

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