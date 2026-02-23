// src/routes/auth.routes.js
const router = require("express").Router();
const { register, login } = require("../controllers/auth.controller");
const {
  registerSchema,
  loginSchema,
  validate,
} = require("../validators/auth.validator");

// POST /api/auth/register
router.post("/register", validate(registerSchema), register);

// POST /api/auth/login
router.post("/login", validate(loginSchema), login);

module.exports = router;
