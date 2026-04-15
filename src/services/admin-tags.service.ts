import { z } from "zod";

import { HttpError } from "../lib/http-error.js";
import { mapTag } from "../lib/mappers.js";
import { baseSlugFromTitle } from "../lib/post-helpers.js";
import { prisma } from "../lib/prisma.js";

function normalizeTagSlug(name: string, explicit?: string): string {
  if (explicit?.trim()) {
    return baseSlugFromTitle(explicit.trim());
  }
  return baseSlugFromTitle(name.trim());
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).optional(),
});

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).optional(),
});

export async function listAdminTags() {
  const rows = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapTag);
}

export async function createAdminTag(body: unknown) {
  const parsed = createSchema.parse(body);
  const slug = normalizeTagSlug(parsed.name, parsed.slug);
  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) {
    throw new HttpError(409, "Slug đã tồn tại");
  }
  const t = await prisma.tag.create({
    data: { name: parsed.name.trim(), slug },
  });
  return mapTag(t);
}

export async function updateAdminTag(tagId: string, body: unknown) {
  const parsed = patchSchema.parse(body);
  if (Object.keys(parsed).length === 0) {
    throw new HttpError(400, "Không có trường cập nhật");
  }
  const current = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!current) {
    throw new HttpError(404, "Không tìm thấy tag");
  }
  const name = parsed.name?.trim() ?? current.name;
  const slug =
    parsed.slug !== undefined
      ? normalizeTagSlug(name, parsed.slug)
      : parsed.name !== undefined
        ? normalizeTagSlug(parsed.name, undefined)
        : current.slug;

  if (slug !== current.slug) {
    const taken = await prisma.tag.findUnique({ where: { slug } });
    if (taken && taken.id !== tagId) {
      throw new HttpError(409, "Slug đã tồn tại");
    }
  }

  const t = await prisma.tag.update({
    where: { id: tagId },
    data: { name, slug },
  });
  return mapTag(t);
}

export async function deleteAdminTag(tagId: string) {
  const count = await prisma.postTag.count({ where: { tagId } });
  if (count > 0) {
    throw new HttpError(
      409,
      `Không thể xóa tag đang gắn với ${count} bài viết. Gỡ tag khỏi các bài trước.`,
    );
  }
  await prisma.tag.delete({ where: { id: tagId } });
}
