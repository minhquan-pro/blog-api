import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import {
  getEditablePost,
  getTags,
  listPublications,
  savePost,
  uploadCoverImage,
  type EditorPostPayload,
} from "@/lib/api";
import {
  deleteLocalDraft,
  getLocalDraft,
  upsertLocalDraft,
} from "@/lib/local-drafts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleBody } from "@/components/post/article-body";
import type { PostStatus, Publication } from "@/types/domain";

function isEditorEmpty(
  title: string,
  subtitle: string,
  body: string,
  excerpt: string,
): boolean {
  return (
    !title.trim() &&
    !subtitle.trim() &&
    !body.trim() &&
    !excerpt.trim()
  );
}

export function WritePage() {
  const { postId } = useParams<{ postId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const localDraftParam = searchParams.get("localDraft");
  const { user, profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [cover, setCover] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [publicationId, setPublicationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!postId || !!localDraftParam);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [pubs, setPubs] = useState<Publication[]>([]);

  const empty = useMemo(
    () => isEditorEmpty(title, subtitle, body, excerpt),
    [title, subtitle, body, excerpt],
  );

  useEffect(() => {
    void listPublications().then(setPubs);
  }, []);

  const applyLocalDraft = useCallback(
    (id: string) => {
      if (!user) return;
      const d = getLocalDraft(user.id, id);
      if (!d) {
        toast.error("Không tìm thấy bản nháp cục bộ");
        setSearchParams({}, { replace: true });
        setLoading(false);
        return;
      }
      setTitle(d.title);
      setSubtitle(d.subtitle);
      setBody(d.body);
      setExcerpt(d.excerpt);
      setCover(d.coverImageUrl);
      setTagInput(d.tagInput);
      setPublicationId(d.publicationId);
      setLoading(false);
    },
    [user, setSearchParams],
  );

  useEffect(() => {
    if (!postId || !user) {
      if (!postId) setLoading(false);
      return;
    }
    let c = false;
    void Promise.all([getEditablePost(postId), getTags()]).then(([p, allTags]) => {
      if (c || !p) {
        if (!c && !p) toast.error("Không mở được bài này");
        setLoading(false);
        return;
      }
      setTitle(p.title);
      setSubtitle(p.subtitle);
      setBody(p.body);
      setExcerpt(p.excerpt);
      setCover(p.coverImageUrl);
      const tags = allTags
        .filter((t) => p.tagIds.includes(t.id))
        .map((t) => t.slug)
        .join(", ");
      setTagInput(tags);
      setPublicationId(p.publicationId);
      setLoading(false);
    });
    return () => {
      c = true;
    };
  }, [postId, user]);

  useEffect(() => {
    if (postId) return;
    if (!user) return;
    if (!localDraftParam) {
      setTitle("");
      setSubtitle("");
      setBody("");
      setExcerpt("");
      setCover("");
      setTagInput("");
      setPublicationId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    applyLocalDraft(localDraftParam);
  }, [postId, user, localDraftParam, applyLocalDraft]);

  if (!isAuthenticated || !user || !profile) {
    return <Navigate to="/login" replace />;
  }

  const buildPayload = (nextStatus: PostStatus): EditorPostPayload => {
    const tagSlugs = tagInput
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return {
      title: title.trim(),
      subtitle: subtitle.trim(),
      body,
      excerpt: excerpt.trim(),
      coverImageUrl: cover.trim(),
      tagSlugs,
      status: nextStatus,
      publicationId,
    };
  };

  const onSaveLocal = () => {
    if (empty) {
      toast.error("Thêm tiêu đề, nội dung hoặc tóm tắt trước khi lưu nháp.");
      return;
    }
    const id = localDraftParam ?? crypto.randomUUID();
    upsertLocalDraft(user.id, {
      id,
      updatedAt: new Date().toISOString(),
      title,
      subtitle,
      body,
      excerpt,
      coverImageUrl: cover,
      tagInput,
      publicationId,
    });
    setSearchParams({ localDraft: id }, { replace: true });
    toast.success("Đã lưu bản nháp trên thiết bị");
  };

  const onPublish = async () => {
    if (empty) {
      toast.error("Thêm tiêu đề, nội dung hoặc tóm tắt trước khi xuất bản.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload("published");
      const saved = await savePost(postId, user.id, payload);
      if (!postId && localDraftParam) {
        deleteLocalDraft(user.id, localDraftParam);
      }
      toast.success("Đã xuất bản");
      navigate(`/p/${profile.username}/${saved.slug}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu");
    } finally {
      setSaving(false);
    }
  };

  const onSaveServerDraft = async () => {
    if (!postId) return;
    if (empty) {
      toast.error("Thêm tiêu đề, nội dung hoặc tóm tắt trước khi lưu nháp.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload("draft");
      await savePost(postId, user.id, payload);
      toast.success("Đã lưu");
      navigate("/me");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        Đang tải bài…
      </div>
    );
  }

  const pageTitle = postId
    ? "Sửa bài"
    : localDraftParam
      ? "Bản nháp (thiết bị)"
      : "Viết bài mới";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">{pageTitle}</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving || empty}
            onClick={() => {
              if (postId) {
                void onSaveServerDraft();
              } else {
                onSaveLocal();
              }
            }}
          >
            Lưu nháp
          </Button>
          <Button
            type="button"
            disabled={saving || empty}
            onClick={() => void onPublish()}
          >
            Xuất bản
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề bài viết"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sub">Phụ đề</Label>
          <Input
            id="sub"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Tùy chọn"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Publication (tuỳ chọn)</Label>
            <Select
              value={publicationId ?? "none"}
              onValueChange={(v) => setPublicationId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cá nhân" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chỉ tài khoản cá nhân</SelectItem>
                {pubs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tag (slug, phân cách bởi dấu phẩy)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover-file">Ảnh bìa</Label>
          <Input
            id="cover-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploadingCover}
            className="cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setUploadingCover(true);
              void uploadCoverImage(file)
                .then((url) => {
                  setCover(url);
                  toast.success("Đã tải ảnh lên");
                })
                .catch((err) => {
                  toast.error(err instanceof Error ? err.message : "Lỗi tải ảnh");
                })
                .finally(() => setUploadingCover(false));
            }}
          />
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP hoặc GIF, tối đa 5&nbsp;MB.
          </p>
          {cover ? (
            <div className="relative mt-2 overflow-hidden rounded-lg border border-border">
              <img
                src={cover}
                alt=""
                className="max-h-48 w-full object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute right-2 top-2"
                onClick={() => setCover("")}
              >
                Gỡ ảnh
              </Button>
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ex">Tóm tắt (excerpt)</Label>
          <Textarea
            id="ex"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <Tabs defaultValue="edit" className="mt-10">
        <TabsList>
          <TabsTrigger value="edit">Markdown</TabsTrigger>
          <TabsTrigger value="preview">Xem trước</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[360px] font-mono text-sm"
            placeholder="Viết bằng Markdown…"
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-4 rounded-xl border border-border p-6">
          <ArticleBody markdown={body || "*Chưa có nội dung*"} />
        </TabsContent>
      </Tabs>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/me" className="underline">
          Về thư viện
        </Link>
      </p>
    </div>
  );
}
