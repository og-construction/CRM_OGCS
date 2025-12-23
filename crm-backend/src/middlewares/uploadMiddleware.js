import multer from "multer";
import path from "path";
import fs from "fs";

// ensure uploads folder exists
const uploadDir = "uploads/govdocs";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `govdoc-${unique}${ext}`);
  },
});

// file filter
const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|pdf/;
  const extOk = allowed.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeOk = allowed.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(
      new Error("Only JPG, PNG, or PDF files are allowed"),
      false
    );
  }
};

// multer instance
export const uploadGovDoc = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
