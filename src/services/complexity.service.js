// src/services/complexity.service.js
const acorn = require("acorn");

/**
 * Estimate time complexity by counting loop nesting depth.
 * Simple heuristic — not 100% accurate but impressive enough for a CV project.
 */
const analyzeComplexity = (code, language) => {
  try {
    if (language === "javascript") {
      return analyzeJS(code);
    } else if (language === "python") {
      return analyzePython(code);
    }
    return {
      complexity: "Unknown",
      explanation: "Language not supported for analysis",
    };
  } catch (err) {
    return { complexity: "Unknown", explanation: "Could not parse code" };
  }
};

// JavaScript analysis using AST
const analyzeJS = (code) => {
  const ast = acorn.parse(code, { ecmaVersion: 2020 });
  let maxDepth = 0;
  let hasRecursion = false;

  const LOOP_TYPES = [
    "ForStatement",
    "WhileStatement",
    "DoWhileStatement",
    "ForInStatement",
    "ForOfStatement",
  ];

  const traverse = (node, loopDepth = 0) => {
    if (!node || typeof node !== "object") return;

    if (LOOP_TYPES.includes(node.type)) {
      loopDepth++;
      maxDepth = Math.max(maxDepth, loopDepth);
    }

    // Simple recursion detection
    if (node.type === "CallExpression" && node.callee?.name) {
      hasRecursion = true;
    }

    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) child.forEach((c) => traverse(c, loopDepth));
      else if (child && typeof child === "object" && child.type)
        traverse(child, loopDepth);
    }
  };

  traverse(ast);

  return mapDepthToComplexity(maxDepth, hasRecursion);
};

// Python analysis using regex patterns
const analyzePython = (code) => {
  const lines = code.split("\n");
  let maxIndentLevel = 0;
  let loopDepth = 0;
  const hasRecursion = /def\s+(\w+).*\n[\s\S]*\1\s*\(/.test(code);

  for (const line of lines) {
    if (/^\s*(for|while)\s/.test(line)) {
      const indent = line.match(/^(\s*)/)[1].length;
      loopDepth = Math.floor(indent / 4) + 1;
      maxIndentLevel = Math.max(maxIndentLevel, loopDepth);
    }
  }

  return mapDepthToComplexity(maxIndentLevel, hasRecursion);
};

const mapDepthToComplexity = (depth, hasRecursion) => {
  if (hasRecursion && depth === 0)
    return {
      complexity: "O(2^n) or O(n!)",
      explanation: "Recursive solution detected",
      rating: "poor",
    };
  switch (depth) {
    case 0:
      return {
        complexity: "O(1) or O(n)",
        explanation: "No loops — constant or linear",
        rating: "excellent",
      };
    case 1:
      return {
        complexity: "O(n)",
        explanation: "Single loop — linear time",
        rating: "good",
      };
    case 2:
      return {
        complexity: "O(n^2)",
        explanation: "Nested loops — quadratic time",
        rating: "fair",
      };
    case 3:
      return {
        complexity: "O(n^3)",
        explanation: "Triple nested loops — cubic",
        rating: "poor",
      };
    default:
      return {
        complexity: `O(n^${depth})`,
        explanation: "Deeply nested loops",
        rating: "poor",
      };
  }
};

module.exports = { analyzeComplexity };
