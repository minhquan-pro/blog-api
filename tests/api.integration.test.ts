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
    const { prisma } = await import("../src/lib/prisma.js");
    await prisma.user.update({
      where: { id: IDS.userDemo },
      data: { isAdmin: true },
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

  it("GET /api/admin/posts returns list for admin session", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      email: "demo@editorial.local",
      password: "password123",
    });
    const res = await agent.get("/api/admin/posts");
    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0]).toMatchObject({
      post: expect.objectContaining({ id: expect.any(String) }),
      authorUsername: expect.any(String),
      authorEmail: expect.any(String),
    });
  });

  it("GET /api/admin/dashboard returns metrics for admin session", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      email: "demo@editorial.local",
      password: "password123",
    });
    const res = await agent.get("/api/admin/dashboard?days=7");
    expect(res.status).toBe(200);
    expect(res.body.days).toBe(7);
    expect(res.body.totals).toMatchObject({
      users: expect.any(Number),
      posts: expect.any(Number),
      postsPublished: expect.any(Number),
    });
    expect(res.body.postsByStatus).toMatchObject({
      draft: expect.any(Number),
      published: expect.any(Number),
      unlisted: expect.any(Number),
      archived: expect.any(Number),
    });
    expect(Array.isArray(res.body.timeSeries)).toBe(true);
    expect(res.body.timeSeries.length).toBe(7);
    expect(Array.isArray(res.body.topPosts)).toBe(true);
    expect(Array.isArray(res.body.topTags)).toBe(true);
  });

  it("admin namespace: users, tags, publications, comments, engagement", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({
      email: "demo@editorial.local",
      password: "password123",
    });

    const users = await agent.get("/api/admin/users");
    expect(users.status).toBe(200);
    expect(users.body.items.length).toBeGreaterThanOrEqual(1);

    const tags = await agent.get("/api/admin/tags");
    expect(tags.status).toBe(200);
    expect(Array.isArray(tags.body)).toBe(true);

    const pubs = await agent.get("/api/admin/publications");
    expect(pubs.status).toBe(200);
    expect(Array.isArray(pubs.body)).toBe(true);

    const comments = await agent.get("/api/admin/comments");
    expect(comments.status).toBe(200);
    expect(comments.body.items).toBeDefined();

    const claps = await agent.get("/api/admin/post-claps");
    expect(claps.status).toBe(200);
    expect(claps.body.items).toBeDefined();

    const bookmarks = await agent.get("/api/admin/bookmarks");
    expect(bookmarks.status).toBe(200);

    const follows = await agent.get("/api/admin/user-follows");
    expect(follows.status).toBe(200);

    const notifs = await agent.get("/api/admin/notifications");
    expect(notifs.status).toBe(200);
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

    const patchProfile = await agent.patch("/api/me/profile").send({
      displayName: "Demo User",
      bio: "Bio from integration test",
    });
    expect(patchProfile.status).toBe(200);
    expect(patchProfile.body.displayName).toBe("Demo User");
    expect(patchProfile.body.bio).toBe("Bio from integration test");

    const like = await agent.put(`/api/posts/${IDS.post1}/like`).send({ liked: true });
    expect(like.status).toBe(200);

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

    const arch = await agent.patch(`/api/posts/${IDS.post1}/status`).send({ status: "archived" });
    expect(arch.status).toBe(200);
    expect(arch.body.status).toBe("archived");
    const pub = await agent.patch(`/api/posts/${IDS.post1}/status`).send({ status: "published" });
    expect(pub.status).toBe(200);
    expect(pub.body.status).toBe("published");
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

  it("POST /api/posts rejects new draft (local-only drafts)", async () => {
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
    expect(res.status).toBe(400);
  });
});
