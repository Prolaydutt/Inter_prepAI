// src/services/scoring.service.js
const redis = require('../config/redis');

let embedder = null;

// Load the embedding model once and reuse it
const getEmbedder = async () => {
  if (embedder) return embedder;

  console.log('Loading embedding model... (first time only, takes 30 seconds)');
  const { pipeline } = await import('@xenova/transformers');
  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('Embedding model loaded!');
  return embedder;
};

/**
 * Get embedding vector for a piece of text.
 * Runs locally — no API calls, completely free.
 */
const getEmbedding = async (text) => {
  const cacheKey = `embedding:${Buffer.from(text).toString('base64').slice(0, 64)}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const pipe   = await getEmbedder();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  const embedding = Array.from(output.data);

  await redis.setex(cacheKey, 60 * 60 * 24, JSON.stringify(embedding));
  return embedding;
};

/**
 * Calculate cosine similarity between two vectors.
 * Returns 0 (different) to 1 (identical).
 */
const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Score a user answer against the ideal answer.
 * Returns score 0-100 with detailed feedback.
 */
const scoreAnswer = async (idealAnswer, userTranscript, keyPoints = []) => {
  const [idealEmbedding, userEmbedding] = await Promise.all([
    getEmbedding(idealAnswer),
    getEmbedding(userTranscript),
  ]);

  const similarity = cosineSimilarity(idealEmbedding, userEmbedding);
  const rawScore   = Math.round(similarity * 100);

  // Keyword coverage bonus
  const transcriptLower    = userTranscript.toLowerCase();
  const coveredKeyPoints   = keyPoints.filter(kp =>
    transcriptLower.includes(kp.toLowerCase())
  );
  const keywordBonus = keyPoints.length > 0
    ? Math.round((coveredKeyPoints.length / keyPoints.length) * 10)
    : 0;

  const finalScore = Math.min(rawScore + keywordBonus, 100);

  const feedback = finalScore >= 80 ? 'Excellent answer — great depth and accuracy'
                 : finalScore >= 60 ? 'Good answer — covers the main points'
                 : finalScore >= 40 ? 'Partial answer — some key concepts missing'
                 : 'Needs improvement — review this topic';

  return {
    score:           finalScore,
    similarityScore: rawScore,
    keywordBonus,
    coveredKeyPoints,
    missedKeyPoints: keyPoints.filter(kp => !coveredKeyPoints.includes(kp)),
    feedback,
  };
};

module.exports = { scoreAnswer, getEmbedding, cosineSimilarity };
// ```

// **Step 3 — Test again in Postman**

// The first time you call the scoring endpoint it will take about 30 seconds to download and load the embedding model. You will see this in your terminal:
// ```
// Loading embedding model... (first time only, takes 30 seconds)
// Embedding model loaded!