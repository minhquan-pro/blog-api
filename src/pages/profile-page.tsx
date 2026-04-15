import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { PostCard } from "@/components/post/post-card";
import { useAuth } from "@/contexts/auth-context";
import {
  followToggle,
  getPostsForProfile,
  getProfileByUsernameWithViewer,
  getTags,
} from "@/lib/api";
import { tagsForPost } from "@/lib/post-helpers";
import type { Post, Tag, UserProfile } from "@/types/domain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [profile, setProfile] = useState<UserProfile | undefined>(undefined);
  const [viewerFollowing, setViewerFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    let c = false;
    void (async () => {
      const [pv, t] = await Promise.all([
        getProfileByUsernameWithViewer(username),
        getTags(),
      ]);
      if (c) return;
      if (!pv) {
        setProfile(undefined);
        setLoading(false);
        return;
      }
      setProfile(pv.profile);
      setViewerFollowing(pv.viewerIsFollowingAuthor);
      setAllTags(t);
      const p = await getPostsForProfile(username);
      if (c) return;
      setPosts(p);
      setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [username]);

  const following =
    user && profile && user.id !== profile.userId ? viewerFollowing : false;

  const onFollow = async () => {
    if (!user) {
      toast.info("Đăng nhập để theo dõi.");
      return;
    }
    if (!profile) return;
    const now = await followToggle(profile.userId);
    setViewerFollowing(now);
    toast.message(now ? "Đã theo dõi" : "Đã bỏ theo dõi");
  };

  if (!loading && profile === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Không tìm thấy tác giả</h1>
        <Link to="/" className={cn(buttonVariants(), "mt-6 inline-flex")}>
          Về trang chủ
        </Link>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="flex flex-col gap-6 border-b border-border pb-10 md:flex-row md:items-start">
        <Avatar className="size-24 border border-border">
          <AvatarImage src={profile.avatarUrl} alt="" loading="lazy" />
          <AvatarFallback className="text-2xl">
            {profile.displayName.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <h1 className="font-display text-3xl font-semibold">{profile.displayName}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.bio ? <p className="max-w-xl text-pretty">{profile.bio}</p> : null}
          {user?.id !== profile.userId ? (
            <Button
              type="button"
              variant={following ? "secondary" : "default"}
              onClick={() => void onFollow()}
            >
              {following ? "Đang theo dõi" : "Theo dõi"}
            </Button>
          ) : (
            <Link to="/me" className={cn(buttonVariants({ variant: "outline" }))}>
              Thư viện của tôi
            </Link>
          )}
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Bài đã xuất bản</h2>
      <div className="mt-6 space-y-8">
        {loading ? (
          <>
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">Chưa có bài nào.</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={profile}
              tags={tagsForPost(post, allTags)}
            />
          ))
        )}
      </div>
    </div>
  );
}
