import { HttpError } from "../lib/http-error.js";
import { mapPost, mapProfile } from "../lib/mappers.js";
import { prisma } from "../lib/prisma.js";

export async function getProfileByUserId(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });
  if (!profile) {
    throw new HttpError(404, "Không tìm thấy");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isLocked: true },
  });
  if (user?.isLocked) {
    throw new HttpError(404, "Không tìm thấy");
  }
  return mapProfile(profile);
}

export async function getProfileByUsername(username: string, viewerId: string | null) {
  const profile = await prisma.userProfile.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (!profile) {
    throw new HttpError(404, "Không tìm thấy");
  }
  const authorUser = await prisma.user.findUnique({
    where: { id: profile.userId },
    select: { isLocked: true },
  });
  if (authorUser?.isLocked) {
    throw new HttpError(404, "Không tìm thấy");
  }
  let viewerIsFollowingAuthor = false;
  if (viewerId && viewerId !== profile.userId) {
    viewerIsFollowingAuthor = !!(await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerId,
          followingId: profile.userId,
        },
      },
    }));
  }
  return {
    profile: mapProfile(profile),
    viewerIsFollowingAuthor,
  };
}

export async function listPublishedPostsByUsername(username: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (!profile) {
    return [];
  }
  const authorUser = await prisma.user.findUnique({
    where: { id: profile.userId },
    select: { isLocked: true },
  });
  if (authorUser?.isLocked) {
    return [];
  }
  const rows = await prisma.post.findMany({
    where: {
      authorId: profile.userId,
      deletedAt: null,
      status: "published",
    },
    include: { tags: true },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(mapPost);
}

export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new HttpError(400, "Không thể theo dõi chính mình");
  }

  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) {
    throw new HttpError(404, "Không tìm thấy người dùng");
  }
  if (target.isLocked) {
    throw new HttpError(403, "Không thể theo dõi tài khoản đã bị khóa");
  }

  const existing = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  if (existing) {
    await prisma.userFollow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return { following: false as const };
  }

  await prisma.userFollow.create({
    data: { followerId, followingId },
  });

  if (followerId !== followingId) {
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: "new_follow",
        payload: { actorId: followerId },
      },
    });
  }

  return { following: true as const };
}
