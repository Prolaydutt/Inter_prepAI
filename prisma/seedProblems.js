// prisma/seedProblems.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Problem 1 — Easy
  const p1 = await prisma.codingProblem.create({
    data: {
      title: "Two Sum",
      difficulty: "easy",
      topic: "Arrays",
      timeLimit: 5000,
      memoryLimit: 128,
      description: `Given an array of integers nums and an integer target,
return indices of the two numbers that add up to target.`,
      starterCode: {
        python:
          "def twoSum(nums, target):\n    # Write your solution here\n    pass",
        javascript:
          "function twoSum(nums, target) {\n    // Write your solution here\n}",
      },
      testCases: {
        create: [
          // Find these lines and update expected values:
          {
            input: "[2,7,11,15]\n9",
            expected: "[0, 1]",
            isHidden: false,
            points: 10,
          },
          {
            input: "[3,2,4]\n6",
            expected: "[1, 2]",
            isHidden: true,
            points: 10,
          },
          { input: "[3,3]\n6", expected: "[0, 1]", isHidden: true, points: 10 },
        ],
      },
    },
  });

  // Problem 2 — Medium
  const p2 = await prisma.codingProblem.create({
    data: {
      title:       "Reverse Linked List",
      difficulty:  "medium",
      topic:       "Linked Lists",
      timeLimit:   5000,
      memoryLimit: 128,
      description: `Reverse a singly linked list. Return the head of the reversed list.`,
      starterCode: {
        python:     "def reverseList(head):\n    # Write your solution here\n    pass",
        javascript: "function reverseList(head) {\n    // Write your solution here\n}",
      },
      testCases: {
        create: [
          { input: "[1,2,3,4,5]", expected: "[5,4,3,2,1]", isHidden: false, points: 10 },
          { input: "[1,2]",       expected: "[2,1]",       isHidden: true,  points: 10 },
          { input: "[]",          expected: "[]",          isHidden: true,  points: 10 },
        ]
      }
    }
  });

  // Problem 3 — Hard
  await prisma.codingProblem.create({
    data: {
      title:       "Longest Palindromic Substring",
      difficulty:  "hard",
      topic:       "Dynamic Programming",
      timeLimit:   5000,
      memoryLimit: 128,
      description: `Given a string s, return the longest palindromic substring in s.`,
      starterCode: {
        python:     "def longestPalindrome(s):\n    # Write your solution here\n    pass",
        javascript: "function longestPalindrome(s) {\n    // Write your solution here\n}",
      },
      testCases: {
        create: [
          { input: "babad",  expected: "bab",  isHidden: false, points: 10 },
          { input: "cbbd",   expected: "bb",   isHidden: true,  points: 10 },
          { input: "racecar",expected: "racecar",isHidden:true, points: 10 },
        ]
      }
    }
  });

  console.log('Coding problems seeded!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
//node prisma/seedProblems.js
