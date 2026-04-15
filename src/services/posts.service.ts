import type { Prisma } from "../generated/prisma/client.js";
import { isUserAdmin } from "../lib/admin-helpers.js";
import { HttpError } from "../lib/http-error.js";
import { mapComment, mapPost } from "../lib/mappers.js";
import { baseSlugFromTitle, readingTimeMinutes, uniquePostSlug } from "../lib/post-helpers.js";
import { prisma } from "../lib/prisma.js";

export const includeTags = { tags: true } as const;
type PostRow = Prisma.PostGetPayload<{ include: typeof includeTags }>;

export interface EditorInput {
  title: string;
  subtitle: string;
  body: string;
  excerpt: string;
  coverImageUrl: string;
  tagSlugs: string[];
  status: "draft" | "published" | "unlisted" | "archived";
  publicationId: string | null;
}

function editorHasMeaningfulContent(input: EditorInput): boolean {
  return (
    input.title.trim().length > 0 ||
    input.subtitle.trim().length > 0 ||
    input.body.trim().length > 0 ||
    input.excerpt.trim().length > 0
  );
}

export interface CommentInput {
  body: string;
  parentId: string | null;
}

export interface PostReadPayload {
  post: ReturnType<typeof mapPost>;
  viewerLiked: boolean;
  viewerHasBookmarked: boolean;
  viewerIsFollowingAuthor: boolean;
}

async function postWithViewerContext(
  row: PostRow,
  viewerId: string | null,
): Promise<PostReadPayload> {
  const post = mapPost(row);
  let viewerLiked = false;
  let viewerHasBookmarked = false;
  let viewerIsFollowingAuthor = false;

  if (viewerId) {
    const clap = await prisma.postClap.findUnique({
      where: { userId_postId: { userId: viewerId, postId: post.id } },
    });
    viewerLiked = (clap?.count ?? 0) > 0;

    viewerHasBookmarked = !!(await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: viewerId, postId: post.id } },
    }));

    if (viewerId !== row.authorId) {
      viewerIsFollowingAuthor = !!(await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: { followerId: viewerId, followingId: row.authorId },
        },
      }));
    }
  }

  return {
    post,
    viewerLiked,
    viewerHasBookmarked,
    viewerIsFollowingAuthor,
  };
}

const authorUnlocked = { author: { isLocked: false } } as const;

export async function listFeed() {
  const rows = await prisma.post.findMany({
    where: { deletedAt: null, status: "published", ...authorUnlocked },
    include: includeTags,
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(mapPost);
}

export async function searchPosts(qRaw: string) {
  const q = qRaw.trim().toLowerCase();
  if (!q) return [];
  const rows = await prisma.post.findMany({
    where: {
      deletedAt: null,
      status: "published",
      ...authorUnlocked,
      OR: [
        { title: { contains: q } },
        { subtitle: { contains: q } },
        { excerpt: { contains: q } },
        { body: { contains: q } },
      ],
    },
    include: includeTags,
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(mapPost);
}

export async function getPostByPath(
  username: string,
  slug: string,
  viewerId: string | null,
): Promise<PostReadPayload | { notFound: true } | { forbidden: true }> {
  const profile = await prisma.userProfile.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (!profile) {
    return { notFound: true };
  }

  const authorUser = await prisma.user.findUnique({
    where: { id: profile.userId },
    select: { isLocked: true },
  });
  if (authorUser?.isLocked) {
    return { notFound: true };
  }

  const row = await prisma.post.findFirst({
    where: {
      authorId: profile.userId,
      slug,
      deletedAt: null,
    },
    include: includeTags,
  });

  if (!row) {
    return { notFound: true };
  }

  const isOwner = viewerId === row.authorId;
  if ((row.status === "draft" || row.status === "archived") && !isOwner) {
    return { forbidden: true };
  }

  return postWithViewerContext(row, viewerId);
}

export async function createPost(authorId: string, input: EditorInput) {
  if (!editorHasMeaningfulContent(input)) {
    throw new HttpError(
      400,
      "Bài viết cần có ít nhất tiêu đề, nội dung, phụ đề hoặc tóm tắt.",
    );
  }
  if (input.publicationId) {
    const member = await prisma.publicationMember.findUnique({
      where: {
        publicationId_userId: {
          publicationId: input.publicationId,
          userId: authorId,
        },
      },
    });
    if (!member) {
      throw new HttpError(403, "Không thuộc publication này");
    }
  }

  const base = baseSlugFromTitle(input.title);
  const slug = uniquePostSlug(base);
  const now = new Date();
  const publishedAt = input.status === "published" ? now : null;

  const tagIds = await resolveTagSlugs(input.tagSlugs);

  const post = await prisma.$transaction(async (tx) => {
    const p = await tx.post.create({
      data: {
        authorId,
        publicationId: input.publicationId,
        title: input.title,
        slug,
        subtitle: input.subtitle,
        body: input.body,
        excerpt: input.excerpt || input.body.slice(0, 160),
        coverImageUrl: input.coverImageUrl,
        status: input.status,
        publishedAt,
        readingTimeMinutes: readingTimeMinutes(input.body),
        responseCount: 0,
      },
    });

    await tx.postTag.deleteMany({ where: { postId: p.id } });
    if (tagIds.length > 0) {
      await tx.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId: p.id, tagId })),
      });
    }
    return tx.post.findUniqueOrThrow({
      where: { id: p.id },
      include: includeTags,
    });
  });

  return mapPost(post);
}

export async function getPostForEdit(postId: string, userId: string) {
  const admin = await isUserAdmin(userId);

  const row = await prisma.post.findFirst({
    where: admin
      ? { id: postId, deletedAt: null }
      : { id: postId, authorId: userId, deletedAt: null },
    include: includeTags,
  });
  if (!row) {
    throw new HttpError(404, "Không tìm thấy bài hoặc không có quyền");
  }
  return mapPost(row);
}

export async function getPostById(
  postId: string,
  viewerId: string | null,
): Promise<PostReadPayload | { notFound: true } | { forbidden: true }> {
  const row = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: includeTags,
  });
  if (!row) {
    return { notFound: true };
  }
  const author = await prisma.user.findUnique({
    where: { id: row.authorId },
    select: { isLocked: true },
  });
  if (author?.isLocked) {
    return { notFound: true };
  }
  const isOwner = viewerId === row.authorId;
  if ((row.status === "draft" || row.status === "archived") && !isOwner) {
    return { forbidden: true };
  }
  return postWithViewerContext(row, viewerId);
}

export async function updatePost(postId: string, userId: string, input: EditorInput) {
  if (!editorHasMeaningfulContent(input)) {
    throw new HttpError(
      400,
      "Bài viết cần có ít nhất tiêu đề, nội dung, phụ đề hoặc tóm tắt.",
    );
  }
  const admin = await isUserAdmin(userId);

  const existing = await prisma.post.findFirst({
    where: admin
      ? { id: postId, deletedAt: null }
      : { id: postId, authorId: userId, deletedAt: null },
    include: includeTags,
  });
  if (!existing) {
    throw new HttpError(404, "Không tìm thấy bài hoặc không có quyền");
  }

  const authorIdForPublication = existing.authorId;
  if (input.publicationId) {
    const member = await prisma.publicationMember.findUnique({
      where: {
        publicationId_userId: {
          publicationId: input.publicationId,
          userId: authorIdForPublication,
        },
      },
    });
    if (!member) {
      throw new HttpError(403, "Không thuộc publication này");
    }
  }

  const now = new Date();
  const publishedAt =
    input.status === "published" ? (existing.publishedAt ?? now) : null;

  const tagIds = await resolveTagSlugs(input.tagSlugs);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: postId },
      data: {
        title: input.title,
        subtitle: input.subtitle,
        body: input.body,
        excerpt: input.excerpt || input.body.slice(0, 160),
        coverImageUrl: input.coverImageUrl,
        status: input.status,
        publicationId: input.publicationId,
        publishedAt,
        readingTimeMinutes: readingTimeMinutes(input.body),
        updatedAt: now,
      },
    });
    await tx.postTag.deleteMany({ where: { postId } });
    if (tagIds.length > 0) {
      await tx.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId, tagId })),
      });
    }

    return tx.post.findUniqueOrThrow({
      where: { id: postId },
      include: includeTags,
    });
  });

  return mapPost(updated);
}

export type QuickPostStatus = "archived" | "published" | "unlisted";

/** Đổi trạng thái nhanh (không gửi full editor). Không áp dụng cho bản nháp. */
export async function updatePostStatusOnly(
  postId: string,
  userId: string,
  status: QuickPostStatus,
) {
  const admin = await isUserAdmin(userId);

  const existing = await prisma.post.findFirst({
    where: admin
      ? { id: postId, deletedAt: null }
      : { id: postId, authorId: userId, deletedAt: null },
    include: includeTags,
  });
  if (!existing) {
    throw new HttpError(404, "Không tìm thấy bài hoặc không có quyền");
  }
  if (existing.status === "draft") {
    throw new HttpError(400, "Chỉnh sửa bản nháp trong trang viết bài.");
  }

  const now = new Date();
  let publishedAt = existing.publishedAt;
  if (status === "published" && !publishedAt) {
    publishedAt = now;
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      status,
      publishedAt,
      updatedAt: now,
    },
    include: includeTags,
  });

  return mapPost(updated);
}

export async function softDeletePostByAuthor(postId: string, userId: string) {
  const admin = await isUserAdmin(userId);

  const row = await prisma.post.findFirst({
    where: admin
      ? { id: postId, deletedAt: null }
      : { id: postId, authorId: userId, deletedAt: null },
    include: includeTags,
  });
  if (!row) {
    throw new HttpError(404, "Không tìm thấy bài hoặc không có quyền");
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
    include: includeTags,
  });

  return mapPost(updated);
}

export async function listComments(postId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: { author: { select: { isLocked: true } } },
  });
  if (!post || post.author.isLocked) {
    throw new HttpError(404, "Không tìm thấy bài");
  }
  const rows = await prisma.comment.findMany({
    where: { postId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(mapComment);
}

export async function createComment(postId: string, authorId: string, input: CommentInput) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: { author: { select: { isLocked: true } } },
  });
  if (!post) {
    throw new HttpError(404, "Không tìm thấy bài");
  }
  if (post.author.isLocked) {
    throw new HttpError(404, "Không tìm thấy bài");
  }

  const canView =
    post.status === "published" ||
    post.status === "unlisted" ||
    post.authorId === authorId;
  if (!canView) {
    throw new HttpError(403, "Không xem được bài này");
  }

  const c = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: {
        postId,
        authorId,
        parentId: input.parentId,
        body: input.body.trim(),
      },
    });

    const count = await tx.comment.count({
      where: { postId, deletedAt: null },
    });
    await tx.post.update({
      where: { id: postId },
      data: { responseCount: count },
    });

    if (post.authorId !== authorId) {
      await tx.notification.create({
        data: {
          userId: post.authorId,
          type: "new_comment",
          payload: {
            postId,
            actorId: authorId,
            snippet: input.body.trim().slice(0, 80),
          },
        },
      });
    }

    return created;
  });

  return mapComment(c);
}

/** Like nhị phân: mỗi user tối đa 1 (lưu trong post_claps.count ∈ {0,1}). */
export async function setLike(postId: string, userId: string, liked: boolean) {
  return applyPostLike(postId, userId, liked);
}

/** @deprecated Dùng setLike; giới hạn count 0|1. */
export async function setClap(postId: string, userId: string, count: number) {
  if (count < 0 || count > 1) {
    throw new HttpError(400, "Chỉ hỗ trợ 0 hoặc 1 lượt thích");
  }
  return applyPostLike(postId, userId, count === 1);
}

async function applyPostLike(postId: string, userId: string, liked: boolean) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: { author: { select: { isLocked: true } } },
  });
  if (!post || post.status === "draft" || post.author.isLocked) {
    throw new HttpError(404, "Không tìm thấy bài");
  }

  const prev = await prisma.postClap.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  const hadLike = (prev?.count ?? 0) > 0;

  const updatedPost = await prisma.$transaction(async (tx) => {
    if (!liked) {
      await tx.postClap.deleteMany({ where: { postId, userId } });
    } else {
      await tx.postClap.upsert({
        where: { userId_postId: { userId, postId } },
        create: { userId, postId, count: 1 },
        update: { count: 1 },
      });
    }

    const agg = await tx.postClap.aggregate({
      where: { postId },
      _sum: { count: true },
    });
    await tx.post.update({
      where: { id: postId },
      data: { clapCount: agg._sum.count ?? 0 },
    });

    if (liked && !hadLike && post.authorId !== userId) {
      await tx.notification.create({
        data: {
          userId: post.authorId,
          type: "new_like",
          payload: { postId, actorId: userId },
        },
      });
    }

    return tx.post.findUniqueOrThrow({
      where: { id: postId },
      include: includeTags,
    });
  });

  return mapPost(updatedPost);
}

export async function toggleBookmark(postId: string, userId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: { author: { select: { isLocked: true } } },
  });
  if (!post || post.author.isLocked) {
    throw new HttpError(404, "Không tìm thấy bài");
  }

  const existing = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.bookmark.delete({
      where: { userId_postId: { userId, postId } },
    });
    return { bookmarked: false as const };
  }

  await prisma.bookmark.create({
    data: { userId, postId },
  });
  return { bookmarked: true as const };
}

async function resolveTagSlugs(slugs: string[]): Promise<string[]> {
  const normalized = [...new Set(slugs.map((s) => s.trim().toLowerCase()).filter(Boolean))];
  if (normalized.length === 0) return [];

  const tags = await prisma.tag.findMany({
    where: { slug: { in: normalized } },
  });
  return tags.map((t) => t.id);
}
