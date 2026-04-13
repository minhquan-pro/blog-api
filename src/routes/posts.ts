import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { mapComment, mapPost } from "../lib/mappers.js";
import { baseSlugFromTitle, readingTimeMinutes, uniquePostSlug } from "../lib/post-helpers.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import type { Prisma } from "../generated/prisma/client.js";

const router = Router();

const includeTags = { tags: true } as const;

type PostRow = Prisma.PostGetPayload<{ include: typeof includeTags }>;

async function postWithViewerContext(
  row: PostRow,
  viewerId: string | null,
): Promise<{
  post: ReturnType<typeof mapPost>;
  viewerClapCount: number;
  viewerHasBookmarked: boolean;
  viewerIsFollowingAuthor: boolean;
}> {
  const post = mapPost(row);
  let viewerClapCount = 0;
  let viewerHasBookmarked = false;
  let viewerIsFollowingAuthor = false;

  if (viewerId) {
    const clap = await prisma.postClap.findUnique({
      where: { userId_postId: { userId: viewerId, postId: post.id } },
    });
    viewerClapCount = clap?.count ?? 0;

    viewerHasBookmarked = !!(await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: viewerId, postId: post.id } },
    }));

    if (viewerId !== row.authorId) {
      viewerIsFollowingAuthor = !!(await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: { followerId: viewerId, followingId: row.authorId },
        },
      }));
    }
  }

  return {
    post,
    viewerClapCount,
    viewerHasBookmarked,
    viewerIsFollowingAuthor,
  };
}

router.get(
  "/posts/feed",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.post.findMany({
      where: { deletedAt: null, status: "published" },
      include: includeTags,
      orderBy: { publishedAt: "desc" },
    });
    res.json(rows.map(mapPost));
  }),
);

router.get(
  "/posts/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "")
      .trim()
      .toLowerCase();
    if (!q) {
      res.json([]);
      return;
    }
    const rows = await prisma.post.findMany({
      where: {
        deletedAt: null,
        status: "published",
        OR: [
          { title: { contains: q } },
          { subtitle: { contains: q } },
          { excerpt: { contains: q } },
          { body: { contains: q } },
        ],
      },
      include: includeTags,
      orderBy: { publishedAt: "desc" },
    });
    res.json(rows.map(mapPost));
  }),
);

router.get(
  "/posts/by-path/:username/:slug",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const username = req.params.username.toLowerCase();
    const { slug } = req.params;
    const viewerId = req.user?.userId ?? null;

    const profile = await prisma.userProfile.findUnique({ where: { username } });
    if (!profile) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const row = await prisma.post.findFirst({
      where: {
        authorId: profile.userId,
        slug,
        deletedAt: null,
      },
      include: includeTags,
    });

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const isOwner = viewerId === row.authorId;
    if ((row.status === "draft" || row.status === "archived") && !isOwner) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const payload = await postWithViewerContext(row, viewerId);
    res.json(payload);
  }),
);

const editorSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string(),
  body: z.string(),
  excerpt: z.string(),
  coverImageUrl: z.string(),
  tagSlugs: z.array(z.string()),
  status: z.enum(["draft", "published", "unlisted", "archived"]),
  publicationId: z.string().uuid().nullable(),
});

router.post(
  "/posts",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = editorSchema.parse(req.body);
    const authorId = req.user!.userId;

    if (body.publicationId) {
      const member = await prisma.publicationMember.findUnique({
        where: {
          publicationId_userId: {
            publicationId: body.publicationId,
            userId: authorId,
          },
        },
      });
      if (!member) {
        throw new HttpError(403, "Không thuộc publication này");
      }
    }

    const base = baseSlugFromTitle(body.title);
    const slug = uniquePostSlug(base);
    const now = new Date();
    const publishedAt = body.status === "published" ? now : null;

    const tagIds = await resolveTagSlugs(body.tagSlugs);

    const post = await prisma.$transaction(async (tx) => {
      const p = await tx.post.create({
        data: {
          authorId,
          publicationId: body.publicationId,
          title: body.title,
          slug,
          subtitle: body.subtitle,
          body: body.body,
          excerpt: body.excerpt || body.body.slice(0, 160),
          coverImageUrl: body.coverImageUrl,
          status: body.status,
          publishedAt,
          readingTimeMinutes: readingTimeMinutes(body.body),
          responseCount: 0,
        },
      });

      await tx.postTag.deleteMany({ where: { postId: p.id } });
      if (tagIds.length > 0) {
        await tx.postTag.createMany({
          data: tagIds.map((tagId) => ({ postId: p.id, tagId })),
        });
      }
      return tx.post.findUniqueOrThrow({
        where: { id: p.id },
        include: includeTags,
      });
    });

    res.status(201).json(mapPost(post));
  }),
);

router.get(
  "/posts/:postId/edit",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const authorId = req.user!.userId;

    const row = await prisma.post.findFirst({
      where: { id: postId, authorId, deletedAt: null },
      include: includeTags,
    });
    if (!row) {
      throw new HttpError(404, "Không tìm thấy bài hoặc không có quyền");
    }
    res.json(mapPost(row));
  }),
);

router.get(
  "/posts/:postId",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const viewerId = req.user?.userId ?? null;
    const row = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      include: includeTags,
    });
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const isOwner = viewerId === row.authorId;
    if ((row.status === "draft" || row.status === "archived") && !isOwner) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const payload = await postWithViewerContext(row, viewerId);
    res.json(payload);
  }),
);

router.patch(
  "/posts/:postId",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const authorId = req.user!.userId;
    const body = editorSchema.parse(req.body);

    const existing = await prisma.post.findFirst({
      where: { id: postId, authorId, deletedAt: null },
      include: includeTags,
    });
    if (!existing) {
      throw new HttpError(404, "Không tìm thấy bài hoặc không có quyền");
    }

    if (body.publicationId) {
      const member = await prisma.publicationMember.findUnique({
        where: {
          publicationId_userId: {
            publicationId: body.publicationId,
            userId: authorId,
          },
        },
      });
      if (!member) {
        throw new HttpError(403, "Không thuộc publication này");
      }
    }

    const now = new Date();
    const publishedAt =
      body.status === "published" ? (existing.publishedAt ?? now) : null;

    const tagIds = await resolveTagSlugs(body.tagSlugs);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: {
          title: body.title,
          subtitle: body.subtitle,
          body: body.body,
          excerpt: body.excerpt || body.body.slice(0, 160),
          coverImageUrl: body.coverImageUrl,
          status: body.status,
          publicationId: body.publicationId,
          publishedAt,
          readingTimeMinutes: readingTimeMinutes(body.body),
          updatedAt: now,
        },
      });
      await tx.postTag.deleteMany({ where: { postId } });
      if (tagIds.length > 0) {
        await tx.postTag.createMany({
          data: tagIds.map((tagId) => ({ postId, tagId })),
        });
      }

      return tx.post.findUniqueOrThrow({
        where: { id: postId },
        include: includeTags,
      });
    });

    res.json(mapPost(updated));
  }),
);

router.get(
  "/posts/:postId/comments",
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const rows = await prisma.comment.findMany({
      where: { postId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    res.json(rows.map(mapComment));
  }),
);

const commentSchema = z.object({
  body: z.string().min(1),
  parentId: z.string().uuid().nullable(),
});

router.post(
  "/posts/:postId/comments",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const authorId = req.user!.userId;
    const body = commentSchema.parse(req.body);

    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) {
      throw new HttpError(404, "Không tìm thấy bài");
    }

    const canView =
      post.status === "published" ||
      post.status === "unlisted" ||
      post.authorId === authorId;
    if (!canView) {
      throw new HttpError(403, "Không xem được bài này");
    }

    const c = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          postId,
          authorId,
          parentId: body.parentId,
          body: body.body.trim(),
        },
      });

      const count = await tx.comment.count({
        where: { postId, deletedAt: null },
      });
      await tx.post.update({
        where: { id: postId },
        data: { responseCount: count },
      });

      if (post.authorId !== authorId) {
        await tx.notification.create({
          data: {
            userId: post.authorId,
            type: "new_comment",
            payload: {
              postId,
              actorId: authorId,
              snippet: body.body.trim().slice(0, 80),
            },
          },
        });
      }

      return created;
    });

    res.status(201).json(mapComment(c));
  }),
);

const clapSchema = z.object({
  count: z.number().int().min(0).max(50),
});

router.put(
  "/posts/:postId/clap",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user!.userId;
    const { count } = clapSchema.parse(req.body);

    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post || post.status === "draft") {
      throw new HttpError(404, "Không tìm thấy bài");
    }

    const updatedPost = await prisma.$transaction(async (tx) => {
      if (count === 0) {
        await tx.postClap.deleteMany({ where: { postId, userId } });
      } else {
        await tx.postClap.upsert({
          where: { userId_postId: { userId, postId } },
          create: { userId, postId, count },
          update: { count },
        });
      }

      const agg = await tx.postClap.aggregate({
        where: { postId },
        _sum: { count: true },
      });
      await tx.post.update({
        where: { id: postId },
        data: { clapCount: agg._sum.count ?? 0 },
      });

      if (count > 0 && post.authorId !== userId) {
        await tx.notification.create({
          data: {
            userId: post.authorId,
            type: "new_clap",
            payload: { postId, actorId: userId },
          },
        });
      }

      return tx.post.findUniqueOrThrow({
        where: { id: postId },
        include: includeTags,
      });
    });

    res.json(mapPost(updatedPost));
  }),
);

router.post(
  "/posts/:postId/bookmark",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user!.userId;

    const post = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) {
      throw new HttpError(404, "Không tìm thấy bài");
    }

    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { userId_postId: { userId, postId } },
      });
      res.json({ bookmarked: false });
      return;
    }

    await prisma.bookmark.create({
      data: { userId, postId },
    });
    res.json({ bookmarked: true });
  }),
);

async function resolveTagSlugs(slugs: string[]): Promise<string[]> {
  const normalized = [...new Set(slugs.map((s) => s.trim().toLowerCase()).filter(Boolean))];
  if (normalized.length === 0) return [];

  const tags = await prisma.tag.findMany({
    where: { slug: { in: normalized } },
  });
  return tags.map((t) => t.id);
}

export { router as postsRouter };
