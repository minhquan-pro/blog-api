import { z } from "zod";

import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function listAdminPostClaps(params: {
  userId?: string;
  postId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const where = {
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.postId ? { postId: params.postId } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.postClap.count({ where }),
    prisma.postClap.findMany({
      where,
      orderBy: [{ postId: "asc" }, { userId: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((r) => ({
      userId: r.userId,
      postId: r.postId,
      count: r.count,
    })),
    total,
    page,
    pageSize,
  };
}

export async function deleteAdminPostClap(userId: string, postId: string): Promise<void> {
  const deleted = await prisma.postClap.deleteMany({
    where: { userId, postId },
  });
  if (deleted.count === 0) {
    throw new HttpError(404, "Không tìm thấy clap");
  }

  const sum = await prisma.postClap.aggregate({
    where: { postId },
    _sum: { count: true },
  });
  const total = sum._sum.count ?? 0;
  await prisma.post.update({
    where: { id: postId },
    data: { clapCount: total },
  });
}

export async function listAdminBookmarks(params: {
  userId?: string;
  postId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const where = {
    ...(params.userId ? { userId: params.userId } : {}),
    ...(params.postId ? { postId: params.postId } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.bookmark.count({ where }),
    prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((r) => ({
      userId: r.userId,
      postId: r.postId,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}

export async function deleteAdminBookmark(userId: string, postId: string): Promise<void> {
  const deleted = await prisma.bookmark.deleteMany({
    where: { userId, postId },
  });
  if (deleted.count === 0) {
    throw new HttpError(404, "Không tìm thấy bookmark");
  }
}

export async function listAdminUserFollows(params: {
  followerId?: string;
  followingId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const where = {
    ...(params.followerId ? { followerId: params.followerId } : {}),
    ...(params.followingId ? { followingId: params.followingId } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.userFollow.count({ where }),
    prisma.userFollow.findMany({
      where,
      orderBy: [{ followerId: "asc" }, { followingId: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((r) => ({
      followerId: r.followerId,
      followingId: r.followingId,
    })),
    total,
    page,
    pageSize,
  };
}

export async function deleteAdminUserFollow(
  followerId: string,
  followingId: string,
): Promise<void> {
  const deleted = await prisma.userFollow.deleteMany({
    where: { followerId, followingId },
  });
  if (deleted.count === 0) {
    throw new HttpError(404, "Không tìm thấy follow");
  }
}

const patchNotifSchema = z.object({
  readAt: z.union([z.string(), z.null()]),
});

export async function listAdminNotifications(params: {
  userId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const where = params.userId ? { userId: params.userId } : {};

  const [total, rows] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      payload: n.payload as Record<string, string>,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}

export async function deleteAdminNotification(id: string): Promise<void> {
  const deleted = await prisma.notification.deleteMany({ where: { id } });
  if (deleted.count === 0) {
    throw new HttpError(404, "Không tìm thấy thông báo");
  }
}

export async function patchAdminNotification(id: string, body: unknown) {
  const parsed = patchNotifSchema.parse(body);
  const readAt = parsed.readAt === null ? null : new Date(parsed.readAt);

  try {
    const n = await prisma.notification.update({
      where: { id },
      data: { readAt },
    });
    return {
      id: n.id,
      userId: n.userId,
      type: n.type,
      payload: n.payload as Record<string, string>,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    };
  } catch {
    throw new HttpError(404, "Không tìm thấy thông báo");
  }
}
