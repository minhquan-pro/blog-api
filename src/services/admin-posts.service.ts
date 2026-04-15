import type { PostStatus, Prisma } from "../generated/prisma/client.js";
import { HttpError } from "../lib/http-error.js";
import { mapPost } from "../lib/mappers.js";
import { prisma } from "../lib/prisma.js";

const includeTags = { tags: true } as const;
type PostWithTags = Prisma.PostGetPayload<{ include: typeof includeTags }>;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface AdminPostListItem {
  post: ReturnType<typeof mapPost>;
  authorUsername: string;
  authorDisplayName: string;
  authorEmail: string;
}

export interface AdminPostListResult {
  items: AdminPostListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listPostsWithAuthors(params?: {
  status?: PostStatus;
  includeDeleted?: boolean;
  authorId?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminPostListResult> {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params?.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const includeDeleted = params?.includeDeleted === true;

  const where: Prisma.PostWhereInput = {};

  if (!includeDeleted) {
    where.deletedAt = null;
  }

  if (params?.status) {
    where.status = params.status;
  }

  if (params?.authorId) {
    where.authorId = params.authorId;
  }

  const [total, rows] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: {
        tags: true,
        author: { include: { profile: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items = rows.map((row) => {
    const post = mapPost(row as PostWithTags);
    const profile = row.author.profile;
    return {
      post,
      authorUsername: profile?.username ?? "",
      authorDisplayName: profile?.displayName ?? "",
      authorEmail: row.author.email,
    };
  });

  return { items, total, page, pageSize };
}

export async function softDeleteAdminPost(
  postId: string,
): Promise<ReturnType<typeof mapPost>> {
  const row = await prisma.post.findFirst({ where: { id: postId } });
  if (!row) {
    throw new HttpError(404, "Không tìm thấy bài");
  }
  if (row.deletedAt) {
    throw new HttpError(400, "Bài đã bị xóa mềm");
  }
  const updated = await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
    include: includeTags,
  });
  return mapPost(updated as PostWithTags);
}

export async function restoreAdminPost(
  postId: string,
): Promise<ReturnType<typeof mapPost>> {
  const row = await prisma.post.findFirst({ where: { id: postId } });
  if (!row) {
    throw new HttpError(404, "Không tìm thấy bài");
  }
  if (!row.deletedAt) {
    throw new HttpError(400, "Bài chưa bị xóa mềm");
  }
  const updated = await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: null },
    include: includeTags,
  });
  return mapPost(updated as PostWithTags);
}

export async function removePostTagAdmin(
  postId: string,
  tagId: string,
): Promise<void> {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
  });
  if (!post) {
    throw new HttpError(404, "Không tìm thấy bài");
  }
  const deleted = await prisma.postTag.deleteMany({
    where: { postId, tagId },
  });
  if (deleted.count === 0) {
    throw new HttpError(404, "Bài không gắn tag này");
  }
}
