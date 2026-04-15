import { z } from "zod";

import type { PublicationMember as PublicationMemberDto } from "../lib/domain.js";
import { HttpError } from "../lib/http-error.js";
import { mapPost, mapProfile, mapPublication } from "../lib/mappers.js";
import { prisma } from "../lib/prisma.js";

const patchMemberSchema = z.object({
  role: z.enum(["owner", "editor", "writer"]),
});

export async function listPublications() {
  const rows = await prisma.publication.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapPublication);
}

export async function getPublicationBySlug(slug: string) {
  const pub = await prisma.publication.findUnique({ where: { slug } });
  if (!pub) {
    throw new HttpError(404, "Không tìm thấy publication");
  }
  return mapPublication(pub);
}

export async function listPublicationPosts(slug: string) {
  const pub = await prisma.publication.findUnique({ where: { slug } });
  if (!pub) {
    return [];
  }
  const rows = await prisma.post.findMany({
    where: {
      publicationId: pub.id,
      deletedAt: null,
      status: "published",
      author: { isLocked: false },
    },
    include: { tags: true },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(mapPost);
}

export async function listPublicationMembers(slug: string) {
  const pub = await prisma.publication.findUnique({ where: { slug } });
  if (!pub) {
    throw new HttpError(404, "Không tìm thấy publication");
  }
  const members = await prisma.publicationMember.findMany({
    where: { publicationId: pub.id },
    include: { user: { include: { profile: true } } },
  });
  return members.map((m) => ({
    publicationId: m.publicationId,
    userId: m.userId,
    role: m.role,
    createdAt: m.createdAt.toISOString(),
    profile: m.user.profile ? mapProfile(m.user.profile) : null,
  }));
}

export async function patchPublicationMember(
  slug: string,
  userId: string,
  body: unknown,
  viewerId: string,
): Promise<PublicationMemberDto> {
  const parsed = patchMemberSchema.parse(body);

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

  if (target.role === "owner" && parsed.role !== "owner") {
    const owners = await prisma.publicationMember.count({
      where: { publicationId: pub.id, role: "owner" },
    });
    if (owners <= 1) {
      throw new HttpError(400, "Phải còn ít nhất một owner");
    }
  }

  const updated = await prisma.publicationMember.update({
    where: { publicationId_userId: { publicationId: pub.id, userId } },
    data: { role: parsed.role },
  });

  return {
    publicationId: updated.publicationId,
    userId: updated.userId,
    role: updated.role,
    createdAt: updated.createdAt.toISOString(),
  };
}
