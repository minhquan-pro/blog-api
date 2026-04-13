import type { Comment, Post, PostClapState, User } from "@/types/domain";
import {
  SEED_COMMENTS,
  SEED_POSTS,
  SEED_USERS,
} from "@/mock-data/seed";

const LS_USER = "editorial_session_user_id";
const LS_FOLLOWS = "editorial_follows";
const LS_BOOKMARKS = "editorial_bookmarks";
const LS_CLAPS = "editorial_claps";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

let posts: Post[] = [...SEED_POSTS];
let comments: Comment[] = [...SEED_COMMENTS];

export function resetMockData(): void {
  posts = [...SEED_POSTS];
  comments = [...SEED_COMMENTS];
}

export function getAllPosts(): Post[] {
  return posts;
}

export function getPostById(id: string): Post | undefined {
  return posts.find((p) => p.id === id);
}

export function getCommentsForPost(postId: string): Comment[] {
  return comments.filter((c) => c.postId === postId && !c.deletedAt);
}

export function addComment(comment: Comment): void {
  comments = [...comments, comment];
  const post = posts.find((p) => p.id === comment.postId);
  if (post && !comment.parentId) {
    post.responseCount += 1;
  }
}

export function upsertPost(post: Post): void {
  const i = posts.findIndex((p) => p.id === post.id);
  if (i >= 0) posts = [...posts.slice(0, i), post, ...posts.slice(i + 1)];
  else posts = [post, ...posts];
}

export function getSessionUserId(): string | null {
  return localStorage.getItem(LS_USER);
}

export function setSessionUserId(userId: string | null): void {
  if (userId) localStorage.setItem(LS_USER, userId);
  else localStorage.removeItem(LS_USER);
}

export function getSeedUsers(): User[] {
  return SEED_USERS;
}

export function getFollowSet(): Set<string> {
  const arr = readJson<string[]>(LS_FOLLOWS, []);
  return new Set(arr);
}

export function setFollowSet(next: Set<string>): void {
  writeJson(LS_FOLLOWS, [...next]);
}

export function toggleFollow(followerId: string, followingId: string): boolean {
  if (followerId === followingId) return false;
  const set = getFollowSet();
  const key = `${followerId}:${followingId}`;
  const had = set.has(key);
  if (had) set.delete(key);
  else set.add(key);
  setFollowSet(set);
  return !had;
}

export function isFollowing(
  followerId: string,
  followingId: string,
): boolean {
  return getFollowSet().has(`${followerId}:${followingId}`);
}

export function getBookmarkSet(): Set<string> {
  const arr = readJson<string[]>(LS_BOOKMARKS, []);
  return new Set(arr);
}

export function setBookmarkSet(next: Set<string>): void {
  writeJson(LS_BOOKMARKS, [...next]);
}

export function toggleBookmark(postId: string): boolean {
  const set = getBookmarkSet();
  const had = set.has(postId);
  if (had) set.delete(postId);
  else set.add(postId);
  setBookmarkSet(set);
  return !had;
}

export function isBookmarked(postId: string): boolean {
  return getBookmarkSet().has(postId);
}

export function getClapMap(): Map<string, number> {
  const raw = readJson<Record<string, number>>(LS_CLAPS, {});
  return new Map(Object.entries(raw));
}

export function setClapForUser(state: PostClapState): void {
  const map = Object.fromEntries(getClapMap());
  map[`${state.userId}:${state.postId}`] = state.count;
  writeJson(LS_CLAPS, map);
}

export function getClapForUser(userId: string, postId: string): number {
  return getClapMap().get(`${userId}:${postId}`) ?? 0;
}
