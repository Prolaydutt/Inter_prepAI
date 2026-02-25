// src/routes/speech.routes.js
const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const upload = require("../config/multer");
const {
  uploadAndTranscribe,
  speakText,
} = require("../controllers/speech.controller");

// All routes require auth
router.use(protect);

// POST /api/speech/transcribe
// Body: multipart/form-data with 'audio' file + sessionId + questionText fields
router.post("/transcribe", upload.single("audio"), uploadAndTranscribe);

// POST /api/speech/speak
// Body: { text: 'Question to speak aloud' }
// Returns: audio/mpeg binary stream
router.post("/speak", speakText);

module.exports = router;
