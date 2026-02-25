// src/controllers/interview.controller.js
const prisma = require("../config/prisma");
const { createError } = require("../middleware/error.middleware");
const { generateQuestion } = require("../services/llm.service");

// ── START INTERVIEW ───────────────────────────────────────────────────────
const startInterview = async (req, res, next) => {
  try {
    const { roleName } = req.body;
    const userId = req.user.id;

    // Find the role
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw createError(`Role '${roleName}' not found`, 404);

    // Create a new session
    const session = await prisma.interviewSession.create({
      data: { userId, roleId: role.id },
      include: { role: true },
    });

    res.status(201).json({
      success: true,
      sessionId: session.id,
      role: role.name,
      status: session.status,
      message: `Interview started for ${role.name} role`,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET NEXT QUESTION ─────────────────────────────────────────────────────
const getNextQuestion = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const userId = req.user.id;

    // Load session — ensure it belongs to this user
    const session = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw createError("Session not found", 404);
    if (session.status === "COMPLETED") {
      return res.json({
        success: true,
        message: "Interview already completed",
      });
    }

    // Fetch all questions for this role
    const questions = await prisma.question.findMany({
      where: { roleId: session.roleId },
      orderBy: { id: "asc" },
    });

    const idx = session.currentQuestionIndex;

    // No more questions — mark session complete
    if (idx >= questions.length) {
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", endedAt: new Date() },
      });
      return res.json({
        success: true,
        message: "Interview complete!",
        totalQuestions: questions.length,
      });
    }

    // Advance index
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { currentQuestionIndex: idx + 1 },
    });

    const q = questions[idx];
    res.json({
      success: true,
      questionNumber: idx + 1,
      totalQuestions: questions.length,
      question: {
        id: q.id,
        content: q.content,
        topic: q.topic,
        difficulty: q.difficulty,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET ALL SESSIONS (history) ────────────────────────────────────────────
const getMySessions = async (req, res, next) => {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: { userId: req.user.id },
      include: { role: true },
      orderBy: { startedAt: "desc" },
    });
    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
};


// ── AI QUESTION GENERATOR ─────────────────────────────────────────────────
const getAIQuestion = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Load session
    const session = await prisma.interviewSession.findFirst({
      where: { id: parseInt(sessionId), userId },
      include: { role: true }
    });
    if (!session) throw createError('Session not found', 404);

    // Topic rotation — cycles through topics based on question index
    const topics = {
      SDE:         ['DSA', 'System Design', 'OOP', 'Databases', 'OS Concepts'],
      ML_ENGINEER: ['ML Theory', 'Deep Learning', 'Statistics', 'Model Deployment'],
      FRONTEND:    ['JavaScript', 'React', 'CSS', 'Performance', 'Testing'],
      BACKEND:     ['APIs', 'Databases', 'Caching', 'Security', 'Microservices'],
    };

    const roleTopics = topics[session.role.name] || ['General'];
    const topic = roleTopics[session.currentQuestionIndex % roleTopics.length];
    const difficulty = session.currentQuestionIndex < 2 ? 'easy'
                     : session.currentQuestionIndex < 5 ? 'medium' : 'hard';

    // Generate question (cached in Redis automatically)
    const aiQuestion = await generateQuestion(session.role.name, topic, difficulty);

    // Advance question index
    await prisma.interviewSession.update({
      where: { id: parseInt(sessionId) },
      data: { currentQuestionIndex: session.currentQuestionIndex + 1 }
    });

    res.json({
      success: true,
      questionNumber: session.currentQuestionIndex + 1,
      topic,
      difficulty,
      question: aiQuestion.question,
      // Don't send idealAnswer to frontend — only used for scoring
    });
  } catch (err) { next(err); }
};

// Add to module.exports:
 module.exports = { startInterview, getNextQuestion, getMySessions, getAIQuestion };



//module.exports = { startInterview, getNextQuestion, getMySessions };
