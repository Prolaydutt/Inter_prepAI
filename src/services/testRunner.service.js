// src/services/testRunner.service.js
const { executeCode } = require("./executor.service");

/**
 * Run code against all test cases for a problem.
 * Returns detailed results for each test case.
 */
const runTestCases = async (code, language, testCases, timeLimit = 5000) => {
  const results = [];
  let passedCount = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  for (const testCase of testCases) {
    // Execute code with this test case input
    const execution = await executeCode(
      code,
      language,
      testCase.input,
      timeLimit,
    );

    // Normalise output — trim whitespace for comparison
    const actualOutput = execution.stdout.trim().replace(/\r\n/g, "\n");
    const expectedOutput = testCase.expected.trim().replace(/\r\n/g, "\n");
    const passed =
      !execution.timedOut &&
      execution.exitCode === 0 &&
      actualOutput === expectedOutput;

    if (passed) {
      passedCount++;
      earnedPoints += testCase.points;
    }
    totalPoints += testCase.points;

    results.push({
      testCaseId: testCase.id,
      passed,
      input: testCase.isHidden ? "Hidden" : testCase.input,
      expected: testCase.isHidden ? "Hidden" : testCase.expected,
      actual: testCase.isHidden && !passed ? "Wrong Answer" : actualOutput,
      runtime: execution.runtime,
      timedOut: execution.timedOut,
      errorMessage: execution.stderr || null,
    });
  }

  const score =
    totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return {
    results,
    passedCount,
    totalCases: testCases.length,
    score,
    earnedPoints,
    totalPoints,
  };
};

module.exports = { runTestCases };
