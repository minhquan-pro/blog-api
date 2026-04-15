import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PostCard } from "@/components/post/post-card";
import {
  getPostsByTagSlug,
  getProfileByUserId,
  getTagBySlug,
  getTags,
} from "@/lib/api";
import { tagsForPost } from "@/lib/post-helpers";
import type { Post, Tag, UserProfile } from "@/types/domain";
import { Skeleton } from "@/components/ui/skeleton";

export function TagPage() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tag, setTag] = useState<Tag | undefined>(undefined);
  const [authorById, setAuthorById] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let c = false;
    void (async () => {
      const [p, t, tagRow] = await Promise.all([
        getPostsByTagSlug(slug),
        getTags(),
        getTagBySlug(slug),
      ]);
      if (c) return;
      setPosts(p);
      setAllTags(t);
      setTag(tagRow);
      const ids = [...new Set(p.map((x) => x.authorId))];
      const pairs = await Promise.all(
        ids.map(async (id) => {
          const pr = await getProfileByUserId(id);
          return [id, pr] as const;
        }),
      );
      if (c) return;
      const map: Record<string, UserProfile> = {};
      for (const [id, pr] of pairs) {
        if (pr) map[id] = pr;
      }
      setAuthorById(map);
      setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [slug]);

  if (!loading && !tag) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Không có tag này</h1>
        <Link to="/" className="mt-4 inline-block text-accent-foreground underline">
          Về trang chủ
        </Link>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="h-12 w-1/2" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <h1 className="font-display text-3xl font-semibold">#{tag.name}</h1>
      <p className="mt-2 text-muted-foreground">Các bài gắn tag này.</p>
      <div className="mt-10 space-y-8">
        {loading ? (
          <Skeleton className="h-56 w-full rounded-xl" />
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">Chưa có bài.</p>
        ) : (
          posts.map((post) => {
            const author = authorById[post.authorId];
            if (!author) return null;
            return (
              <PostCard
                key={post.id}
                post={post}
                author={author}
                tags={tagsForPost(post, allTags)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
