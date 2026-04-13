import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { mapPost, mapTag } from "../lib/mappers.js";
const router = Router();

router.get(
  "/tags",
  asyncHandler(async (_req, res) => {
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    res.json(tags.map(mapTag));
  }),
);

router.get(
  "/tags/:slug/posts",
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const tag = await prisma.tag.findUnique({ where: { slug } });
    if (!tag) {
      res.json([]);
      return;
    }
    const rows = await prisma.post.findMany({
      where: {
        deletedAt: null,
        status: "published",
        tags: { some: { tagId: tag.id } },
      },
      include: { tags: true },
      orderBy: { publishedAt: "desc" },
    });
    res.json(rows.map(mapPost));
  }),
);

export { router as tagsRouter };
