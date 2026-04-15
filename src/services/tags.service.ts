import { mapPost, mapTag } from "../lib/mappers.js";
import { prisma } from "../lib/prisma.js";

export async function listTags() {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return tags.map(mapTag);
}

export async function listPostsByTagSlug(slug: string) {
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) {
    return [];
  }
  const rows = await prisma.post.findMany({
    where: {
      deletedAt: null,
      status: "published",
      author: { isLocked: false },
      tags: { some: { tagId: tag.id } },
    },
    include: { tags: true },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(mapPost);
}
