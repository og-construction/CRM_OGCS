// src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import connectDB from "./config/db.js";
import logger from "./config/logger.js";
import { specs } from "./config/swagger.js";
import { apiLimiter, authLimiter } from "./config/rateLimiter.js";
import { initializeRedis, cacheMiddleware } from "./utils/cache.js";
import { auditMiddleware } from "./utils/auditLogger.js";
import { metricsMiddleware, startHealthMonitoring } from "./config/monitoring.js";

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
========================================================= */
const DEFAULT_ENV = "development";
const BOOT_ENV = process.env.NODE_ENV || DEFAULT_ENV;

const envFile =
  BOOT_ENV === "production" ? ".env.production" : ".env.development";

// absolute path: crm-backend/.env.development
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const RUNTIME_ENV = process.env.NODE_ENV || BOOT_ENV;

console.log(`🟢 Using env file: ${envFile}`);
console.log(`🌍 NODE_ENV: ${RUNTIME_ENV}`);

/* =========================================================
   ✅ Connect DB (AFTER dotenv)
========================================================= */
await connectDB();

/* =========================================================
   ✅ Initialize Redis Cache
========================================================= */
await initializeRedis();

/* =========================================================
   ✅ App init
========================================================= */
const app = express();

/* =========================================================
   ✅ Security Middleware (Helmet)
========================================================= */
app.use(helmet()); // Set security HTTP headers

/* =========================================================
   ✅ Logging Middleware (Morgan + Winston)
========================================================= */
const morganFormat =
  process.env.NODE_ENV === "production"
    ? "combined"
    : ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

/* =========================================================
   ✅ Body Parser
========================================================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================================================
   ✅ CORS (Fix preflight + allow cache-control)
========================================================= */
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://crm.ogcs.co.in",
  "http://localhost:1813",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "cache-control",
    "pragma",
    "expires",
  ],
  exposedHeaders: ["set-cookie"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// handle preflight
app.options("*", cors(corsOptions));

/* =========================================================
   ✅ Rate Limiting
========================================================= */
app.use("/api/", apiLimiter); // General API rate limiter
app.use("/api/auth/login", authLimiter); // Stricter auth limiter
app.use("/api/auth/register", authLimiter);

/* =========================================================
   ✅ API Documentation (Swagger)
========================================================= */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

/* =========================================================
   ✅ Audit Logging Middleware
========================================================= */
app.use(auditMiddleware);

/* =========================================================
   ✅ Metrics & Monitoring Middleware
========================================================= */
app.use(metricsMiddleware);
startHealthMonitoring(60000); // Health check every 60 seconds

/* =========================================================
   ✅ Static Uploads
========================================================= */
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(
  `/${UPLOAD_DIR}`,
  express.static(path.join(__dirname, "..", UPLOAD_DIR))
);

/* =========================================================
   ✅ Routes
========================================================= */
app.get("/", (req, res) => {
  res.send("OGCS CRM API running ✅");
});

// Health check endpoint
app.get("/health", async (req, res) => {
  const { getHealthStatus } = await import("./config/monitoring.js");
  const health = await getHealthStatus(await import("mongoose"));
  res.json(health);
});

// Metrics endpoint
app.get("/metrics", (req, res) => {
  const { getMetrics } = require("./config/monitoring.js");
  res.json(getMetrics());
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/contact-discussions", contactDiscussionRoutes);
app.use("/api/communications", communicationRoutes);

// Daily reports
app.use("/api/team-reports", dailyReportRoutes);
app.use("/api/daily-reports", dailyReportRoutes);

app.use("/api/quotes", quoteRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/notifications", notificationRoutes);

/* =========================================================
   ✅ Visits (Clean single endpoint)
========================================================= */
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
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📚 API Docs available at http://localhost:${PORT}/api-docs`);
});