// src/routes/proctoring.routes.js
const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const {
  logEvent,
  logEventBatch,
  getSessionEvents,
} = require("../controllers/proctoring.controller");
// const {
//   logEvent,
//   logEventBatch,
//   getSessionEvents,
// } = require("../controllers/proctoring.controller");
const {
  generateReport,
  getReport,
} = require("../controllers/cheating.controller");


router.use(protect);

// POST /api/proctoring/event
router.post("/event", logEvent);

// POST /api/proctoring/events/batch
router.post("/events/batch", logEventBatch);

// GET /api/proctoring/:sessionId/events
router.get("/:sessionId/events", getSessionEvents);

// POST /api/proctoring/:sessionId/report
router.post("/:sessionId/report", generateReport);

// GET /api/proctoring/:sessionId/report
router.get("/:sessionId/report", getReport);

module.exports = router;
