import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { mapPost, mapProfile, mapPublication } from "../lib/mappers.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import type { PublicationMember as PublicationMemberDto } from "../lib/domain.js";

const router = Router();

router.get(
  "/publications",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.publication.findMany({ orderBy: { name: "asc" } });
    res.json(rows.map(mapPublication));
  }),
);

router.get(
  "/publications/:slug",
  asyncHandler(async (req, res) => {
    const pub = await prisma.publication.findUnique({ where: { slug: req.params.slug } });
    if (!pub) {
      throw new HttpError(404, "Không tìm thấy publication");
    }
    res.json(mapPublication(pub));
  }),
);

router.get(
  "/publications/:slug/posts",
  asyncHandler(async (req, res) => {
    const pub = await prisma.publication.findUnique({ where: { slug: req.params.slug } });
    if (!pub) {
      res.json([]);
      return;
    }
    const rows = await prisma.post.findMany({
      where: {
        publicationId: pub.id,
        deletedAt: null,
        status: "published",
      },
      include: { tags: true },
      orderBy: { publishedAt: "desc" },
    });
    res.json(rows.map(mapPost));
  }),
);

router.get(
  "/publications/:slug/members",
  asyncHandler(async (req, res) => {
    const pub = await prisma.publication.findUnique({ where: { slug: req.params.slug } });
    if (!pub) {
      throw new HttpError(404, "Không tìm thấy publication");
    }
    const members = await prisma.publicationMember.findMany({
      where: { publicationId: pub.id },
      include: { user: { include: { profile: true } } },
    });
    res.json(
      members.map((m) => ({
        publicationId: m.publicationId,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
        profile: m.user.profile ? mapProfile(m.user.profile) : null,
      })),
    );
  }),
);

const patchMemberSchema = z.object({
  role: z.enum(["owner", "editor", "writer"]),
});

router.patch(
  "/publications/:slug/members/:userId",
  optionalAuth,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { slug, userId } = req.params;
    const body = patchMemberSchema.parse(req.body);
    const viewerId = req.user!.userId;

    const pub = await prisma.publication.findUnique({ where: { slug } });
    if (!pub) {
      throw new HttpError(404, "Không tìm thấy publication");
    }

    const viewerMember = await prisma.publicationMember.findUnique({
      where: { publicationId_userId: { publicationId: pub.id, userId: viewerId } },
    });
    if (!viewerMember || (viewerMember.role !== "owner" && viewerMember.role !== "editor")) {
      throw new HttpError(403, "Không có quyền");
    }

    const target = await prisma.publicationMember.findUnique({
      where: { publicationId_userId: { publicationId: pub.id, userId } },
    });
    if (!target) {
      throw new HttpError(404, "Không tìm thấy thành viên");
    }

    if (target.role === "owner" && body.role !== "owner") {
      const owners = await prisma.publicationMember.count({
        where: { publicationId: pub.id, role: "owner" },
      });
      if (owners <= 1) {
        throw new HttpError(400, "Phải còn ít nhất một owner");
      }
    }

    const updated = await prisma.publicationMember.update({
      where: { publicationId_userId: { publicationId: pub.id, userId } },
      data: { role: body.role },
    });

    const out: PublicationMemberDto = {
      publicationId: updated.publicationId,
      userId: updated.userId,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
    };
    res.json(out);
  }),
);

export { router as publicationsRouter };
