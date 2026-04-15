import type { Prisma } from "../generated/prisma/client.js";
import { HttpError } from "../lib/http-error.js";
import { mapComment } from "../lib/mappers.js";
import { prisma } from "../lib/prisma.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface AdminCommentRow {
  comment: ReturnType<typeof mapComment>;
  authorUsername: string;
  authorDisplayName: string;
}

export interface AdminCommentListResult {
  items: AdminCommentRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listAdminComments(params: {
  postId?: string;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<AdminCommentListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const includeDeleted = params.includeDeleted === true;

  const where: Prisma.CommentWhereInput = {};
  if (params.postId) {
    where.postId = params.postId;
  }
  if (!includeDeleted) {
    where.deletedAt = null;
  }

  const [total, rows] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      include: { author: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((row) => ({
      comment: mapComment(row),
      authorUsername: row.author.profile?.username ?? "",
      authorDisplayName: row.author.profile?.displayName ?? "",
    })),
    total,
    page,
    pageSize,
  };
}

export async function moderateAdminComment(
  commentId: string,
  deleted: boolean,
): Promise<ReturnType<typeof mapComment>> {
  const c = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!c) {
    throw new HttpError(404, "Không tìm thấy bình luận");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.comment.update({
      where: { id: commentId },
      data: { deletedAt: deleted ? new Date() : null },
    });

    const count = await tx.comment.count({
      where: { postId: row.postId, deletedAt: null },
    });
    await tx.post.update({
      where: { id: row.postId },
      data: { responseCount: count },
    });

    return row;
  });

  return mapComment(updated);
}
