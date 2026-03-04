// src/config/logger.js
import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Clean console format for development
const consoleFormat = winston.format.printf(({ message }) => message);

const logger = winston.createLogger({
  level: isProduction ? "warn" : "debug",
  format: logFormat,
  defaultMeta: { service: "crm-api" },
  transports: [
    // Console transport - clean format for development, detailed for production
    new winston.transports.Console({
      format: isProduction 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
              ({ level, message, timestamp, ...meta }) => {
                return `${timestamp} [${level}]: ${message} ${
                  Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
                }`;
              }
            )
          )
        : consoleFormat, // Clean message-only format for development
    }),

    // Error log file (always detailed)
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
      format: logFormat,
    }),

    // Combined log file (always detailed)
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
      format: logFormat,
    }),
  ],
});

export default logger;
