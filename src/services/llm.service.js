// src/services/llm.service.js
const openai = require('../config/openai');
const redis  = require('../config/redis');
const env    = require('../config/env');

const CACHE_TTL = 60 * 60 * 24; // Cache for 24 hours (in seconds)

/**
 * Generate an interview question for a given role and topic.
 * Checks Redis cache first — only hits OpenAI on a cache miss.
 */
const generateQuestion = async (role, topic, difficulty='medium') => {
  // Build a cache key from the inputs
  const cacheKey = `question:${role}:${topic}:${difficulty}`;

  // Check Redis cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`Cache HIT for ${cacheKey}`);
    return JSON.parse(cached);
  }

  console.log(`Cache MISS for ${cacheKey} — calling OpenAI`);

  // Build prompt
    const prompt = `
    You are a senior technical interviewer at a top product company.
    Generate ONE ${difficulty} difficulty interview question for a ${role} candidate.
    Topic: ${topic}.
    
    Return ONLY a JSON object with this exact structure:
    {
      "question": "the interview question here",
      "idealAnswer": "a comprehensive ideal answer (3-5 sentences)",
      "keyPoints": ["key point 1", "key point 2", "key point 3"]
    }
    Do not include any text outside the JSON.`;

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },  // Forces JSON output
    temperature: 0.7,
    max_tokens: 500,
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Cache the result in Redis
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));

  return result;
};

/**
 * Generate a follow-up question based on the user's previous answer.
 * These are NOT cached since they depend on the user's specific answer.
 */
const generateFollowUp = async (role, previousQuestion, userAnswer) => {
    const prompt = `
    You are a senior technical interviewer.
    The candidate (${role}) just answered this question:
    Question: ${previousQuestion}
    Their answer: ${userAnswer}
    
    Generate ONE natural follow-up question based on their answer.
    Return ONLY a JSON object: { "question": "follow-up question here" }`;

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.8,
    max_tokens: 200,
  });

  return JSON.parse(response.choices[0].message.content);
};

module.exports = { generateQuestion, generateFollowUp };
