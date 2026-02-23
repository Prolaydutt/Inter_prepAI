// src/utils/jwt.utils.js
const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Create a signed JWT token
 * payload: { userId, email }
 */
const createToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

/**
 * Verify and decode a JWT token
 * Throws JsonWebTokenError if invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

module.exports = { createToken, verifyToken };
