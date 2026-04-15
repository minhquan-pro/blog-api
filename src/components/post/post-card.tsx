import { memo } from "react";
import { Link } from "react-router-dom";

import type { Post, Tag, UserProfile } from "@/types/domain";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface PostCardProps {
  post: Post;
  author: UserProfile;
  tags: Tag[];
  style?: React.CSSProperties;
}

function PostCardComponent({ post, author, tags, style }: PostCardProps) {
  const date =
    post.publishedAt &&
    new Date(post.publishedAt).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <article style={style}>
      <Card className="overflow-hidden border-border/80 transition hover:border-accent-foreground/20 hover:shadow-md">
        <Link to={`/p/${author.username}/${post.slug}`} className="block">
          {post.coverImageUrl ? (
            <div className="aspect-[2.2/1] w-full overflow-hidden bg-muted">
              <img
                src={post.coverImageUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
              />
            </div>
          ) : null}
          <CardHeader className="space-y-2 pb-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar className="size-6">
                <AvatarImage src={author.avatarUrl} alt="" loading="lazy" />
                <AvatarFallback>{author.displayName.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span>{author.displayName}</span>
              {date ? <span aria-hidden>·</span> : null}
              {date ? <time dateTime={post.publishedAt!}>{date}</time> : null}
            </div>
            <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-foreground md:text-2xl">
              {post.title}
            </h2>
            {post.subtitle ? (
              <p className="text-sm text-muted-foreground">{post.subtitle}</p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {post.excerpt ? (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Link
                  key={t.id}
                  to={`/tag/${t.slug}`}
                  className={cn(badgeVariants({ variant: "secondary" }))}
                >
                  {t.name}
                </Link>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {post.readingTimeMinutes} phút đọc
            </p>
          </CardContent>
        </Link>
      </Card>
    </article>
  );
}

export const PostCard = memo(PostCardComponent);
