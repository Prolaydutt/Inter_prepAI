// src/config/multer.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Unique filename: userId_timestamp.webm
    const name = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  // Only allow audio files
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max (Whisper limit)
});

module.exports = upload;
