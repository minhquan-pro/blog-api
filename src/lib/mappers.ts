import type { Prisma } from "../generated/prisma/client.js";
import type { Comment, NotificationItem, Post, Publication, Tag, User, UserProfile } from "./domain.js";

type PostWithTags = Prisma.PostGetPayload<{ include: { tags: true } }>;

export function toIso(d: Date | null | undefined): string | null {
  if (d == null) return null;
  return d.toISOString();
}

export function mapUser(u: {
  id: string;
  email: string;
  isAdmin: boolean;
  isLocked: boolean;
  createdAt: Date;
}): User {
  return {
    id: u.id,
    email: u.email,
    isAdmin: u.isAdmin,
    isLocked: u.isLocked,
    createdAt: u.createdAt.toISOString(),
  };
}

export function mapProfile(p: {
  userId: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
}): UserProfile {
  return {
    userId: p.userId,
    displayName: p.displayName,
    username: p.username,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
  };
}

export function mapTag(t: { id: string; name: string; slug: string }): Tag {
  return { id: t.id, name: t.name, slug: t.slug };
}

export function mapPost(row: PostWithTags): Post {
  return {
    id: row.id,
    authorId: row.authorId,
    publicationId: row.publicationId,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    body: row.body,
    excerpt: row.excerpt,
    coverImageUrl: row.coverImageUrl,
    status: row.status,
    publishedAt: toIso(row.publishedAt),
    readingTimeMinutes: row.readingTimeMinutes,
    likeCount: row.clapCount,
    responseCount: row.responseCount,
    deletedAt: toIso(row.deletedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    tagIds: row.tags.map((pt) => pt.tagId),
  };
}

export function mapComment(c: {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Comment {
  return {
    id: c.id,
    postId: c.postId,
    authorId: c.authorId,
    parentId: c.parentId,
    body: c.body,
    deletedAt: toIso(c.deletedAt),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function mapPublication(pub: {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string;
  createdAt: Date;
}): Publication {
  return {
    id: pub.id,
    name: pub.name,
    slug: pub.slug,
    description: pub.description,
    avatarUrl: pub.avatarUrl,
    createdAt: pub.createdAt.toISOString(),
  };
}

export function mapNotification(n: {
  id: string;
  userId: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}): NotificationItem {
  const payload =
    typeof n.payload === "object" && n.payload !== null
      ? (n.payload as Record<string, string>)
      : {};
  return {
    id: n.id,
    userId: n.userId,
    type: n.type as NotificationItem["type"],
    payload,
    readAt: toIso(n.readAt),
    createdAt: n.createdAt.toISOString(),
  };
}
