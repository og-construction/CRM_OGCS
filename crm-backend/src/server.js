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

/* ---------- Security ---------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* ---------- Logging ---------- */
const morganFormat =
  process.env.NODE_ENV === "production"
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

 
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ---------- CORS ---------- */
const getDynamicCorsOrigins = () => {
  const envOrigins = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim());
  const clientUrl = process.env.CLIENT_URL;
  const clientProdUrl = process.env.CLIENT_URL_PROD;

  const origins = [
    clientUrl,
    clientProdUrl,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter(Boolean);

  if (envOrigins) {
    origins.push(...envOrigins.filter((o) => !origins.includes(o)));
  }

  return [...new Set(origins)];
};

const allowedOrigins = getDynamicCorsOrigins();

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    logger.warn(`CORS blocked for origin: ${origin}`);
    return cb(new Error(`CORS policy: origin ${origin} not allowed`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Headers",
    "Access-Control-Request-Method",
    "cache-control",
    "Cache-Control",
    "pragma",
    "expires",
    "x-client-version",
    "x-device-id",
  ],
  exposedHeaders: [
    "Content-Length",
    "X-JSON-Response",
    "Content-Type",
    "Authorization",
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ---------- Rate Limiting ---------- */
app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

/* ---------- Swagger ---------- */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

/* ---------- Audit / Metrics ---------- */
app.use(auditMiddleware);
app.use(metricsMiddleware);
 

/* ---------- Static Uploads ---------- */
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(`/${UPLOAD_DIR}`, express.static(path.join(__dirname, "..", UPLOAD_DIR)));

/* ---------- Routes ---------- */
app.get("/", (req, res) => {
  res.send("OGCS CRM API running ✅");
});

app.get("/health", async (req, res) => {
  const { getHealthStatus } = await import("./config/monitoring.js");
  const health = await getHealthStatus(await import("mongoose"));
  res.json(health);
});

app.get("/metrics", async (req, res) => {
  const { getMetrics } = await import("./config/monitoring.js");
  res.json(getMetrics());
});

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

/* ---------- Error Handling ---------- */
app.use(notFound);
app.use(errorHandler);

/* ---------- Server start ---------- */
const PORT = Number(process.env.PORT) || 3181;

const printStartupMessage = (port) => {
  console.log(`
🚀 CRM OGCS API STARTED
🌐 ENV: ${RUNTIME_ENV}
🔗 URL: http://localhost:${port}
📚 DOCS: http://localhost:${port}/api-docs
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
      logger.error("Server start error", error);
      process.exit(1);
    }
  });
};

startServer(PORT);