// src/validators/auth.validator.js
const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email("Must be a valid email"),
  username: z.string().min(3).max(30),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// Middleware factory: validates req.body against a Zod schema
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      errors: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data; // Replace body with parsed+validated data
  next();
};

module.exports = { registerSchema, loginSchema, validate };
