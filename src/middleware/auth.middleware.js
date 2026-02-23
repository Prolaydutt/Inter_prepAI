// src/middleware/auth.middleware.js
const { verifyToken } = require("../utils/jwt.utils");
const { createError } = require("./error.middleware");
const prisma = require("../config/prisma");

/**
 * Protect routes: reads Bearer token from Authorization header,
 * verifies it, loads the user from DB, attaches to req.user
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw createError("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token); // throws if expired/invalid

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, isActive: true },
    });

    if (!user || !user.isActive)
      throw createError("User not found or inactive", 401);

    req.user = user; // available in all downstream handlers
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError")
      return next(createError("Invalid token", 401));
    if (err.name === "TokenExpiredError")
      return next(createError("Token expired", 401));
    next(err);
  }
};

module.exports = { protect };
