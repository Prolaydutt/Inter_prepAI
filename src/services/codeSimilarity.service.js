// src/services/codeSimilarity.service.js
const { getEmbedding, cosineSimilarity } = require("./scoring.service");

// Known solution patterns for common problems
// In production these would come from DB — for now hardcoded
const KNOWN_SOLUTIONS = {
  twoSum: [
    // Optimal hash map solution
    `seen = {} for i, n in enumerate(nums): if target - n in seen: return [seen[target-n], i] seen[n] = i`,
    // Brute force solution
    `for i in range(len(nums)): for j in range(i+1, len(nums)): if nums[i] + nums[j] == target: return [i, j]`,
  ],
};

/**
 * Check if submitted code is suspiciously similar to known solutions.
 * Returns similarity score 0-100.
 */
const checkCodeSimilarity = async (submittedCode, problemTitle) => {
  try {
    // Normalise code — remove comments, extra whitespace
    const normalised = submittedCode
      .replace(/#.*/g, "") // Remove Python comments
      .replace(/\/\/.*/g, "") // Remove JS comments
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim();

    if (normalised.length < 20) return 0; // Too short to analyse

    // Get embedding for submitted code
    const submittedEmbedding = await getEmbedding(normalised);

    // Find matching known solutions
    const key = problemTitle.toLowerCase().replace(/\s+/g, "");
    const knownSolutions = KNOWN_SOLUTIONS[key] || [];

    if (knownSolutions.length === 0) return 0;

    // Compare against each known solution
    let maxSimilarity = 0;
    for (const solution of knownSolutions) {
      const knownEmbedding = await getEmbedding(solution);
      const similarity = cosineSimilarity(submittedEmbedding, knownEmbedding);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    // Convert to 0-100 scale
    // High similarity to known solution is NOT cheating by itself
    // It only contributes a small weight to the overall score
    return Math.round(maxSimilarity * 100);
  } catch (err) {
    console.error("Code similarity check failed:", err.message);
    return 0; // Fail gracefully
  }
};

module.exports = { checkCodeSimilarity };
