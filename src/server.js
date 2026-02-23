require("dotenv").config();
const app = require("./app");
const env = require("./config/env");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Test DB connection before accepting traffic
  await prisma.$connect();
  console.log("Database connected");

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
