export type PostStatus = "draft" | "published" | "unlisted" | "archived";

export type PublicationRole = "owner" | "editor" | "writer";

export type NotificationType =
  | "new_follow"
  | "new_comment"
  | "new_clap"
  | "new_like"
  | "mention";

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  authorId: string;
  publicationId: string | null;
  title: string;
  slug: string;
  subtitle: string;
  body: string;
  excerpt: string;
  coverImageUrl: string;
  status: PostStatus;
  publishedAt: string | null;
  readingTimeMinutes: number;
  likeCount: number;
  responseCount: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tagIds: string[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string;
  createdAt: string;
}

export interface PublicationMember {
  publicationId: string;
  userId: string;
  role: PublicationRole;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, string>;
  readAt: string | null;
  createdAt: string;
}

export interface PostClapState {
  userId: string;
  postId: string;
  count: number;
}
