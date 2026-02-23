// src/middleware/error.middleware.js

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  // Log stack trace in dev only
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Helper: create an HTTP error quickly anywhere in the app
const createError = (message, status = 500) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

module.exports = { errorHandler, createError };
