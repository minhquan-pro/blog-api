import type { Prisma } from "../generated/prisma/client.js";
import { HttpError } from "../lib/http-error.js";
import { mapNotification, mapPost, mapProfile } from "../lib/mappers.js";
import { prisma } from "../lib/prisma.js";

type PostWithTags = Prisma.PostGetPayload<{ include: { tags: true } }>;

const bookmarkPostInclude = {
  tags: true,
  author: { select: { isLocked: true } },
} as const;

export async function listMyPosts(userId: string) {
  const rows = await prisma.post.findMany({
    where: { authorId: userId, deletedAt: null },
    include: { tags: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapPost);
}

export async function listMyDrafts(userId: string) {
  const rows = await prisma.post.findMany({
    where: { authorId: userId, status: "draft", deletedAt: null },
    include: { tags: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapPost);
}

export async function listMyBookmarks(userId: string) {
  const marks = await prisma.bookmark.findMany({
    where: { userId },
    include: {
      post: { include: bookmarkPostInclude },
    },
    orderBy: { createdAt: "desc" },
  });
  const posts = marks
    .map((m) => m.post)
    .filter((p) => p.deletedAt == null && !p.author.isLocked);
  return posts.map((p) => {
    const { author: _a, ...row } = p;
    return mapPost(row as PostWithTags);
  });
}

export async function listMyNotifications(userId: string) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapNotification);
}

export interface UpdateMyProfileInput {
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
}

export async function updateMyProfile(userId: string, input: UpdateMyProfileInput) {
  const current = await prisma.userProfile.findUnique({ where: { userId } });
  if (!current) {
    throw new HttpError(404, "Không tìm thấy hồ sơ");
  }

  const nextUsername =
    input.username !== undefined ? input.username.toLowerCase().trim() : undefined;
  if (nextUsername !== undefined && nextUsername !== current.username) {
    const taken = await prisma.userProfile.findUnique({
      where: { username: nextUsername },
    });
    if (taken) {
      throw new HttpError(409, "Username đã được dùng");
    }
  }

  const data: Prisma.UserProfileUpdateInput = {};
  if (input.displayName !== undefined) {
    data.displayName = input.displayName.trim();
  }
  if (nextUsername !== undefined) {
    data.username = nextUsername;
  }
  if (input.bio !== undefined) {
    data.bio = input.bio.trim();
  }
  if (input.avatarUrl !== undefined) {
    data.avatarUrl = input.avatarUrl.trim();
  }

  const updated = await prisma.userProfile.update({
    where: { userId },
    data,
  });
  return mapProfile(updated);
}
