// src/controllers/coding.controller.js
const prisma = require("../config/prisma");
const { runTestCases } = require("../services/testRunner.service");
const { analyzeComplexity } = require("../services/complexity.service");
const { createError } = require("../middleware/error.middleware");
const { scanCode } = require("../services/codeSecurity.service");

// ── GET ALL PROBLEMS ──────────────────────────────────────────────────────
const getProblems = async (req, res, next) => {
  try {
    const { difficulty, topic } = req.query;
    const where = {};
    if (difficulty) where.difficulty = difficulty;
    if (topic) where.topic = topic;

    const problems = await prisma.codingProblem.findMany({
      where,
      select: {
        id: true,
        title: true,
        difficulty: true,
        topic: true,
        timeLimit: true,
        memoryLimit: true,
        _count: { select: { testCases: true } },
      },
      orderBy: [{ difficulty: "asc" }, { id: "asc" }],
    });

    res.json({ success: true, count: problems.length, problems });
  } catch (err) {
    next(err);
  }
};

// ── GET SINGLE PROBLEM ───────────────────────────────────────────────────
const getProblemById = async (req, res, next) => {
  try {
    const problem = await prisma.codingProblem.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        testCases: {
          where: { isHidden: false }, // Only show non-hidden test cases
          select: { id: true, input: true, expected: true, points: true },
        },
      },
    });
    if (!problem) throw createError("Problem not found", 404);
    res.json({ success: true, problem });
  } catch (err) {
    next(err);
  }
};

// ── SUBMIT CODE ──────────────────────────────────────────────────────────
const submitCode = async (req, res, next) => {
  try {
    const { problemId, language, code, sessionId } = req.body;
    if (!problemId || !language || !code) {
      throw createError("problemId, language, and code are required", 400);
    }

    const SUPPORTED = ["python", "javascript"];
    if (!SUPPORTED.includes(language)) {
      throw createError(
        `Language must be one of: ${SUPPORTED.join(", ")}`,
        400,
      );
    }

    if (code.length > 10000)
      throw createError("Code too long (max 10000 chars)", 400);
    // ── Security scan — reject dangerous code before Docker execution ──
    const securityCheck = scanCode(code, language);
    if (!securityCheck.safe) {
      throw createError(`Security violation: ${securityCheck.reason}`, 400);
    }

    // Load problem + ALL test cases (including hidden)
    const problem = await prisma.codingProblem.findUnique({
      where: { id: parseInt(problemId) },
      include: { testCases: true },
    });
    if (!problem) throw createError("Problem not found", 404);

    // Create submission record with PENDING status
    const submission = await prisma.codeSubmission.create({
      data: {
        userId: req.user.id,
        problemId: problem.id,
        language,
        code,
        status: "RUNNING",
        totalCases: problem.testCases.length,
        sessionId: sessionId ? parseInt(sessionId) : null,
      },
    });

    // Run against all test cases
    const testResults = await runTestCases(
      code,
      language,
      problem.testCases,
      problem.timeLimit,
    );

    // Analyze code complexity
    const complexity = analyzeComplexity(code, language);

    // Determine final status
    const allPassed = testResults.passedCount === testResults.totalCases;
    const anyTimeout = testResults.results.some((r) => r.timedOut);
    const anyError = testResults.results.some(
      (r) => r.errorMessage && !r.timedOut,
    );

    let status = "WRONG_ANSWER";
    if (allPassed) status = "ACCEPTED";
    else if (anyTimeout)
      status = "TLE"; // Time Limit Exceeded
    else if (anyError) status = "ERROR";

    // Average runtime across test cases
    const avgRuntime = Math.round(
      testResults.results.reduce((s, r) => s + r.runtime, 0) /
        testResults.results.length,
    );

    // Update submission with results
    const updated = await prisma.codeSubmission.update({
      where: { id: submission.id },
      data: {
        status,
        score: testResults.score,
        passedCases: testResults.passedCount,
        runtime: avgRuntime,
        complexityScore: complexity.complexity,
      },
    });

    res.json({
      success: true,
      submissionId: updated.id,
      status,
      score: testResults.score,
      passedCases: testResults.passedCount,
      totalCases: testResults.totalCases,
      runtime: `${avgRuntime}ms`,
      complexity: {
        estimate: complexity.complexity,
        explanation: complexity.explanation,
        rating: complexity.rating,
      },
      testResults: testResults.results,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET SUBMISSION ────────────────────────────────────────────────────────
const getSubmission = async (req, res, next) => {
  try {
    const submission = await prisma.codeSubmission.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      include: { problem: { select: { title: true, difficulty: true } } },
    });
    if (!submission) throw createError("Submission not found", 404);
    res.json({ success: true, submission });
  } catch (err) {
    next(err);
  }
};

const getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await prisma.codeSubmission.findMany({
      where: { userId: req.user.id },
      include: { problem: { select:{title:true,difficulty:true} } },
      orderBy: { createdAt: "desc" },
      take: 20   // Last 20 submissions
    });
    res.json({ success:true, submissions });
  } catch(err) { next(err); }
};

    // Add getMySubmissions to module.exports
module.exports = { getProblems, getProblemById, submitCode, getSubmission, getMySubmissions };

// module.exports = { getProblems, getProblemById, submitCode, getSubmission };
