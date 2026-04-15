import { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Comment, UserProfile } from "@/types/domain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentThreadProps {
  comments: Comment[];
  profiles: Map<string, UserProfile>;
  currentUserId: string | null;
  onSubmit: (parentId: string | null, body: string) => Promise<void>;
}

function buildTree(comments: Comment[]): Map<string | null, Comment[]> {
  const map = new Map<string | null, Comment[]>();
  for (const c of comments) {
    const key = c.parentId;
    const list = map.get(key) ?? [];
    list.push(c);
    map.set(key, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  return map;
}

interface NodeProps {
  comment: Comment;
  depth: number;
  tree: Map<string | null, Comment[]>;
  profiles: Map<string, UserProfile>;
  currentUserId: string | null;
  onSubmit: (parentId: string | null, body: string) => Promise<void>;
}

function CommentNode({
  comment,
  depth,
  tree,
  profiles,
  currentUserId,
  onSubmit,
}: NodeProps) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const author = profiles.get(comment.authorId);
  const children = tree.get(comment.id) ?? [];

  const onReply = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      await onSubmit(comment.id, reply);
      setReply("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="space-y-3">
      <div
        className="flex gap-3 rounded-lg border border-border/60 bg-card/50 p-3"
        style={{ marginLeft: depth * 12 }}
      >
        <Link to={author ? `/u/${author.username}` : "#"} className="shrink-0">
          <Avatar className="size-9">
            <AvatarImage src={author?.avatarUrl} alt="" loading="lazy" />
            <AvatarFallback>
              {author?.displayName.slice(0, 1) ?? "?"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline gap-2 text-sm">
            <span className="font-medium">
              {author?.displayName ?? "Người dùng"}
            </span>
            <time
              className="text-xs text-muted-foreground"
              dateTime={comment.createdAt}
            >
              {new Date(comment.createdAt).toLocaleString("vi-VN")}
            </time>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {comment.body}
          </p>
          {currentUserId ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-7 px-2 text-xs"
              onClick={() => setOpen((o) => !o)}
            >
              Trả lời
            </Button>
          ) : null}
          {open ? (
            <div className="space-y-2 pt-1">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Viết phản hồi…"
                rows={3}
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                disabled={saving || !reply.trim()}
                onClick={() => void onReply()}
              >
                Gửi
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      {children.length > 0 ? (
        <ul className="space-y-3 border-l border-border/50 pl-2">
          {children.map((ch) => (
            <CommentNode
              key={ch.id}
              comment={ch}
              depth={depth + 1}
              tree={tree}
              profiles={profiles}
              currentUserId={currentUserId}
              onSubmit={onSubmit}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function CommentThreadComponent({
  comments,
  profiles,
  currentUserId,
  onSubmit,
}: CommentThreadProps) {
  const tree = useMemo(() => buildTree(comments), [comments]);
  const roots = tree.get(null) ?? [];

  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const sendRoot = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await onSubmit(null, body);
      setBody("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="responses-heading">
      <h2 id="responses-heading" className="font-display text-2xl font-semibold">
        Phản hồi ({comments.length})
      </h2>
      {currentUserId ? (
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Nhập bình luận…"
            rows={4}
            className="text-sm"
            aria-label="Bình luận mới"
          />
          <Button
            type="button"
            disabled={saving || !body.trim()}
            onClick={() => void sendRoot()}
          >
            Xuất bản
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="underline underline-offset-2">
            Đăng nhập
          </Link>{" "}
          để bình luận.
        </p>
      )}
      <ul className="space-y-4">
        {roots.map((c) => (
          <CommentNode
            key={c.id}
            comment={c}
            depth={0}
            tree={tree}
            profiles={profiles}
            currentUserId={currentUserId}
            onSubmit={onSubmit}
          />
        ))}
      </ul>
    </section>
  );
}

export const CommentThread = memo(CommentThreadComponent);
