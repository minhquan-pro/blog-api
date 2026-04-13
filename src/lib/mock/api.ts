import type {
  Comment,
  Post,
  PostStatus,
  Publication,
  PublicationMember,
  PublicationRole,
  Tag,
  User,
  UserProfile,
} from "@/types/domain";
import {
  SEED_NOTIFICATIONS,
  SEED_PROFILES,
  SEED_PUBLICATIONS,
  SEED_PUBLICATION_MEMBERS,
  SEED_TAGS,
} from "@/mock-data/seed";
import {
  addComment,
  getAllPosts,
  getBookmarkSet,
  getClapForUser,
  getCommentsForPost,
  getPostById,
  getSeedUsers,
  getSessionUserId,
  isBookmarked,
  isFollowing,
  setClapForUser,
  toggleBookmark as storeToggleBookmark,
  toggleFollow as storeToggleFollow,
  upsertPost,
} from "@/lib/mock/mock-store";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Browser-safe UUID when crypto.randomUUID exists */
function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function apiDelay<T>(value: T, ms = 120): Promise<T> {
  await delay(ms);
  return value;
}

export function getTags(): Tag[] {
  return SEED_TAGS;
}

export function getTagBySlug(slug: string): Tag | undefined {
  return SEED_TAGS.find((t) => t.slug === slug);
}

export function getProfileByUsername(
  username: string,
): UserProfile | undefined {
  return SEED_PROFILES.find(
    (p) => p.username.toLowerCase() === username.toLowerCase(),
  );
}

export function getProfileByUserId(userId: string): UserProfile | undefined {
  return SEED_PROFILES.find((p) => p.userId === userId);
}

export function getUserByEmail(email: string): User | undefined {
  return getSeedUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
}

export function listPublications(): Publication[] {
  return SEED_PUBLICATIONS;
}

export function getPublicationBySlug(slug: string): Publication | undefined {
  return SEED_PUBLICATIONS.find((p) => p.slug === slug);
}

export function getPublicationMembers(
  publicationId: string,
): PublicationMember[] {
  return SEED_PUBLICATION_MEMBERS.filter((m) => m.publicationId === publicationId);
}

let memberOverrides: PublicationMember[] | null = null;

export function getMembersForPublicationSlug(
  slug: string,
): PublicationMember[] {
  const pub = getPublicationBySlug(slug);
  if (!pub) return [];
  if (memberOverrides) {
    return memberOverrides.filter((m) => m.publicationId === pub.id);
  }
  return getPublicationMembers(pub.id);
}

export function setMemberRole(
  publicationSlug: string,
  userId: string,
  role: PublicationRole,
): boolean {
  const pub = getPublicationBySlug(publicationSlug);
  if (!pub) return false;
  const base = memberOverrides ?? [...SEED_PUBLICATION_MEMBERS];
  const idx = base.findIndex(
    (m) => m.publicationId === pub.id && m.userId === userId,
  );
  if (idx < 0) return false;
  base[idx] = { ...base[idx], role };
  memberOverrides = base;
  return true;
}

export async function getFeed(): Promise<Post[]> {
  return apiDelay(
    getAllPosts()
      .filter(
        (p) =>
          p.status === "published" &&
          !p.deletedAt,
      )
      .sort((a, b) => {
        const ta = a.publishedAt ?? "";
        const tb = b.publishedAt ?? "";
        return tb.localeCompare(ta);
      }),
  );
}

export async function getPostByAuthorSlug(
  username: string,
  postSlug: string,
): Promise<Post | undefined> {
  const profile = getProfileByUsername(username);
  if (!profile) return apiDelay(undefined);
  const post = getAllPosts().find(
    (p) =>
      p.authorId === profile.userId &&
      p.slug === postSlug &&
      !p.deletedAt &&
      (p.status === "published" || p.status === "unlisted"),
  );
  return apiDelay(post);
}

/** Bài public, hoặc draft/archived nếu viewer là tác giả */
export async function getPostForReader(
  username: string,
  postSlug: string,
): Promise<Post | undefined> {
  const profile = getProfileByUsername(username);
  if (!profile) return apiDelay(undefined);
  const post = getAllPosts().find(
    (p) =>
      p.authorId === profile.userId &&
      p.slug === postSlug &&
      !p.deletedAt,
  );
  if (!post) return apiDelay(undefined);
  const uid = getSessionUserId();
  if (post.status === "draft" || post.status === "archived") {
    if (uid !== post.authorId) return apiDelay(undefined);
  }
  return apiDelay(post);
}

export async function getPostsForProfile(username: string): Promise<Post[]> {
  const profile = getProfileByUsername(username);
  if (!profile) return apiDelay([]);
  return apiDelay(
    getAllPosts()
      .filter(
        (p) =>
          p.authorId === profile.userId &&
          !p.deletedAt &&
          p.status === "published",
      )
      .sort((a, b) => {
        const ta = a.publishedAt ?? "";
        const tb = b.publishedAt ?? "";
        return tb.localeCompare(ta);
      }),
  );
}

export async function getPostsForPublicationSlug(
  publicationSlug: string,
): Promise<Post[]> {
  const pub = getPublicationBySlug(publicationSlug);
  if (!pub) return apiDelay([]);
  return apiDelay(
    getAllPosts().filter(
      (p) =>
        p.publicationId === pub.id &&
        p.status === "published" &&
        !p.deletedAt,
    ),
  );
}

export async function getPostsByTagSlug(tagSlug: string): Promise<Post[]> {
  const tag = getTagBySlug(tagSlug);
  if (!tag) return apiDelay([]);
  return apiDelay(
    getAllPosts().filter(
      (p) =>
        p.tagIds.includes(tag.id) &&
        p.status === "published" &&
        !p.deletedAt,
    ),
  );
}

export async function searchPosts(query: string): Promise<Post[]> {
  const q = query.trim().toLowerCase();
  if (!q) return apiDelay([]);
  return apiDelay(
    getAllPosts().filter((p) => {
      if (p.status !== "published" || p.deletedAt) return false;
      const hay = `${p.title} ${p.subtitle} ${p.excerpt} ${p.body}`.toLowerCase();
      return hay.includes(q);
    }),
  );
}

export async function getDraftsForCurrentUser(): Promise<Post[]> {
  const uid = getSessionUserId();
  if (!uid) return apiDelay([]);
  return apiDelay(
    getAllPosts().filter(
      (p) => p.authorId === uid && p.status === "draft" && !p.deletedAt,
    ),
  );
}

export async function getBookmarksList(): Promise<Post[]> {
  const ids = [...getBookmarkSet()];
  const map = new Map(getAllPosts().map((p) => [p.id, p]));
  const list = ids
    .map((idPost) => map.get(idPost))
    .filter((p): p is Post => !!p && !p.deletedAt);
  return apiDelay(list);
}

export async function getComments(postId: string): Promise<Comment[]> {
  return apiDelay(getCommentsForPost(postId));
}

export async function postComment(
  postId: string,
  parentId: string | null,
  body: string,
): Promise<Comment | undefined> {
  const uid = getSessionUserId();
  if (!uid) return apiDelay(undefined);
  const post = getPostById(postId);
  if (!post) return apiDelay(undefined);
  const comment: Comment = {
    id: newId(),
    postId,
    authorId: uid,
    parentId,
    body: body.trim(),
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  addComment(comment);
  return apiDelay(comment);
}

export async function followToggle(targetUserId: string): Promise<boolean> {
  const uid = getSessionUserId();
  if (!uid) return apiDelay(false);
  return apiDelay(storeToggleFollow(uid, targetUserId));
}

export function followingState(viewerId: string | null, authorId: string): boolean {
  if (!viewerId) return false;
  return isFollowing(viewerId, authorId);
}

export async function bookmarkToggle(postId: string): Promise<boolean> {
  const uid = getSessionUserId();
  if (!uid) return apiDelay(false);
  return apiDelay(storeToggleBookmark(postId));
}

export function bookmarkedState(postId: string): boolean {
  return isBookmarked(postId);
}

export async function clapSet(postId: string, count: number): Promise<Post | undefined> {
  const uid = getSessionUserId();
  if (!uid) return apiDelay(undefined);
  const prev = getClapForUser(uid, postId);
  const post = getPostById(postId);
  if (!post) return apiDelay(undefined);
  const delta = count - prev;
  post.clapCount = Math.max(0, post.clapCount + delta);
  setClapForUser({ userId: uid, postId, count });
  upsertPost({ ...post });
  return apiDelay(post);
}

export function clapCountForViewer(postId: string): number {
  const uid = getSessionUserId();
  if (!uid) return 0;
  return getClapForUser(uid, postId);
}

export async function loginMock(email: string, _password: string): Promise<User | undefined> {
  const user = getUserByEmail(email);
  return apiDelay(user);
}

export async function registerMock(
  email: string,
  _password: string,
  _displayName: string,
  _username: string,
): Promise<User> {
  const newUser: User = {
    id: newId(),
    email,
    createdAt: new Date().toISOString(),
  };
  return apiDelay(newUser);
}

export async function getNotificationsForCurrentUser() {
  const uid = getSessionUserId();
  if (!uid) return apiDelay([]);
  return apiDelay(
    SEED_NOTIFICATIONS.filter((n) => n.userId === uid).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
  );
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

function resolveTagIds(slugs: string[]): string[] {
  const tags = getTags();
  const ids: string[] = [];
  for (const s of slugs) {
    const t = tags.find((x) => x.slug === s);
    if (t) ids.push(t.id);
  }
  return ids;
}

function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function getEditablePost(postId: string): Promise<Post | undefined> {
  const uid = getSessionUserId();
  const p = getPostById(postId);
  if (!p || !uid || p.authorId !== uid) return apiDelay(undefined);
  return apiDelay(p);
}

export async function savePost(
  postId: string | undefined,
  authorId: string,
  payload: EditorPostPayload,
): Promise<Post> {
  const tagIds = resolveTagIds(payload.tagSlugs);
  const now = new Date().toISOString();
  const slugBase = payload.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "bai-viet";

  if (postId) {
    const existing = getPostById(postId);
    if (!existing || existing.authorId !== authorId) {
      throw new Error("Không tìm thấy bài hoặc không có quyền.");
    }
    const publishedAt =
      payload.status === "published"
        ? existing.publishedAt ?? now
        : null;
    const next: Post = {
      ...existing,
      title: payload.title,
      subtitle: payload.subtitle,
      body: payload.body,
      excerpt: payload.excerpt || payload.body.slice(0, 160),
      coverImageUrl: payload.coverImageUrl,
      tagIds,
      status: payload.status,
      publicationId: payload.publicationId,
      publishedAt,
      readingTimeMinutes: readingTime(payload.body),
      updatedAt: now,
    };
    upsertPost(next);
    return apiDelay(next);
  }

  const slug = `${slugBase}-${newId().slice(0, 8)}`;
  const publishedAt = payload.status === "published" ? now : null;
  const post: Post = {
    id: newId(),
    authorId,
    publicationId: payload.publicationId,
    title: payload.title,
    slug,
    subtitle: payload.subtitle,
    body: payload.body,
    excerpt: payload.excerpt || payload.body.slice(0, 160),
    coverImageUrl: payload.coverImageUrl,
    status: payload.status,
    publishedAt,
    readingTimeMinutes: readingTime(payload.body),
    clapCount: 0,
    responseCount: 0,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    tagIds,
  };
  upsertPost(post);
  return apiDelay(post);
}
