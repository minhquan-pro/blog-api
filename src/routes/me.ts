import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { mapNotification, mapPost } from "../lib/mappers.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/drafts",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const uid = req.user!.userId;
    const rows = await prisma.post.findMany({
      where: { authorId: uid, status: "draft", deletedAt: null },
      include: { tags: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json(rows.map(mapPost));
  }),
);

router.get(
  "/bookmarks",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const uid = req.user!.userId;
    const marks = await prisma.bookmark.findMany({
      where: { userId: uid },
      include: {
        post: { include: { tags: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const posts = marks.map((m) => m.post).filter((p) => p.deletedAt == null);
    res.json(posts.map(mapPost));
  }),
);

router.get(
  "/notifications",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const uid = req.user!.userId;
    const rows = await prisma.notification.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
    });
    res.json(rows.map(mapNotification));
  }),
);

export { router as meRouter };
