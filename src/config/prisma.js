// src/config/prisma.js
const { PrismaClient } = require("@prisma/client");

// Global singleton — prevents connection pool exhaustion in dev
const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

module.exports = prisma;
