import { z } from "zod";

import type { PublicationMember as PublicationMemberDto } from "../lib/domain.js";
import { HttpError } from "../lib/http-error.js";
import { mapProfile, mapPublication } from "../lib/mappers.js";
import { baseSlugFromTitle } from "../lib/post-helpers.js";
import { prisma } from "../lib/prisma.js";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().max(10000).optional(),
  avatarUrl: z.string().max(2048).optional(),
});

const patchSchema = createSchema.partial();

const memberBodySchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "editor", "writer"]),
});

const memberPatchSchema = z.object({
  role: z.enum(["owner", "editor", "writer"]),
});

function slugFromName(name: string, explicit?: string): string {
  if (explicit?.trim()) {
    return baseSlugFromTitle(explicit.trim());
  }
  return baseSlugFromTitle(name.trim());
}

export async function listAdminPublications() {
  const rows = await prisma.publication.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapPublication);
}

export async function getAdminPublication(id: string) {
  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub) {
    throw new HttpError(404, "Không tìm thấy publication");
  }
  return mapPublication(pub);
}

export async function createAdminPublication(body: unknown) {
  const parsed = createSchema.parse(body);
  const slug = slugFromName(parsed.name, parsed.slug);
  const existing = await prisma.publication.findUnique({ where: { slug } });
  if (existing) {
    throw new HttpError(409, "Slug đã tồn tại");
  }
  const pub = await prisma.publication.create({
    data: {
      name: parsed.name.trim(),
      slug,
      description: parsed.description ?? "",
      avatarUrl: parsed.avatarUrl ?? "",
    },
  });
  return mapPublication(pub);
}

export async function updateAdminPublication(id: string, body: unknown) {
  const parsed = patchSchema.parse(body);
  if (Object.keys(parsed).length === 0) {
    throw new HttpError(400, "Không có trường cập nhật");
  }
  const current = await prisma.publication.findUnique({ where: { id } });
  if (!current) {
    throw new HttpError(404, "Không tìm thấy publication");
  }
  const name = parsed.name?.trim() ?? current.name;
  const slug =
    parsed.slug !== undefined
      ? slugFromName(name, parsed.slug)
      : parsed.name !== undefined
        ? slugFromName(parsed.name, undefined)
        : current.slug;

  if (slug !== current.slug) {
    const taken = await prisma.publication.findUnique({ where: { slug } });
    if (taken && taken.id !== id) {
      throw new HttpError(409, "Slug đã tồn tại");
    }
  }

  const pub = await prisma.publication.update({
    where: { id },
    data: {
      ...(parsed.name !== undefined ? { name: name } : {}),
      ...(parsed.slug !== undefined || parsed.name !== undefined ? { slug } : {}),
      ...(parsed.description !== undefined ? { description: parsed.description } : {}),
      ...(parsed.avatarUrl !== undefined ? { avatarUrl: parsed.avatarUrl } : {}),
    },
  });
  return mapPublication(pub);
}

export async function deleteAdminPublication(id: string) {
  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub) {
    throw new HttpError(404, "Không tìm thấy publication");
  }
  await prisma.publication.delete({ where: { id } });
}

export async function listAdminPublicationMembers(publicationId: string) {
  const pub = await prisma.publication.findUnique({ where: { id: publicationId } });
  if (!pub) {
    throw new HttpError(404, "Không tìm thấy publication");
  }
  const members = await prisma.publicationMember.findMany({
    where: { publicationId },
    include: { user: { include: { profile: true } } },
    orderBy: { createdAt: "asc" },
  });
  return members.map((m) => ({
    publicationId: m.publicationId,
    userId: m.userId,
    role: m.role,
    createdAt: m.createdAt.toISOString(),
    profile: m.user.profile ? mapProfile(m.user.profile) : null,
  }));
}

export async function addAdminPublicationMember(
  publicationId: string,
  body: unknown,
): Promise<PublicationMemberDto> {
  const parsed = memberBodySchema.parse(body);

  const pub = await prisma.publication.findUnique({ where: { id: publicationId } });
  if (!pub) {
    throw new HttpError(404, "Không tìm thấy publication");
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
  if (!user) {
    throw new HttpError(404, "Không tìm thấy người dùng");
  }

  const existing = await prisma.publicationMember.findUnique({
    where: {
      publicationId_userId: { publicationId, userId: parsed.userId },
    },
  });
  if (existing) {
    throw new HttpError(409, "Người dùng đã là thành viên");
  }

  const created = await prisma.publicationMember.create({
    data: {
      publicationId,
      userId: parsed.userId,
      role: parsed.role,
    },
  });

  return {
    publicationId: created.publicationId,
    userId: created.userId,
    role: created.role,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function patchAdminPublicationMember(
  publicationId: string,
  userId: string,
  body: unknown,
): Promise<PublicationMemberDto> {
  const parsed = memberPatchSchema.parse(body);

  const pub = await prisma.publication.findUnique({ where: { id: publicationId } });
  if (!pub) {
    throw new HttpError(404, "Không tìm thấy publication");
  }

  const target = await prisma.publicationMember.findUnique({
    where: { publicationId_userId: { publicationId, userId } },
  });
  if (!target) {
    throw new HttpError(404, "Không tìm thấy thành viên");
  }

  if (target.role === "owner" && parsed.role !== "owner") {
    const owners = await prisma.publicationMember.count({
      where: { publicationId, role: "owner" },
    });
    if (owners <= 1) {
      throw new HttpError(400, "Phải còn ít nhất một owner");
    }
  }

  const updated = await prisma.publicationMember.update({
    where: { publicationId_userId: { publicationId, userId } },
    data: { role: parsed.role },
  });

  return {
    publicationId: updated.publicationId,
    userId: updated.userId,
    role: updated.role,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function removeAdminPublicationMember(
  publicationId: string,
  userId: string,
): Promise<void> {
  const pub = await prisma.publication.findUnique({ where: { id: publicationId } });
  if (!pub) {
    throw new HttpError(404, "Không tìm thấy publication");
  }

  const target = await prisma.publicationMember.findUnique({
    where: { publicationId_userId: { publicationId, userId } },
  });
  if (!target) {
    throw new HttpError(404, "Không tìm thấy thành viên");
  }

  if (target.role === "owner") {
    const owners = await prisma.publicationMember.count({
      where: { publicationId, role: "owner" },
    });
    if (owners <= 1) {
      throw new HttpError(400, "Không thể xóa owner duy nhất");
    }
  }

  await prisma.publicationMember.delete({
    where: { publicationId_userId: { publicationId, userId } },
  });
}
