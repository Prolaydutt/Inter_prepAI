// src/controllers/cheating.controller.js
const prisma = require("../config/prisma");
const { calculateOverallRisk } = require("../services/anomaly.service");
const { createError } = require("../middleware/error.middleware");
const { checkCodeSimilarity } = require("../services/codeSimilarity.service");

// ── GENERATE CHEATING REPORT FOR A SESSION ───────────────────────────────
const generateReport = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const userId = req.user.id;

    // Load all proctoring events for this session
    const events = await prisma.proctoringEvent.findMany({
      where: { sessionId, userId },
      orderBy: { timestamp: "asc" },
    });

    if (events.length === 0) {
      return res.json({
        success: true,
        message: "No proctoring events found for this session",
        riskLevel: "LOW",
        overallRisk: 0,
      });
    }

    // Calculate risk scores
    let similarityScore = 0;

    // Get latest code submission for this session
    const latestSubmission = await prisma.codeSubmission.findFirst({
      where: { sessionId },
      include: { problem: true },
      orderBy: { createdAt: "desc" },
    });

    if (latestSubmission) {
      similarityScore = await checkCodeSimilarity(
        latestSubmission.code,
        latestSubmission.problem.title,
      );
    }

    const riskData = calculateOverallRisk(events, similarityScore);

    // Save or update the report in DB
    const report = await prisma.cheatingReport.upsert({
      where: { sessionId },
      update: { ...riskData },
      create: { sessionId, userId, ...riskData },
    });

    res.json({
      success: true,
      sessionId,
      report: {
        overallRisk: report.overallRisk,
        riskLevel: report.riskLevel,
        summary: report.summary,
        breakdown: {
          tabSwitches: report.tabSwitchScore,
          pasteBehaviour: report.pasteScore,
          idlePeriods: report.idleScore,
          typingPattern: report.typingScore,
          codeSimilarity: report.similarityScore,
        },
        totalEventsAnalysed: events.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET EXISTING REPORT ──────────────────────────────────────────────────
const getReport = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId);

    const report = await prisma.cheatingReport.findUnique({
      where: { sessionId },
    });

    if (!report) {
      return res.json({
        success: true,
        message: "No report generated yet. Call POST /generate first.",
      });
    }

    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

module.exports = { generateReport, getReport };
