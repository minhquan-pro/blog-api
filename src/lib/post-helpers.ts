import type { Post, Tag } from "@/types/domain";

export function tagsForPost(post: Post, allTags: Tag[]): Tag[] {
  return post.tagIds
    .map((id) => allTags.find((t) => t.id === id))
    .filter((t): t is Tag => !!t);
}
