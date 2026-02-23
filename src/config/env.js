// src/config/env.js
const { z } = require("zod");
require("dotenv").config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("30m"),
  PORT: z.string().default("8001"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1); // Hard stop — never run with bad config
}

module.exports = parsed.data;
