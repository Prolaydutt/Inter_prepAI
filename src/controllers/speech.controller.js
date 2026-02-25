// src/controllers/speech.controller.js
const path = require("path");
const fs = require("fs");
const prisma = require("../config/prisma");
const { transcribeAudio, textToSpeech } = require("../services/speech.service");
const { createError } = require("../middleware/error.middleware");

// ── UPLOAD AUDIO + TRANSCRIBE ─────────────────────────────────────────────
// Called when user finishes speaking their answer
const uploadAndTranscribe = async (req, res, next) => {
  try {
    if (!req.file) throw createError("No audio file uploaded", 400);

    const { sessionId, questionText } = req.body;
    if (!sessionId || !questionText) {
      throw createError("sessionId and questionText are required", 400);
    }

    // Transcribe the audio using Whisper
    const transcript = await transcribeAudio(req.file.path);

    // Save the answer to the database
    const answer = await prisma.interviewAnswer.create({
      data: {
        sessionId: parseInt(sessionId),
        questionText: questionText,
        transcript: transcript,
        audioPath: req.file.path,
      },
    });

    res.json({
      success: true,
      answerId: answer.id,
      transcript: transcript,
      message: "Answer transcribed successfully",
    });
  } catch (err) {
    next(err);
  }
};

// ── TEXT TO SPEECH ────────────────────────────────────────────────────────
// Called when AI needs to speak a question aloud
const speakText = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) throw createError("text is required", 400);
    if (text.length > 1000)
      throw createError("Text too long (max 1000 chars)", 400);

    // Generate audio from OpenAI TTS
    const audioBuffer = await textToSpeech(text);

    // Send audio directly as response
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadAndTranscribe, speakText };
