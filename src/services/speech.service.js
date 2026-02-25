// src/services/speech.service.js
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");

// ── SPEECH TO TEXT using Groq Whisper (free) ─────────────────────────────
const transcribeAudio = async (audioFilePath) => {
  const form = new FormData();
  form.append("file", fs.createReadStream(audioFilePath));
  form.append("model", "whisper-large-v3");
  form.append("language", "en");
  form.append("response_format", "text");

  const response = await axios.post(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
    },
  );

  return response.data;
};

// ── TEXT TO SPEECH using ElevenLabs ──────────────────────────────────────
const textToSpeech = async (text) => {
  try {
    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb",
      {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        responseType: "arraybuffer",
      },
    );
    return Buffer.from(response.data);
  } catch (err) {
    console.log("ElevenLabs Error:", Buffer.from(err.response.data).toString());
    throw err;
  }
};

module.exports = { transcribeAudio, textToSpeech };
