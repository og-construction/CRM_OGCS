// src/utils/auditLogger.js
import mongoose from "mongoose";
import logger from "../config/logger.js";

// Simple in-memory audit log model structure
// In production, you should store this in a database
const auditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "EXPORT",
        "IMPORT",
        "VIEW",
        "UNAUTHORIZED_ACCESS",
      ],
    },
    module: {
      type: String,
      required: true,
      enum: ["LEAD", "USER", "QUOTE", "COMMUNICATION", "REPORT", "SETTINGS", "ADMIN"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: String,
    targetId: String, // ID of the resource that was modified
    targetType: String, // Type of resource (e.g., "Lead", "User")
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      default: "SUCCESS",
    },
    error: String,
    ipAddress: String,
    userAgent: String,
    requestId: String,
  },
  { timestamps: true }
);

const AuditLog = mongoose.model("AuditLog", auditSchema);

/**
 * Log an audit event
 */
export const logAuditEvent = async (auditData) => {
  try {
    const {
      action,
      module,
      userId,
      userName,
      targetId,
      targetType,
      changes,
      status = "SUCCESS",
      error,
      ipAddress,
      userAgent,
      requestId,
    } = auditData;

    const audit = new AuditLog({
      action,
      module,
      userId,
      userName,
      targetId,
      targetType,
      changes,
      status,
      error,
      ipAddress,
      userAgent,
      requestId,
    });

    await audit.save();

    logger.info(`Audit: ${action} - ${module}`, {
      userId,
      targetId,
      status,
    });

    return audit;
  } catch (err) {
    logger.error("Audit logging failed", { error: err.message });
    throw err;
  }
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters = {}, page = 1, limit = 50) => {
  try {
    const skip = (page - 1) * limit;
    const query = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.module) query.module = filters.module;
    if (filters.status) query.status = filters.status;

    const logs = await AuditLog.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (err) {
    logger.error("Error fetching audit logs", { error: err.message });
    throw err;
  }
};

/**
 * Middleware to add audit properties to request
 */
export const auditMiddleware = (req, res, next) => {
  req.audit = {
    userId: req.user?._id,
    userName: req.user?.name,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    requestId: req.get("x-request-id") || `${Date.now()}-${Math.random()}`,
  };
  next();
};

/**
 * Usage Example:
 * 
 * await logAuditEvent({
 *   action: "CREATE",
 *   module: "LEAD",
 *   userId: req.user._id,
 *   userName: req.user.name,
 *   targetId: newLead._id,
 *   targetType: "Lead",
 *   changes: { after: newLead },
 *   ipAddress: req.ip,
 *   userAgent: req.get("user-agent"),
 * });
 */

export default {
  logAuditEvent,
  getAuditLogs,
  auditMiddleware,
};
