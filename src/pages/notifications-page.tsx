import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import {
  getNotificationsForCurrentUser,
  getProfileByUserId,
} from "@/lib/api";
import type { NotificationItem, UserProfile } from "@/types/domain";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [actors, setActors] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    let c = false;
    void getNotificationsForCurrentUser().then((n) => {
      if (!c) {
        setItems(n);
        setLoading(false);
      }
    });
    return () => {
      c = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (items.length === 0) {
      setActors({});
      return;
    }
    const ids = new Set<string>();
    for (const n of items) {
      const a = n.payload.actorId;
      if (a) ids.add(a);
    }
    let cancelled = false;
    void Promise.all(
      [...ids].map(async (id) => {
        const pr = await getProfileByUserId(id);
        return [id, pr] as const;
      }),
    ).then((pairs) => {
      if (cancelled) return;
      const m: Record<string, UserProfile> = {};
      for (const [id, pr] of pairs) {
        if (pr) m[id] = pr;
      }
      setActors(m);
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 md:px-6">
      <h1 className="font-display text-3xl font-semibold">Thông báo</h1>
      <ScrollArea className="mt-8 h-[min(70vh,520px)] pr-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">Không có thông báo.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li
                key={n.id}
                className="rounded-xl border border-border bg-card/60 p-4 text-sm"
              >
                <NotificationBody item={n} actors={actors} />
                <time
                  className="mt-2 block text-xs text-muted-foreground"
                  dateTime={n.createdAt}
                >
                  {new Date(n.createdAt).toLocaleString("vi-VN")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}

function NotificationBody({
  item,
  actors,
}: {
  item: NotificationItem;
  actors: Record<string, UserProfile>;
}) {
  if (item.type === "new_follow") {
    const actor = item.payload.actorId
      ? actors[item.payload.actorId]
      : undefined;
    return (
      <p>
        <Link
          to={actor ? `/u/${actor.username}` : "/"}
          className="font-medium text-accent-foreground underline"
        >
          {actor?.displayName ?? "Ai đó"}
        </Link>{" "}
        đã theo dõi bạn.
      </p>
    );
  }
  if (item.type === "new_comment") {
    const actor = item.payload.actorId
      ? actors[item.payload.actorId]
      : undefined;
    return (
      <p>
        {actor ? (
          <Link
            to={`/u/${actor.username}`}
            className="font-medium text-accent-foreground underline"
          >
            {actor.displayName}
          </Link>
        ) : (
          "Ai đó"
        )}{" "}
        đã bình luận: {item.payload.snippet?.slice(0, 80)}
        …
      </p>
    );
  }
  if (item.type === "new_like" || item.type === "new_clap") {
    const actor = item.payload.actorId
      ? actors[item.payload.actorId]
      : undefined;
    return (
      <p>
        {actor ? (
          <Link
            to={`/u/${actor.username}`}
            className="font-medium text-accent-foreground underline"
          >
            {actor.displayName}
          </Link>
        ) : (
          "Ai đó"
        )}{" "}
        đã thích bài của bạn.
      </p>
    );
  }
  return <p>Thông báo ({item.type})</p>;
}
