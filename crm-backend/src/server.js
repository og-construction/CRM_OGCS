// src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import contactDiscussionRoutes from "./routes/contactDiscussionRoutes.js";
import communicationRoutes from "./routes/communicationRoutes.js";
import dailyReportRoutes from "./routes/dailyReportRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import visitingPlaceRoutes from "./routes/visitingPlaceRoutes.js";
 


import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

/* ---------- ESM __dirname fix ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   ✅ Load correct ENV file (dev vs prod)
   IMPORTANT:
   - dotenv must load BEFORE using connectDB()
========================================================= */
const DEFAULT_ENV = "development";

// prefer OS env, else fallback
const BOOT_ENV = process.env.NODE_ENV || DEFAULT_ENV;

// choose env filename
const envFile = BOOT_ENV === "production" ? ".env.production" : ".env.development";

// absolute path: crm-backend/.env.development
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

// runtime env (after dotenv loads)
const RUNTIME_ENV = process.env.NODE_ENV || BOOT_ENV;

console.log(`🟢 Using env file: ${envFile}`);
console.log(`🌍 NODE_ENV: ${RUNTIME_ENV}`);

/* =========================================================
   ✅ Connect DB (AFTER dotenv)
========================================================= */
await connectDB(); // if your connectDB is async. If not, remove await.

/* =========================================================
   ✅ App init
========================================================= */
const app = express();
app.use(express.json());

/* =========================================================
   ✅ CORS (Secure + Postman safe)
========================================================= */
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:1813",
  "http://localhost:5173",
  "https://crm.ogcs.co.in",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow Postman/curl/server-to-server (no origin)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  })
);

/* =========================================================
   ✅ Static Uploads
   Keep BOTH patterns:
   1) /uploads
   2) /{UPLOAD_DIR} (custom)
========================================================= */
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// Always keep old path working
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Optional custom dir
app.use(`/${UPLOAD_DIR}`, express.static(path.join(__dirname, "..", UPLOAD_DIR)));

/* =========================================================
   ✅ Routes
========================================================= */
app.get("/", (req, res) => {
  res.send("OGCS CRM API running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/contact-discussions", contactDiscussionRoutes);
app.use("/api/communications", communicationRoutes);

// Keep both endpoints to avoid breaking frontend
app.use("/api/team-reports", dailyReportRoutes);
app.use("/api/daily-reports", dailyReportRoutes);

app.use("/api/quotes", quoteRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/visiting-places", visitingPlaceRoutes);
app.use("/api/visits", visitingPlaceRoutes);


// Admin
app.use("/api/admin", adminRoutes);

/* =========================================================
   ✅ Error Handling
========================================================= */
app.use(notFound);
app.use(errorHandler);

/* =========================================================
   ✅ Server start
========================================================= */
const PORT = process.env.PORT || 3181;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
