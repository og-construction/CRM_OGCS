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
import { auditMiddleware } from "./utils/auditLogger.js";
import { metricsMiddleware } from "./config/monitoring.js";

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

/* ---------- Load ENV ---------- */
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const RUNTIME_ENV = process.env.NODE_ENV || "development";

/* ---------- Connect DB ---------- */
await connectDB();

/* ---------- App init ---------- */
const app = express();

/* ---------- Trust Proxy ---------- */
app.set("trust proxy", 1);

/* ---------- Security ---------- */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* ---------- Logging ---------- */
const morganFormat =
  RUNTIME_ENV === "production"
    ? "combined"
    : ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    skip: (req) => req.method === "OPTIONS",
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

/* ---------- Body Parsers ---------- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ---------- CORS ---------- */
const getAllowedOrigins = () => {
  const envOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const staticOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URL_DEV,
    process.env.CLIENT_URL_DEV_ALT,
    process.env.CLIENT_URL_PROD,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://crm.ogcs.co.in",
    "https://www.crm.ogcs.co.in",
  ].filter(Boolean);

  return [...new Set([...staticOrigins, ...envOrigins])];
};

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    // allow Postman, curl, mobile apps, server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked for origin: ${origin}`);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: false, // JWT token in Authorization header, no cookies required
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "Pragma",
    "Expires",
    "x-client-version",
    "x-device-id",
  ],
  exposedHeaders: ["Content-Length", "Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

logger.info(`Allowed CORS Origins: ${JSON.stringify(allowedOrigins)}`);

/* ---------- Rate Limiting ---------- */
app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

/* ---------- Swagger ---------- */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

/* ---------- Audit / Metrics ---------- */
app.use(auditMiddleware);
app.use(metricsMiddleware);

/* ---------- Static Uploads ---------- */
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(`/${UPLOAD_DIR}`, express.static(path.join(__dirname, "..", UPLOAD_DIR)));

/* ---------- Base Routes ---------- */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OGCS CRM API running ✅",
    environment: RUNTIME_ENV,
  });
});

app.get("/health", async (req, res) => {
  const { getHealthStatus } = await import("./config/monitoring.js");
  const mongoose = await import("mongoose");
  const health = await getHealthStatus(mongoose);
  res.status(200).json(health);
});

app.get("/metrics", async (req, res) => {
  const { getMetrics } = await import("./config/monitoring.js");
  res.status(200).json(getMetrics());
});

/* ---------- API Routes ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/contact-discussions", contactDiscussionRoutes);
app.use("/api/communications", communicationRoutes);
app.use("/api/team-reports", dailyReportRoutes);
app.use("/api/daily-reports", dailyReportRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/visits", visitingPlaceRoutes);
app.use("/api/admin", adminRoutes);

/* ---------- 404 Handler ---------- */
app.use(notFound);

/* ---------- Global Error Handler ---------- */
app.use((err, req, res, next) => {
  if (err.message?.includes("CORS policy")) {
    logger.warn(`CORS Error Response: ${err.message}`);
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return errorHandler(err, req, res, next);
});

/* ---------- Server Start ---------- */
const PORT = Number(process.env.PORT) || 3181;

const printStartupMessage = (port) => {
  const localUrl = `http://localhost:${port}`;
  const prodUrl = process.env.SERVER_URL_PROD || process.env.CLIENT_URL_PROD || "https://crm.ogcs.co.in";

  console.log(`
🚀 CRM OGCS API STARTED
🌐 ENV: ${RUNTIME_ENV}
🔗 LOCAL: ${localUrl}
🔗 LIVE: ${prodUrl}
📚 DOCS: ${localUrl}/api-docs
✅ CORS: ${allowedOrigins.join(", ")}
  `);
};

const startServer = (port) => {
  const server = app.listen(port, () => {
    printStartupMessage(port);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.log(`⚠️ Port ${port} busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      logger.error(`Server start error: ${error.message}`);
      process.exit(1);
    }
  });
};

startServer(PORT);