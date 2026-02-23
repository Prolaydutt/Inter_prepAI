// src/controllers/auth.controller.js
const prisma = require("../config/prisma");
const { hashPassword, verifyPassword } = require("../utils/password.utils");
const { createToken } = require("../utils/jwt.utils");
const { createError } = require("../middleware/error.middleware");

// ── REGISTER ─────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw createError("Email already registered", 400);

    // Hash password — NEVER store plain text
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: { email, username, hashedPassword },
      select: { id: true, email: true, username: true, createdAt: true },
      // select excludes hashedPassword from the response
    });

    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw createError("Invalid credentials", 401);

    // Check password
    const valid = await verifyPassword(password, user.hashedPassword);
    if (!valid) throw createError("Invalid credentials", 401);

    // Create JWT
    const token = createToken({ userId: user.id, email: user.email });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
