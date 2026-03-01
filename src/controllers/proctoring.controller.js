// src/controllers/proctoring.controller.js
const prisma = require("../config/prisma");
const { createError } = require("../middleware/error.middleware");

const VALID_EVENT_TYPES = [
  "TAB_SWITCH",
  "WINDOW_BLUR",
  "WINDOW_FOCUS",
  "COPY",
  "PASTE",
  "PASTE_SPIKE",
  "IDLE",
  "RAPID_TYPING",
];

// ── LOG A SINGLE EVENT ───────────────────────────────────────────────────
// Called by frontend every time a suspicious event happens
const logEvent = async (req, res, next) => {
  try {
    const { sessionId, eventType, metadata } = req.body;
    if (!sessionId || !eventType) {
      throw createError("sessionId and eventType are required", 400);
    }
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      throw createError(
        `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(", ")}`,
        400,
      );
    }

    // Verify session belongs to this user
    const session = await prisma.interviewSession.findFirst({
      where: { id: parseInt(sessionId), userId: req.user.id },
    });
    if (!session) throw createError("Session not found", 404);

    const event = await prisma.proctoringEvent.create({
      data: {
        sessionId: parseInt(sessionId),
        userId: req.user.id,
        eventType,
        metadata: metadata || {},
      },
    });

    res.status(201).json({ success: true, eventId: event.id });
  } catch (err) {
    next(err);
  }
};

// ── LOG MULTIPLE EVENTS AT ONCE ──────────────────────────────────────────
// Frontend batches events and sends them together every 30 seconds
const logEventBatch = async (req, res, next) => {
  try {
    const { sessionId, events } = req.body;
    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      throw createError("sessionId and events array are required", 400);
    }

    // Verify session belongs to this user
    const session = await prisma.interviewSession.findFirst({
      where: { id: parseInt(sessionId), userId: req.user.id },
    });
    if (!session) throw createError("Session not found", 404);

    // Validate and prepare all events
    const validEvents = events
      .filter((e) => VALID_EVENT_TYPES.includes(e.eventType))
      .map((e) => ({
        sessionId: parseInt(sessionId),
        userId: req.user.id,
        eventType: e.eventType,
        metadata: e.metadata || {},
      }));

    // Bulk insert — much faster than individual inserts
    await prisma.proctoringEvent.createMany({ data: validEvents });

    res.json({ success: true, logged: validEvents.length });
  } catch (err) {
    next(err);
  }
};

// ── GET EVENTS FOR A SESSION ─────────────────────────────────────────────
const getSessionEvents = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId);

    const events = await prisma.proctoringEvent.findMany({
      where: { sessionId, userId: req.user.id },
      orderBy: { timestamp: "asc" },
    });

    // Count events by type
    const summary = events.reduce((acc, e) => {
      acc[e.eventType] = (acc[e.eventType] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, totalEvents: events.length, summary, events });
  } catch (err) {
    next(err);
  }
};

module.exports = { logEvent, logEventBatch, getSessionEvents };
