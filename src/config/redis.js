// src/config/redis.js
const Redis = require("ioredis");
const env = require("./env");

const redis = new Redis(env.REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err.message));

module.exports = redis;
