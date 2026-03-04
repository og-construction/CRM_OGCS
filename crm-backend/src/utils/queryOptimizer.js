// src/utils/queryOptimizer.js
import logger from "../config/logger.js";

/**
 * Performance monitoring for database queries
 */
const queryMetrics = {};

/**
 * Wrap a query with performance monitoring
 */
export const monitorQuery = async (queryName, queryFn) => {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    // Track metrics
    if (!queryMetrics[queryName]) {
      queryMetrics[queryName] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity,
      };
    }

    const metrics = queryMetrics[queryName];
    metrics.count++;
    metrics.totalTime += duration;
    metrics.avgTime = metrics.totalTime / metrics.count;
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    metrics.minTime = Math.min(metrics.minTime, duration);

    // Log slow queries
    if (duration > 1000) {
      logger.warn("Slow query detected", {
        query: queryName,
        duration: `${duration}ms`,
      });
    }

    return result;
  } catch (err) {
    logger.error("Query error", {
      query: queryName,
      error: err.message,
    });
    throw err;
  }
};

/**
 * Get query metrics
 */
export const getQueryMetrics = (queryName = null) => {
  if (queryName) {
    return queryMetrics[queryName] || null;
  }
  return queryMetrics;
};

/**
 * Reset metrics
 */
export const resetQueryMetrics = () => {
  Object.keys(queryMetrics).forEach((key) => delete queryMetrics[key]);
};

/**
 * Database query pagination helper
 */
export const paginate = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20)); // Max 100 per page
  const skip = (pageNum - 1) * limitNum;

  return { skip, limit: limitNum, page: pageNum };
};

/**
 * Select only needed fields (projection)
 */
export const selectFields = (defaultFields = "") => {
  return (userFields) => {
    if (userFields) {
      return userFields.split(",").map((f) => f.trim()).join(" ");
    }
    return defaultFields;
  };
};

/**
 * Build mongo query filters efficiently
 */
export const buildQuery = (filters = {}) => {
  const query = {};

  // Example filters that might come from request
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (key === "search") {
        // Text search on multiple fields
        query.$or = [
          { name: { $regex: value, $options: "i" } },
          { email: { $regex: value, $options: "i" } },
          { company: { $regex: value, $options: "i" } },
        ];
      } else if (key === "dateFrom") {
        query.createdAt = query.createdAt || {};
        query.createdAt.$gte = new Date(value);
      } else if (key === "dateTo") {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = new Date(value);
      } else if (Array.isArray(value)) {
        query[key] = { $in: value };
      } else if (typeof value === "boolean") {
        query[key] = value;
      } else if (value && typeof value === "object") {
        query[key] = value;
      } else {
        query[key] = value;
      }
    }
  });

  return query;
};

/**
 * Batch processing helper
 */
export const processBatch = async (items, batchSize, processor) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((item) => processor(item))
    );
    results.push(...batchResults);
  }
  return results;
};

/**
 * Database connection pool stats
 */
export const getDbConnectionStats = (connection) => {
  if (!connection) return null;

  return {
    host: connection.host,
    port: connection.port,
    db: connection.name,
    connected: connection.readyState === 1,
    collections: Object.keys(connection.collections).length,
  };
};

export default {
  monitorQuery,
  getQueryMetrics,
  resetQueryMetrics,
  paginate,
  selectFields,
  buildQuery,
  processBatch,
  getDbConnectionStats,
};
