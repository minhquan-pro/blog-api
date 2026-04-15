import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import {
  getMembersForPublicationSlug,
  getPublicationBySlug,
  setMemberRole,
  type MemberWithProfile,
} from "@/lib/api";
import type { Publication, PublicationRole } from "@/types/domain";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function PublicationSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const [pub, setPub] = useState<Publication | undefined>(undefined);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let c = false;
    void (async () => {
      const p = await getPublicationBySlug(slug);
      if (c) return;
      setPub(p);
      if (!p) {
        setLoading(false);
        return;
      }
      const m = await getMembersForPublicationSlug(slug);
      if (c) return;
      setMembers(m);
      setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [slug]);

  const canEdit =
    isAuthenticated &&
    user &&
    pub &&
    members.some(
      (m) =>
        m.userId === user.id && (m.role === "owner" || m.role === "editor"),
    );

  const onRole = async (targetUserId: string, role: PublicationRole) => {
    if (!slug) return;
    const ok = await setMemberRole(slug, targetUserId, role);
    if (ok) {
      toast.success("Đã cập nhật vai trò");
      const m = await getMembersForPublicationSlug(slug);
      setMembers(m);
    } else toast.error("Không thể đổi vai trò");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!pub) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Không tìm thấy</h1>
        <Link to="/" className="mt-4 inline-block underline">
          Về trang chủ
        </Link>
      </div>
    );
  }

  if (!canEdit) {
    return <Navigate to={`/pub/${pub.slug}`} replace />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="text-sm text-muted-foreground">
        <Link to={`/pub/${pub.slug}`} className="underline">
          ← {pub.name}
        </Link>
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold">Thành viên</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Owner/Editor có thể đổi vai trò.
      </p>

      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            <TableHead>Thành viên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead className="w-[180px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => {
            const p = m.profile;
            return (
              <TableRow key={m.userId}>
                <TableCell>
                  <div className="font-medium">{p?.displayName ?? m.userId}</div>
                  <div className="text-xs text-muted-foreground">
                    @{p?.username}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={m.role}
                    onValueChange={(v) => void onRole(m.userId, v as PublicationRole)}
                    disabled={m.role === "owner"}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">owner</SelectItem>
                      <SelectItem value="editor">editor</SelectItem>
                      <SelectItem value="writer">writer</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {p ? (
                    <Link
                      to={`/u/${p.username}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                      )}
                    >
                      Hồ sơ
                    </Link>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
