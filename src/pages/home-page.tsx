import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PostCard } from "@/components/post/post-card";
import { getFeed, getProfileByUserId, getTags } from "@/lib/api";
import { tagsForPost } from "@/lib/post-helpers";
import type { Post, Tag, UserProfile } from "@/types/domain";
import { Skeleton } from "@/components/ui/skeleton";

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [authorById, setAuthorById] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [p, t] = await Promise.all([getFeed(), getTags()]);
      if (cancelled) return;
      setPosts(p);
      setAllTags(t);
      const ids = [...new Set(p.map((x) => x.authorId))];
      const pairs = await Promise.all(
        ids.map(async (id) => {
          const pr = await getProfileByUserId(id);
          return [id, pr] as const;
        }),
      );
      if (cancelled) return;
      const map: Record<string, UserProfile> = {};
      for (const [id, pr] of pairs) {
        if (pr) map[id] = pr;
      }
      setAuthorById(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sidebarTags = allTags.slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <header className="mb-12 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent-foreground">
          Tạp chí kỹ thuật
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Ý tưởng đọng lại, không bị cuốn theo thuật toán.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Giao diện demo theo schema blog — typography editorial, không gradient
          sến.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <div className="space-y-8">
          {loading ? (
            <>
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </>
          ) : (
            posts.map((post, i) => {
              const author = authorById[post.authorId];
              if (!author) return null;
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  author={author}
                  tags={tagsForPost(post, allTags)}
                  style={{
                    animationDelay: `${i * 70}ms`,
                  }}
                />
              );
            })
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <h2 className="font-display text-lg font-semibold">Chủ đề</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {sidebarTags.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/tag/${t.slug}`}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition hover:border-accent-foreground/30"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            <p>
              Đăng nhập bằng{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                demo@editorial.local
              </code>{" "}
              / mật khẩu <code className="rounded bg-muted px-1 py-0.5 text-xs">password123</code>{" "}
              để thử thích bài, bookmark và bình luận.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
