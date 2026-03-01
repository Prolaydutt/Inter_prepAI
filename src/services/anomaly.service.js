// src/services/anomaly.service.js

// Scoring weights — must sum to 1.0
const WEIGHTS = {
  tabSwitch: 0.25,
  paste: 0.3,
  idle: 0.15,
  typing: 0.2,
  similarity: 0.1,
};

/**
 * Score tab switching behaviour.
 * 0-2 switches = normal, 3-5 = suspicious, 6+ = very suspicious
 */
const scoreTabSwitches = (events) => {
  const switches = events.filter((e) => e.eventType === "TAB_SWITCH").length;
  if (switches === 0) return 0;
  if (switches <= 2) return 20;
  if (switches <= 5) return 50;
  if (switches <= 10) return 75;
  return 100;
};

/**
 * Score paste behaviour.
 * Regular paste = slightly suspicious.
 * Paste spike (>50 chars at once) = very suspicious.
 */
const scorePasteBehaviour = (events) => {
  const pastes = events.filter((e) => e.eventType === "PASTE").length;
  const pasteSpikes = events.filter(
    (e) => e.eventType === "PASTE_SPIKE",
  ).length;

  if (pastes === 0 && pasteSpikes === 0) return 0;

  let score = 0;
  score += Math.min(pastes * 10, 40); // Up to 40 points for regular pastes
  score += Math.min(pasteSpikes * 25, 60); // Up to 60 points for paste spikes
  return Math.min(score, 100);
};

/**
 * Score idle periods.
 * Long idle periods may mean user is searching for answers.
 */
const scoreIdlePeriods = (events) => {
  const idles = events.filter((e) => e.eventType === "IDLE");
  if (idles.length === 0) return 0;

  // Check total idle duration from metadata
  const totalIdleMs = idles.reduce((sum, e) => {
    return sum + (e.metadata?.duration || 30000);
  }, 0);

  const totalIdleMinutes = totalIdleMs / 60000;
  if (totalIdleMinutes < 1) return 10;
  if (totalIdleMinutes < 3) return 30;
  if (totalIdleMinutes < 5) return 60;
  return 80;
};

/**
 * Score typing anomalies.
 * Sudden WPM spikes suggest copy-paste disguised as typing.
 */
const scoreTypingAnomalies = (events) => {
  const rapidEvents = events.filter((e) => e.eventType === "RAPID_TYPING");
  if (rapidEvents.length === 0) return 0;

  const wpmValues = rapidEvents
    .map((e) => e.metadata?.wpm || 0)
    .filter((w) => w > 0);

  if (wpmValues.length === 0) return 20;

  const avgWpm = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
  // Normal typing: 40-80 WPM. Above 150 WPM is humanly impossible.
  if (avgWpm > 200) return 90;
  if (avgWpm > 150) return 70;
  if (avgWpm > 100) return 40;
  return 20;
};

/**
 * Combine all scores into a final risk assessment.
 * similarityScore is passed in from the code similarity service (Week 13).
 */
const calculateOverallRisk = (events, similarityScore = 0) => {
  const tabSwitchScore = scoreTabSwitches(events);
  const pasteScore = scorePasteBehaviour(events);
  const idleScore = scoreIdlePeriods(events);
  const typingScore = scoreTypingAnomalies(events);

  // Weighted average
  const overallRisk = Math.round(
    tabSwitchScore * WEIGHTS.tabSwitch +
      pasteScore * WEIGHTS.paste +
      idleScore * WEIGHTS.idle +
      typingScore * WEIGHTS.typing +
      similarityScore * WEIGHTS.similarity,
  );

  // Risk level labels
  const riskLevel =
    overallRisk >= 75
      ? "CRITICAL"
      : overallRisk >= 50
        ? "HIGH"
        : overallRisk >= 25
          ? "MEDIUM"
          : "LOW";

  // Human-readable summary
  const summary = generateSummary({
    tabSwitchScore,
    pasteScore,
    idleScore,
    typingScore,
    similarityScore,
    riskLevel,
  });

  return {
    tabSwitchScore,
    pasteScore,
    idleScore,
    typingScore,
    similarityScore,
    overallRisk,
    riskLevel,
    summary,
  };
};

const generateSummary = ({
  tabSwitchScore,
  pasteScore,
  idleScore,
  typingScore,
  riskLevel,
}) => {
  const flags = [];
  if (tabSwitchScore >= 50) flags.push("frequent tab switching detected");
  if (pasteScore >= 50) flags.push("suspicious paste activity detected");
  if (idleScore >= 30) flags.push("extended idle periods detected");
  if (typingScore >= 40) flags.push("abnormal typing speed detected");

  if (flags.length === 0) return "No suspicious activity detected.";
  return `Risk level: ${riskLevel}. Flags: ${flags.join(", ")}.`;
};

module.exports = {
  calculateOverallRisk,
  scoreTabSwitches,
  scorePasteBehaviour,
};
 