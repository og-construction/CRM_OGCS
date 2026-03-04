// src/utils/cache.js
import redis from "redis";
import logger from "../config/logger.js";

let redisClient = null;
let isConnected = false;

// Initialize Redis client - ONLY if REDIS_URL is configured
export const initializeRedis = async () => {
  // Skip Redis initialization completely if REDIS_URL is not defined
  if (!process.env.REDIS_URL) {
    isConnected = false;
    return;
  }

  try {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });

    redisClient.on("error", (err) => {
      if (err && err.message && err.message.includes("ECONNREFUSED")) {
        // Silently fail on connection refused - Redis not available
        isConnected = false;
      } else if (err && err.message) {
        logger.warn("Redis connection warning", { error: err.message });
      }
    });

    redisClient.on("connect", () => {
      logger.info("✅ Redis connected");
      isConnected = true;
    });

    // Add a timeout to prevent hanging on Redis connection
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis connection timeout")), 5000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
  } catch (err) {
    logger.warn("ℹ️  Redis not available, caching disabled");
    isConnected = false;
  }
};

// Get value from cache
export const getCache = async (key) => {
  // Early return if Redis is not configured or not connected
  if (!redisClient || !isConnected) return null;

  try {
    const value = await redisClient.get(key);
    if (value) {
      logger.debug("Cache hit", { key });
      return JSON.parse(value);
    }
    logger.debug("Cache miss", { key });
    return null;
  } catch (err) {
    logger.warn("Cache get error", { key, error: err.message });
    return null;
  }
};

// Set value in cache with TTL
export const setCache = async (key, value, ttlSeconds = 3600) => {
  // Early return if Redis is not configured or not connected
  if (!redisClient || !isConnected) return false;

  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    logger.debug("Cache set", { key, ttl: ttlSeconds });
    return true;
  } catch (err) {
    logger.warn("Cache set error", { key, error: err.message });
    return false;
  }
};

// Delete cache key
export const deleteCache = async (key) => {
  // Early return if Redis is not configured or not connected
  if (!redisClient || !isConnected) return false;

  try {
    await redisClient.del(key);
    logger.debug("Cache deleted", { key });
    return true;
  } catch (err) {
    logger.warn("Cache delete error", { key, error: err.message });
    return false;
  }
};

// Delete multiple cache keys by pattern
export const deleteCachePattern = async (pattern) => {
  // Early return if Redis is not configured or not connected
  if (!redisClient || !isConnected) return false;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug("Cache pattern deleted", { pattern, count: keys.length });
    }
    return true;
  } catch (err) {
    logger.warn("Cache pattern delete error", { pattern, error: err.message });
    return false;
  }
};

// Clear all cache
export const clearCache = async () => {
  // Early return if Redis is not configured or not connected
  if (!redisClient || !isConnected) return false;

  try {
    await redisClient.flushDb();
    logger.info("Cache cleared");
    return true;
  } catch (err) {
    logger.warn("Cache clear error", { error: err.message });
    return false;
  }
};

// Cache middleware
export const cacheMiddleware = (ttlSeconds = 3600) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests or when Redis is not available
    if (req.method !== "GET" || !redisClient || !isConnected) {
      return next();
    }

    try {
      const key = `cache:${req.originalUrl}`;
      const cachedData = await getCache(key);

      if (cachedData) {
        res.set("X-Cache", "hit");
        return res.json(cachedData);
      }

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        setCache(key, data, ttlSeconds);
        res.set("X-Cache", "miss");
        return originalJson(data);
      };

      next();
    } catch (err) {
      logger.warn("Cache middleware error", { error: err.message });
      next();
    }
  };
};

export default {
  initializeRedis,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  clearCache,
  cacheMiddleware,
};
