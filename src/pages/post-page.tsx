import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bookmark, Heart } from "lucide-react";
import { toast } from "sonner";

import { ArticleBody } from "@/components/post/article-body";
import { CommentThread } from "@/components/comment/comment-thread";
import { useAuth } from "@/contexts/auth-context";
import {
  bookmarkToggle,
  likeSet,
  followToggle,
  getComments,
  getPostById,
  getPostByPathWithViewer,
  getProfileByUserId,
  getTags,
  postComment,
} from "@/lib/api";
import { tagsForPost } from "@/lib/post-helpers";
import type { Comment, Post, Tag, UserProfile } from "@/types/domain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function PostPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [likedLocal, setLikedLocal] = useState(false);
  const [following, setFollowing] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const load = useCallback(async () => {
    if (!username || !slug) return;
    const pathData = await getPostByPathWithViewer(username, slug);
    if (!pathData) {
      setPost(null);
      return;
    }
    setPost(pathData.post);
    setLikedLocal(pathData.viewerLiked);
    setBookmarked(pathData.viewerHasBookmarked);
    setFollowing(pathData.viewerIsFollowingAuthor);

    const [c, tags] = await Promise.all([
      getComments(pathData.post.id),
      getTags(),
    ]);
    setComments(c);
    setAllTags(tags);
  }, [username, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const [authorProfile, setAuthorProfile] = useState<UserProfile | undefined>();

  useEffect(() => {
    if (!post) {
      setAuthorProfile(undefined);
      return;
    }
    let c = false;
    void getProfileByUserId(post.authorId).then((p) => {
      if (!c) setAuthorProfile(p);
    });
    return () => {
      c = true;
    };
  }, [post]);

  const [profileMap, setProfileMap] = useState<Map<string, UserProfile>>(
    () => new Map(),
  );

  useEffect(() => {
    if (!post) return;
    const ids = new Set([post.authorId, ...comments.map((x) => x.authorId)]);
    let cancelled = false;
    void Promise.all(
      [...ids].map(async (id) => {
        const pr = await getProfileByUserId(id);
        return [id, pr] as const;
      }),
    ).then((pairs) => {
      if (cancelled) return;
      const next = new Map<string, UserProfile>();
      for (const [id, pr] of pairs) {
        if (pr) next.set(id, pr);
      }
      setProfileMap(next);
    });
    return () => {
      cancelled = true;
    };
  }, [post, comments]);

  const onFollow = async () => {
    if (!user) {
      toast.info("Đăng nhập để theo dõi.");
      return;
    }
    if (!post) return;
    const now = await followToggle(post.authorId);
    setFollowing(now);
    toast.message(now ? "Đã theo dõi" : "Đã bỏ theo dõi");
  };

  const onBookmark = async () => {
    if (!user || !post) {
      toast.info("Đăng nhập để lưu bài.");
      return;
    }
    const now = await bookmarkToggle(post.id);
    setBookmarked(now);
    toast.message(now ? "Đã lưu vào thư viện" : "Đã gỡ khỏi thư viện");
  };

  const onLikeToggle = async () => {
    if (!user || !post) {
      toast.info("Đăng nhập để thích bài.");
      return;
    }
    const next = !likedLocal;
    setLikedLocal(next);
    const updated = await likeSet(post.id, next);
    if (updated) setPost(updated);
    else setLikedLocal(!next);
  };

  const onComment = async (parentId: string | null, body: string) => {
    if (!post) return;
    const c = await postComment(post.id, parentId, body);
    if (c) {
      setComments((prev) => [...prev, c]);
      const fresh = await getPostById(post.id);
      if (fresh) setPost(fresh);
      toast.success("Đã gửi bình luận");
    } else toast.error("Không gửi được bình luận");
  };

  if (post === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  const cardAuthor = post ? authorProfile ?? profileMap.get(post.authorId) : undefined;

  if (post && !cardAuthor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (!post || !cardAuthor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Không tìm thấy bài</h1>
        <p className="mt-2 text-muted-foreground">
          Bài có thể đã gỡ hoặc bạn chưa đăng nhập để xem bản nháp.
        </p>
        <Link to="/" className={cn(buttonVariants(), "mt-6 inline-flex")}>
          Về trang chủ
        </Link>
      </div>
    );
  }

  const date =
    post.publishedAt &&
    new Date(post.publishedAt).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const tags = tagsForPost(post, allTags);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      {post.coverImageUrl ? (
        <div className="mb-10 overflow-hidden rounded-2xl border border-border/60 bg-muted">
          <img
            src={post.coverImageUrl}
            alt=""
            loading="lazy"
            className="max-h-[420px] w-full object-cover"
          />
        </div>
      ) : null}

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link to={`/u/${cardAuthor.username}`} className="flex items-center gap-2">
            <Avatar className="size-10">
              <AvatarImage src={cardAuthor.avatarUrl} alt="" loading="lazy" />
              <AvatarFallback>{cardAuthor.displayName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{cardAuthor.displayName}</span>
          </Link>
          {date ? (
            <>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt!}>{date}</time>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <span>{post.readingTimeMinutes} phút đọc</span>
          {post.status === "draft" ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800 dark:text-amber-200">
              Bản nháp
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          {post.title}
        </h1>
        {post.subtitle ? (
          <p className="text-xl text-muted-foreground">{post.subtitle}</p>
        ) : null}
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-border py-4">
        <div className="flex min-w-[200px] flex-1 flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={likedLocal ? "secondary" : "outline"}
            size="sm"
            className="gap-2"
            disabled={!user}
            aria-pressed={likedLocal}
            aria-label={likedLocal ? "Bỏ thích" : "Thích bài"}
            onClick={() => void onLikeToggle()}
          >
            <Heart
              className={`size-4 ${likedLocal ? "fill-current" : ""}`}
              aria-hidden
            />
            Thích ({post.likeCount})
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={following ? "secondary" : "outline"}
            onClick={() => void onFollow()}
          >
            {following ? "Đang theo dõi" : "Theo dõi"}
          </Button>
          <Button
            type="button"
            variant={bookmarked ? "secondary" : "outline"}
            onClick={() => void onBookmark()}
            aria-pressed={bookmarked}
          >
            <Bookmark className="size-4" />
            Lưu
          </Button>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link
              key={t.id}
              to={`/tag/${t.slug}`}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
            >
              {t.name}
            </Link>
          ))}
        </div>
      ) : null}

      <Separator className="my-10" />

      <ArticleBody markdown={post.body} />

      <Separator className="my-14" />

      <CommentThread
        comments={comments}
        profiles={profileMap}
        currentUserId={user?.id ?? null}
        onSubmit={onComment}
      />
    </article>
  );
}
