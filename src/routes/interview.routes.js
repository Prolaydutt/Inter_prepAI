// src/routes/interview.routes.js
const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const {
  startInterview,
  getNextQuestion,
  getMySessions,
} = require("../controllers/interview.controller");
const { z } = require("zod");
const { validate } = require("../validators/auth.validator");

const startSchema = z.object({
  roleName: z.enum([
    "SDE",
    "ML_ENGINEER",
    "FRONTEND",
    "BACKEND",
    "DATA_ENGINEER",
  ]),
});

// All interview routes require authentication
router.use(protect);

// POST /api/interview/start
router.post("/start", validate(startSchema), startInterview);

// GET /api/interview/:sessionId/next-question
router.get("/:sessionId/next-question", getNextQuestion);

// GET /api/interview/sessions — view interview history
router.get("/sessions", getMySessions);

module.exports = router;
