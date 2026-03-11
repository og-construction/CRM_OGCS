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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const RUNTIME_ENV = process.env.NODE_ENV || "development";

await connectDB();

const app = express();

app.set("trust proxy", 1);

/*
|--------------------------------------------------------------------------
| HELMET SECURITY
|--------------------------------------------------------------------------
*/

const helmetCspEnabled = process.env.HELMET_CSP_ENABLED === "true";

app.use(
  helmet({
    contentSecurityPolicy: helmetCspEnabled ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/*
|--------------------------------------------------------------------------
| MORGAN LOGGER
|--------------------------------------------------------------------------
*/

const morganFormat =
  RUNTIME_ENV === "production"
    ? process.env.LOG_FORMAT || "combined"
    : ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    skip: (req) => req.method === "OPTIONS",
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

/*
|--------------------------------------------------------------------------
| BODY PARSER
|--------------------------------------------------------------------------
*/

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/*
|--------------------------------------------------------------------------
| CORS CONFIG (FIXED)
|--------------------------------------------------------------------------
*/

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`❌ CORS blocked for origin: ${origin}`);

    return callback(
      new Error(`CORS policy: origin ${origin} not allowed`)
    );
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

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
    "x-device-id"
  ],

  exposedHeaders: ["Content-Length", "Content-Type"],

  credentials: false,

  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

logger.info(`Allowed CORS Origins: ${allowedOrigins.join(", ")}`);

/*
|--------------------------------------------------------------------------
| SWAGGER DOCS
|--------------------------------------------------------------------------
*/

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

/*
|--------------------------------------------------------------------------
| MONITORING + AUDIT
|--------------------------------------------------------------------------
*/

app.use(auditMiddleware);
app.use(metricsMiddleware);

/*
|--------------------------------------------------------------------------
| STATIC FILES
|--------------------------------------------------------------------------
*/

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

app.use(
  `/${UPLOAD_DIR}`,
  express.static(path.join(__dirname, "..", UPLOAD_DIR))
);

/*
|--------------------------------------------------------------------------
| ROOT ROUTE
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OGCS CRM API running ✅",
    environment: RUNTIME_ENV,
    app: process.env.APP_NAME || "OGCS_CRM",
  });
});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/health", async (req, res) => {
  const { getHealthStatus } = await import("./config/monitoring.js");
  const mongoose = await import("mongoose");

  const health = await getHealthStatus(mongoose);

  res.status(200).json(health);
});

/*
|--------------------------------------------------------------------------
| METRICS
|--------------------------------------------------------------------------
*/

app.get("/metrics", async (req, res) => {
  const { getMetrics } = await import("./config/monitoring.js");

  res.status(200).json(getMetrics());
});

/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| NOT FOUND
|--------------------------------------------------------------------------
*/

app.use(notFound);

/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| SERVER START
|--------------------------------------------------------------------------
*/

const PORT = Number(process.env.PORT) || 3181;

const printStartupMessage = (port) => {

  const localUrl = `http://localhost:${port}`;
  const liveUrl = process.env.SERVER_URL || "https://crm.ogcs.co.in";

  console.log(`
🚀 CRM OGCS API STARTED
🌐 ENV: ${RUNTIME_ENV}

🔗 LOCAL: ${localUrl}
🔗 LIVE: ${liveUrl}

📚 DOCS: ${localUrl}/api-docs

✅ CORS ALLOWED:
${allowedOrigins.join("\n")}
  `);
};

const server = app.listen(PORT, () => {
  printStartupMessage(PORT);
});

server.on("error", (error) => {
  logger.error(`Server start error: ${error.message}`);
  process.exit(1);
});