// src/controllers/scoring.controller.js
const prisma = require("../config/prisma");
const { scoreAnswer } = require("../services/scoring.service");
const { generateQuestion } = require("../services/llm.service");
const { createError } = require("../middleware/error.middleware");

/**
 * Score a submitted answer.
 * Expects: { answerId, idealAnswer, keyPoints[] }
 * Returns: score, feedback, breakdown
 */
const submitAndScore = async (req, res, next) => {
  try {
    const { answerId, idealAnswer, keyPoints = [] } = req.body;
    if (!answerId || !idealAnswer) {
      throw createError("answerId and idealAnswer are required", 400);
    }

    // Load the answer from DB
    const answer = await prisma.interviewAnswer.findUnique({
      where: { id: parseInt(answerId) },
      include: { session: { include: { user: true } } },
    });
    if (!answer) throw createError("Answer not found", 404);

    // Ensure this answer belongs to the logged-in user
    if (answer.session.user.id !== req.user.id) {
      throw createError("Unauthorized", 403);
    }

    // Score the answer using embeddings
    const result = await scoreAnswer(idealAnswer, answer.transcript, keyPoints);

    // Save score + feedback to DB
    await prisma.interviewAnswer.update({
      where: { id: answer.id },
      data: {
        score: result.score,
        feedback: result.feedback,
      },
    });

    res.json({
      success: true,
      score: result.score,
      feedback: result.feedback,
      breakdown: {
        similarityScore: result.similarityScore,
        keywordBonus: result.keywordBonus,
        coveredKeyPoints: result.coveredKeyPoints,
        missedKeyPoints: result.missedKeyPoints,
      },
      transcript: answer.transcript,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get the full session report with all scores.
 */
const getSessionReport = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId);

    const answers = await prisma.interviewAnswer.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    const scores = answers.map((a) => a.score).filter(Boolean);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    res.json({
      success: true,
      sessionId,
      totalQuestions: answers.length,
      averageScore: avgScore,
      grade:
        avgScore >= 80
          ? "A"
          : avgScore >= 60
            ? "B"
            : avgScore >= 40
              ? "C"
              : "D",
      answers: answers.map((a) => ({
        question: a.questionText,
        transcript: a.transcript,
        score: a.score,
        feedback: a.feedback,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitAndScore, getSessionReport };
