import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { PostCard } from "@/components/post/post-card";
import { useAuth } from "@/contexts/auth-context";
import {
  getBookmarksList,
  getDraftsForCurrentUser,
  getProfileByUserId,
  getTags,
} from "@/lib/api";
import { listLocalDrafts } from "@/lib/local-drafts";
import { tagsForPost } from "@/lib/post-helpers";
import type { Post, Tag, UserProfile } from "@/types/domain";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export function LibraryPage() {
  const { user, profile, isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [authorById, setAuthorById] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  const localDrafts = user ? listLocalDrafts(user.id) : [];

  useEffect(() => {
    if (!isAuthenticated) return;
    let c = false;
    void (async () => {
      const [bm, dr, t] = await Promise.all([
        getBookmarksList(),
        getDraftsForCurrentUser(),
        getTags(),
      ]);
      if (c) return;
      setBookmarks(bm);
      setDrafts(dr);
      setAllTags(t);
      const ids = [...new Set(bm.map((x) => x.authorId))];
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
  }, [isAuthenticated]);

  if (!isAuthenticated || !user || !profile) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <h1 className="font-display text-3xl font-semibold">Thư viện</h1>
      <p className="mt-2 text-muted-foreground">
        Xin chào, {profile.displayName}. Quản lý bài đã lưu và bản nháp.
      </p>

      <Tabs defaultValue="bookmarks" className="mt-10">
        <TabsList>
          <TabsTrigger value="bookmarks">Đã lưu</TabsTrigger>
          <TabsTrigger value="drafts">Bản nháp</TabsTrigger>
        </TabsList>
        <TabsContent value="bookmarks" className="mt-6 space-y-8">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : bookmarks.length === 0 ? (
            <p className="text-muted-foreground">
              Chưa lưu bài nào — nhấn &quot;Lưu&quot; trên trang bài viết.
            </p>
          ) : (
            bookmarks.map((post) => {
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
        </TabsContent>
        <TabsContent value="drafts" className="mt-6 space-y-6">
          {loading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : drafts.length === 0 && localDrafts.length === 0 ? (
            <p className="text-muted-foreground">
              Chưa có bản nháp.{" "}
              <Link to="/write" className="text-accent-foreground underline">
                Viết bài mới
              </Link>
            </p>
          ) : (
            <>
              {localDrafts.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Trên thiết bị
                  </p>
                  {localDrafts.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-col gap-2 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <h2 className="font-display text-lg font-semibold">
                          {d.title.trim() || "Không tiêu đề"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Cập nhật{" "}
                          {new Date(d.updatedAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <Link
                        to={`/write?localDraft=${encodeURIComponent(d.id)}`}
                        className={cn(
                          buttonVariants(),
                          "inline-flex h-9 items-center justify-center",
                        )}
                      >
                        Tiếp tục viết
                      </Link>
                    </div>
                  ))}
                </div>
              ) : null}
              {drafts.length > 0 ? (
                <div className="space-y-3">
                  {localDrafts.length > 0 ? (
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Trên tài khoản
                    </p>
                  ) : null}
                  {drafts.map((post) => (
                    <div
                      key={post.id}
                      className="flex flex-col gap-2 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <h2 className="font-display text-lg font-semibold">
                          {post.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Cập nhật{" "}
                          {new Date(post.updatedAt).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <Link
                        to={`/write/${post.id}`}
                        className={cn(
                          buttonVariants(),
                          "inline-flex h-9 items-center justify-center",
                        )}
                      >
                        Tiếp tục viết
                      </Link>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
