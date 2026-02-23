// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Create Roles
  const sde = await prisma.role.upsert({
    where: { name: "SDE" },
    update: {},
    create: { name: "SDE", description: "Software Development Engineer" },
  });

  const ml = await prisma.role.upsert({
    where: { name: "ML_ENGINEER" },
    update: {},
    create: { name: "ML_ENGINEER", description: "Machine Learning Engineer" },
  });

  const fe = await prisma.role.upsert({
    where: { name: "FRONTEND" },
    update: {},
    create: { name: "FRONTEND", description: "Frontend Developer" },
  });

  // Create Questions
  const questions = [
    {
      roleId: sde.id,
      content: "Explain the difference between a stack and a queue.",
      difficulty: "easy",
      topic: "DSA",
    },
    {
      roleId: sde.id,
      content: "How would you design a URL shortening service?",
      difficulty: "hard",
      topic: "System Design",
    },
    {
      roleId: sde.id,
      content: "What is the time complexity of quicksort?",
      difficulty: "medium",
      topic: "DSA",
    },
    {
      roleId: ml.id,
      content: "Explain how gradient descent works.",
      difficulty: "medium",
      topic: "ML Concepts",
    },
    {
      roleId: ml.id,
      content: "What is the difference between bias and variance?",
      difficulty: "easy",
      topic: "ML Concepts",
    },
    {
      roleId: fe.id,
      content: "Explain the difference between == and === in JS.",
      difficulty: "easy",
      topic: "JavaScript",
    },
    {
      roleId: fe.id,
      content: "What is the virtual DOM and how does React use it?",
      difficulty: "medium",
      topic: "React",
    },
  ];

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
