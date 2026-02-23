const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

// ── Security headers (helmet adds X-Content-Type, HSTS, etc.)
app.use(helmet());

// ── CORS — allow only your frontend
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:8000" }));

// ── Parse JSON bodies
app.use(express.json());

// ── HTTP request logging
app.use(morgan("dev"));

// ── Global rate limiter (100 req / 15 min per IP)
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ── Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ai-interview-api",
    timestamp: new Date(),
  });
});

// ── Routes (added in later steps)
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/users',     require('./routes/user.routes'));
app.use('/api/interview', require('./routes/interview.routes'));

// ── Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
