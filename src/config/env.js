// src/config/env.js — updated
require("dotenv").config();
const { z } = require("zod");

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("30m"),
  PORT: z.string().default("3001"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  // New in Phase 2
  GROQ_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("llama-3.3-70b-versatile"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

module.exports = parsed.data;
