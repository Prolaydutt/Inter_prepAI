// // src/config/openai.js
//________________________OPENAI SDK VERSION________________________
// const OpenAI = require("openai");
// const env = require("./env");

// const openai = new OpenAI({
//   apiKey: env.OPENAI_API_KEY,
// });

// module.exports = openai;

//____________________GROQ SDK VERSION____________________
// src/config/openai.js
const Groq = require('groq-sdk');

const openai = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = openai;
