import type {
  Comment,
  NotificationItem,
  Post,
  PostStatus,
  Publication,
  PublicationMember,
  PublicationRole,
  Tag,
  User,
  UserProfile,
} from "@/types/domain";

import { apiFetch } from "./client";

const apiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

/** Upload ảnh bìa (multipart). Trả về URL hiển thị (path tuyệt đối từ origin). */
export async function uploadCoverImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const url = `${apiBase}/api/uploads/cover`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const d = data as { error?: string };
    throw new Error(typeof d?.error === "string" ? d.error : res.statusText);
  }
  const d = data as { url?: string };
  if (!d?.url) throw new Error("Phản hồi upload không hợp lệ");
  return d.url;
}

export interface EditorPostPayload {
  title: string;
  subtitle: string;
  body: string;
  excerpt: string;
  coverImageUrl: string;
  tagSlugs: string[];
  status: PostStatus;
  publicationId: string | null;
}

export interface PostReadPayload {
  post: Post;
  viewerLiked: boolean;
  viewerHasBookmarked: boolean;
  viewerIsFollowingAuthor: boolean;
}

export interface ProfileWithViewer {
  profile: UserProfile;
  viewerIsFollowingAuthor: boolean;
}

export async function getTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>("/api/tags");
}

export async function getTagBySlug(slug: string): Promise<Tag | undefined> {
  const tags = await getTags();
  return tags.find((t) => t.slug === slug);
}

export async function getProfileByUserId(
  userId: string,
): Promise<UserProfile | undefined> {
  try {
    return await apiFetch<UserProfile>(
      `/api/users/id/${encodeURIComponent(userId)}/profile`,
    );
  } catch {
    return undefined;
  }
}

export async function getProfileByUsernameWithViewer(
  username: string,
): Promise<ProfileWithViewer | undefined> {
  try {
    return await apiFetch<ProfileWithViewer>(
      `/api/users/${encodeURIComponent(username)}/profile`,
    );
  } catch {
    return undefined;
  }
}

export async function getProfileByUsername(
  username: string,
): Promise<UserProfile | undefined> {
  const data = await getProfileByUsernameWithViewer(username);
  return data?.profile;
}

export async function listPublications(): Promise<Publication[]> {
  return apiFetch<Publication[]>("/api/publications");
}

export async function getPublicationBySlug(
  slug: string,
): Promise<Publication | undefined> {
  try {
    return await apiFetch<Publication>(
      `/api/publications/${encodeURIComponent(slug)}`,
    );
  } catch {
    return undefined;
  }
}

export interface MemberWithProfile extends PublicationMember {
  profile: UserProfile | null;
}

export async function getMembersForPublicationSlug(
  slug: string,
): Promise<MemberWithProfile[]> {
  const pub = await getPublicationBySlug(slug);
  if (!pub) return [];
  return apiFetch<MemberWithProfile[]>(
    `/api/publications/${encodeURIComponent(slug)}/members`,
  );
}

export async function setMemberRole(
  publicationSlug: string,
  userId: string,
  role: PublicationRole,
): Promise<boolean> {
  try {
    await apiFetch(
      `/api/publications/${encodeURIComponent(publicationSlug)}/members/${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      },
    );
    return true;
  } catch {
    return false;
  }
}

export async function getFeed(): Promise<Post[]> {
  return apiFetch<Post[]>("/api/posts/feed");
}

export async function getPostByAuthorSlug(
  username: string,
  postSlug: string,
): Promise<Post | undefined> {
  const data = await getPostForReader(username, postSlug);
  if (!data) return undefined;
  if (data.status !== "published" && data.status !== "unlisted")
    return undefined;
  return data;
}

export async function getPostForReader(
  username: string,
  postSlug: string,
): Promise<Post | undefined> {
  try {
    const data = await apiFetch<PostReadPayload>(
      `/api/posts/by-path/${encodeURIComponent(username)}/${encodeURIComponent(postSlug)}`,
    );
    return data.post;
  } catch {
    return undefined;
  }
}

export async function getPostByPathWithViewer(
  username: string,
  postSlug: string,
): Promise<PostReadPayload | undefined> {
  try {
    return await apiFetch<PostReadPayload>(
      `/api/posts/by-path/${encodeURIComponent(username)}/${encodeURIComponent(postSlug)}`,
    );
  } catch {
    return undefined;
  }
}

export async function getPostById(postId: string): Promise<Post | undefined> {
  try {
    const data = await apiFetch<PostReadPayload>(
      `/api/posts/${encodeURIComponent(postId)}`,
    );
    return data.post;
  } catch {
    return undefined;
  }
}

export async function getPostsForProfile(username: string): Promise<Post[]> {
  return apiFetch<Post[]>(`/api/users/${encodeURIComponent(username)}/posts`);
}

export async function getPostsForPublicationSlug(
  publicationSlug: string,
): Promise<Post[]> {
  return apiFetch<Post[]>(
    `/api/publications/${encodeURIComponent(publicationSlug)}/posts`,
  );
}

export async function getPostsByTagSlug(tagSlug: string): Promise<Post[]> {
  return apiFetch<Post[]>(`/api/tags/${encodeURIComponent(tagSlug)}/posts`);
}

export async function searchPosts(query: string): Promise<Post[]> {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({ q });
  return apiFetch<Post[]>(`/api/posts/search?${params.toString()}`);
}

export async function getDraftsForCurrentUser(): Promise<Post[]> {
  return apiFetch<Post[]>("/api/me/drafts");
}

export async function getBookmarksList(): Promise<Post[]> {
  return apiFetch<Post[]>("/api/me/bookmarks");
}

export async function getComments(postId: string): Promise<Comment[]> {
  return apiFetch<Comment[]>(
    `/api/posts/${encodeURIComponent(postId)}/comments`,
  );
}

export async function postComment(
  postId: string,
  parentId: string | null,
  body: string,
): Promise<Comment | undefined> {
  try {
    return await apiFetch<Comment>(
      `/api/posts/${encodeURIComponent(postId)}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ body, parentId }),
      },
    );
  } catch {
    return undefined;
  }
}

export async function followToggle(targetUserId: string): Promise<boolean> {
  const res = await apiFetch<{ following: boolean }>(
    `/api/users/${encodeURIComponent(targetUserId)}/follow`,
    { method: "POST" },
  );
  return res.following;
}

/** @deprecated Dùng viewer flags từ API (by-path / profile) thay cho mock */
export function followingState(
  viewerId: string | null,
  authorId: string,
): boolean {
  void viewerId;
  void authorId;
  return false;
}

export async function bookmarkToggle(postId: string): Promise<boolean> {
  const res = await apiFetch<{ bookmarked: boolean }>(
    `/api/posts/${encodeURIComponent(postId)}/bookmark`,
    { method: "POST" },
  );
  return res.bookmarked;
}

/** @deprecated Dùng viewerHasBookmarked từ getPostByPathWithViewer */
export function bookmarkedState(_postId: string): boolean {
  void _postId;
  return false;
}

export async function likeSet(
  postId: string,
  liked: boolean,
): Promise<Post | undefined> {
  try {
    return await apiFetch<Post>(
      `/api/posts/${encodeURIComponent(postId)}/like`,
      {
        method: "PUT",
        body: JSON.stringify({ liked }),
      },
    );
  } catch {
    return undefined;
  }
}

/** @deprecated Dùng viewerLiked từ getPostByPathWithViewer */
export function clapCountForViewer(_postId: string): number {
  void _postId;
  return 0;
}

export async function getEditablePost(
  postId: string,
): Promise<Post | undefined> {
  try {
    return await apiFetch<Post>(
      `/api/posts/${encodeURIComponent(postId)}/edit`,
    );
  } catch {
    return undefined;
  }
}

export async function savePost(
  postId: string | undefined,
  authorId: string,
  payload: EditorPostPayload,
): Promise<Post> {
  void authorId;
  if (!postId && payload.status === "draft") {
    throw new Error("Bản nháp mới chỉ lưu trên thiết bị.");
  }
  if (postId) {
    return apiFetch<Post>(`/api/posts/${encodeURIComponent(postId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }
  return apiFetch<Post>("/api/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getNotificationsForCurrentUser(): Promise<
  NotificationItem[]
> {
  return apiFetch<NotificationItem[]>("/api/me/notifications");
}

export async function loginApi(
  email: string,
  password: string,
): Promise<{ user: User; profile: UserProfile | null }> {
  return apiFetch<{ user: User; profile: UserProfile | null }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
}

export async function registerApi(
  email: string,
  password: string,
  displayName: string,
  username: string,
): Promise<{ user: User; profile: UserProfile | null }> {
  return apiFetch<{ user: User; profile: UserProfile | null }>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password, displayName, username }),
    },
  );
}

export async function logoutApi(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

export async function fetchAuthMe(): Promise<{
  user: User;
  profile: UserProfile | null;
} | null> {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
  const res = await fetch(`${base}/api/auth/me`, { credentials: "include" });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    const text = await res.text();
    const data = text ? (JSON.parse(text) as { error?: string }) : {};
    throw new Error(
      typeof data.error === "string" ? data.error : res.statusText,
    );
  }
  return (await res.json()) as {
    user: User;
    profile: UserProfile | null;
  };
}
