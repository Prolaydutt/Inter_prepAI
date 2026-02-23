// src/utils/password.utils.js
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12; // Higher = more secure but slower

/**
 * Hash a plain-text password using bcrypt
 * NEVER store plain passwords in the database
 */
const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Compare a submitted password against the stored hash
 * bcrypt.compare is timing-safe — no timing attacks possible
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { hashPassword, verifyPassword };
