// src/config/monitoring.js
import logger from "./logger.js";

/**
 * Application health metrics
 */
export const metrics = {
  requestCount: 0,
  errorCount: 0,
  totalResponseTime: 0,
  avgResponseTime: 0,
  lastReset: new Date(),
};

/**
 * Track request metrics
 */
export const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Capture original res.json
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    const duration = Date.now() - startTime;

    metrics.requestCount++;
    metrics.totalResponseTime += duration;
    metrics.avgResponseTime = metrics.totalResponseTime / metrics.requestCount;

    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }

    // Log slow requests
    if (duration > 2000) {
      logger.warn("Slow response", {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Get current metrics
 */
export const getMetrics = () => ({
  ...metrics,
  errorRate:
    metrics.requestCount > 0
      ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) + "%"
      : "0%",
  uptimeSince: metrics.lastReset,
});

/**
 * Reset metrics
 */
export const resetMetrics = () => {
  metrics.requestCount = 0;
  metrics.errorCount = 0;
  metrics.totalResponseTime = 0;
  metrics.avgResponseTime = 0;
  metrics.lastReset = new Date();
};

/**
 * Health check endpoint data
 */
export const getHealthStatus = async (db) => {
  try {
    // Check database connection
    const dbConnected = await db.connection.db.admin().ping();

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbConnected ? "connected" : "disconnected",
      metrics: getMetrics(),
      memory: {
        heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
        heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + " MB",
      },
    };
  } catch (err) {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: err.message,
    };
  }
};

/**
 * Alert system (stub - implement based on your requirements)
 */
export const triggerAlert = async (alertType, data) => {
  try {
    // TODO: Integrate with alerting service
    // - Sentry for error tracking
    // - PagerDuty for incident management
    // - Datadog for monitoring
    // - Custom webhook/email alerts

    logger.warn(`Alert: ${alertType}`, data);

    // Example alert conditions
    switch (alertType) {
      case "HIGH_ERROR_RATE":
        logger.error("ALERT: High error rate detected", data);
        // Send to monitoring service
        break;

      case "SLOW_RESPONSE":
        logger.warn("ALERT: Slow response time", data);
        break;

      case "HIGH_MEMORY_USAGE":
        logger.error("ALERT: High memory usage", data);
        break;

      case "DATABASE_CONNECTION_ERROR":
        logger.error("ALERT: Database connection failed", data);
        break;

      default:
        logger.info("Alert registered", data);
    }
  } catch (err) {
    logger.error("Failed to trigger alert", { error: err.message });
  }
};

/**
 * Monitor application health periodically
 */
export const startHealthMonitoring = (interval = 60000) => {
  // Check every minute by default
  setInterval(() => {
    const metrics = getMetrics();
    const errorRate = parseFloat(metrics.errorRate);

    // Check for high error rate
    if (errorRate > 10) {
      triggerAlert("HIGH_ERROR_RATE", {
        errorRate: metrics.errorRate,
        errorCount: metrics.errorCount,
        requestCount: metrics.requestCount,
      });
    }

    // Check for high memory usage
    const heapUsedMB = process.memoryUsage().heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      // Alert if heap > 500MB
      triggerAlert("HIGH_MEMORY_USAGE", {
        heapUsedMB: heapUsedMB.toFixed(2),
      });
    }

    // Log periodic health status
    logger.info("Health check", {
      errorRate: metrics.errorRate,
      avgResponseTime: `${metrics.avgResponseTime.toFixed(2)}ms`,
      requestCount: metrics.requestCount,
      memory: `${heapUsedMB.toFixed(2)}MB`,
    });
  }, interval);
};

export default {
  metricsMiddleware,
  getMetrics,
  resetMetrics,
  getHealthStatus,
  triggerAlert,
  startHealthMonitoring,
};
