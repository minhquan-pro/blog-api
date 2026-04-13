import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

const skipIntegration = process.env.SKIP_INTEGRATION === "1";
const root = fileURLToPath(new URL("../", import.meta.url));

const IDS = {
  userDemo: "10000000-0000-4000-8000-000000000001",
  userLan: "10000000-0000-4000-8000-000000000002",
  post1: "40000000-0000-4000-8000-000000000001",
};

describe.skipIf(skipIntegration)("API integration (MySQL + prisma migrate reset)", () => {
  const app = createApp();

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required when SKIP_INTEGRATION=0");
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
      process.env.JWT_SECRET = "test-secret-min-32-characters-long!!";
    }
    execSync("npx prisma migrate reset --force", {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env },
    });
  });

  afterAll(async () => {
    const { prisma } = await import("../src/lib/prisma.js");
    await prisma.$disconnect();
  });

  it("GET /api/tags", async () => {
    const res = await request(app).get("/api/tags");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  it("GET /api/posts/feed", async () => {
    const res = await request(app).get("/api/posts/feed");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/posts/by-path with viewer", async () => {
    const res = await request(app).get("/api/posts/by-path/lananh/schema-blog-medium");
    expect(res.status).toBe(200);
    expect(res.body.post.slug).toBe("schema-blog-medium");
  });

  it("POST /api/auth/login rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "demo@editorial.local",
      password: "wrong",
    });
    expect(res.status).toBe(401);
  });

  it("auth flow and interactions", async () => {
    const agent = request.agent(app);
    const login = await agent.post("/api/auth/login").send({
      email: "demo@editorial.local",
      password: "password123",
    });
    expect(login.status).toBe(200);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(IDS.userDemo);

    const clap = await agent.put(`/api/posts/${IDS.post1}/clap`).send({ count: 5 });
    expect(clap.status).toBe(200);

    const bm = await agent.post(`/api/posts/${IDS.post1}/bookmark`).send();
    expect(bm.status).toBe(200);

    await agent.post(`/api/posts/${IDS.post1}/bookmark`).send();

    const fol = await agent.post(`/api/users/${IDS.userLan}/follow`).send();
    expect(fol.status).toBe(200);

    const self = await agent.post(`/api/users/${IDS.userDemo}/follow`).send();
    expect(self.status).toBe(400);

    const c = await agent.post(`/api/posts/${IDS.post1}/comments`).send({
      body: "Integration comment",
      parentId: null,
    });
    expect(c.status).toBe(201);

    const userMinh = "10000000-0000-4000-8000-000000000003";
    const patch = await agent
      .patch(`/api/publications/stack-journal/members/${userMinh}`)
      .send({ role: "writer" });
    expect(patch.status).toBe(200);
    await agent.patch(`/api/publications/stack-journal/members/${userMinh}`).send({
      role: "editor",
    });

    const n = await agent.get("/api/me/notifications");
    expect(n.status).toBe(200);
  });

  it("POST /api/auth/register duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "demo@editorial.local",
      password: "password12345",
      displayName: "X",
      username: "otheruser99999",
    });
    expect(res.status).toBe(409);
  });

  it("POST /api/posts creates draft", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      email: "demo@editorial.local",
      password: "password123",
    });
    const res = await agent.post("/api/posts").send({
      title: "Integration draft",
      subtitle: "",
      body: "Hello world content for test.",
      excerpt: "",
      coverImageUrl: "",
      tagSlugs: ["typescript"],
      status: "draft",
      publicationId: null,
    });
    expect(res.status).toBe(201);
  });
});
