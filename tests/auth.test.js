// tests/auth.test.js
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

afterAll(() => prisma.$disconnect());

describe("Auth Endpoints", () => {
  it("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "ci@test.com", username: "ciuser", password: "Test1234" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe("ci@test.com");
  });

  it("rejects duplicate email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@test.com", username: "dup1", password: "Test1234" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@test.com", username: "dup2", password: "Test1234" });

    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "login@test.com",
        username: "loginuser",
        password: "Test1234",
      });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "Test1234" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("rejects protected route without token", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });
});
