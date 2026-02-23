// src/routes/user.routes.js
const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");

// GET /api/users/me — protected route, returns logged-in user's profile
router.get("/me", protect, (req, res) => {
  // req.user is set by the protect middleware
  res.json({ success: true, user: req.user });
});

module.exports = router;
