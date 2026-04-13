import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { mapPost, mapProfile } from "../lib/mappers.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/users/id/:userId/profile",
  asyncHandler(async (req, res) => {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.params.userId },
    });
    if (!profile) {
      throw new HttpError(404, "Không tìm thấy");
    }
    res.json(mapProfile(profile));
  }),
);

router.get(
  "/users/:username/profile",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const username = req.params.username.toLowerCase();
    const profile = await prisma.userProfile.findUnique({
      where: { username },
    });
    if (!profile) {
      throw new HttpError(404, "Không tìm thấy");
    }
    const viewerId = req.user?.userId ?? null;
    let viewerIsFollowingAuthor = false;
    if (viewerId && viewerId !== profile.userId) {
      viewerIsFollowingAuthor = !!(await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: profile.userId,
          },
        },
      }));
    }
    res.json({
      profile: mapProfile(profile),
      viewerIsFollowingAuthor,
    });
  }),
);

router.get(
  "/users/:username/posts",
  asyncHandler(async (req, res) => {
    const username = req.params.username.toLowerCase();
    const profile = await prisma.userProfile.findUnique({
      where: { username },
    });
    if (!profile) {
      res.json([]);
      return;
    }
    const rows = await prisma.post.findMany({
      where: {
        authorId: profile.userId,
        deletedAt: null,
        status: "published",
      },
      include: { tags: true },
      orderBy: { publishedAt: "desc" },
    });
    res.json(rows.map(mapPost));
  }),
);

router.post(
  "/users/:userId/follow",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const followerId = req.user!.userId;
    const { userId: followingId } = req.params;

    if (followerId === followingId) {
      throw new HttpError(400, "Không thể theo dõi chính mình");
    }

    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) {
      throw new HttpError(404, "Không tìm thấy người dùng");
    }

    const existing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      await prisma.userFollow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });
      res.json({ following: false });
      return;
    }

    await prisma.userFollow.create({
      data: { followerId, followingId },
    });

    if (followerId !== followingId) {
      await prisma.notification.create({
        data: {
          userId: followingId,
          type: "new_follow",
          payload: { actorId: followerId },
        },
      });
    }

    res.json({ following: true });
  }),
);

export { router as usersRouter };
