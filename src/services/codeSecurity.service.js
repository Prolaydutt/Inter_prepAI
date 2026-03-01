// src/services/codeSecurity.service.js

const DANGEROUS_PATTERNS = {
  python: [
    { pattern: /import\s+os/, reason: "OS module not allowed" },
    { pattern: /import\s+subprocess/, reason: "subprocess not allowed" },
    { pattern: /open\s*\(/, reason: "File operations not allowed" },
    { pattern: /__import__/, reason: "Dynamic imports not allowed" },
    { pattern: /exec\s*\(/, reason: "exec() not allowed" },
    { pattern: /eval\s*\(/, reason: "eval() not allowed" },
  ],
  javascript: [
    { pattern: /require\s*\(/, reason: "require() not allowed" },
    { pattern: /process\.exit/, reason: "process.exit not allowed" },
    { pattern: /child_process/, reason: "child_process not allowed" },
    { pattern: /fs\./, reason: "File system access not allowed" },
    { pattern: /eval\s*\(/, reason: "eval() not allowed" },
  ],
};

const scanCode = (code, language) => {
  const patterns = DANGEROUS_PATTERNS[language] || [];

  for (const { pattern, reason } of patterns) {
    if (pattern.test(code)) {
      return { safe: false, reason };
    }
  }

  // Check code length
  if (code.length > 10000) {
    return { safe: false, reason: "Code exceeds maximum length" };
  }

  return { safe: true, reason: null };
};

module.exports = { scanCode };
