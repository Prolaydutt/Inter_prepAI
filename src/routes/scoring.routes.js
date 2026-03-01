// src/routes/scoring.routes.js
const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const {
  submitAndScore,
  getSessionReport,
} = require("../controllers/scoring.controller");

router.use(protect);

// POST /api/scoring/submit
router.post("/submit", submitAndScore);

// GET /api/scoring/report/:sessionId
router.get("/report/:sessionId", getSessionReport);

module.exports = router;
