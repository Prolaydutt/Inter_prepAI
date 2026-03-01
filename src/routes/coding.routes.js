// src/routes/coding.routes.js
const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
// const {
//   getProblems,
//   getProblemById,
//   submitCode,
//   getSubmission,
// } = require("../controllers/coding.controller");
const {
  getProblems,
  getProblemById,
  submitCode,
  getSubmission,
  getMySubmissions,
} = require("../controllers/coding.controller");

router.use(protect);

// GET  /api/coding/problems          — list all problems
router.get("/problems", getProblems);

// GET  /api/coding/problems/:id      — get one problem with visible test cases
router.get("/problems/:id", getProblemById);

// POST /api/coding/submit            — submit code for execution
router.post("/submit", submitCode);

// GET  /api/coding/submission/:id    — get submission result
router.get("/submission/:id", getSubmission);
router.get("/submissions", getMySubmissions);

module.exports = router;
