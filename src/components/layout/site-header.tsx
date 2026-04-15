import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookMarked,
  Bell,
  Menu,
  Moon,
  PenLine,
  Search,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";

import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { profile, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const qv = q.trim();
    navigate(qv ? `/search?q=${encodeURIComponent(qv)}` : "/search");
    setMobileOpen(false);
  };

  const navLinks = (
    <>
      <Link
        to="/"
        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        onClick={() => setMobileOpen(false)}
      >
        Trang chủ
      </Link>
      <Link
        to="/tag/typescript"
        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        onClick={() => setMobileOpen(false)}
      >
        TypeScript
      </Link>
      <Link
        to="/pub/stack-journal"
        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        onClick={() => setMobileOpen(false)}
      >
        Publication
      </Link>
    </>
  );

  const iconLink = (to: string, label: string, icon: ReactNode) => (
    <Link
      to={to}
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
      aria-label={label}
    >
      {icon}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-6">
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-foreground"
        >
          Editorial
        </Link>

        <nav className="hidden items-center gap-6 md:flex">{navLinks}</nav>

        <form
          onSubmit={onSearch}
          className="mx-auto hidden max-w-md flex-1 md:flex"
        >
          <div className="relative w-full">
            <Search
              className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Tìm bài viết…"
              className="h-9 pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Tìm kiếm"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Tìm kiếm"
            onClick={() => navigate("/search")}
          >
            <Search className="size-4" />
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Mở menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">{navLinks}</div>
              <form onSubmit={onSearch} className="mt-6">
                <Input
                  placeholder="Tìm…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Tìm kiếm"
                />
              </form>
            </SheetContent>
          </Sheet>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Đổi giao diện sáng tối"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="size-4 rotate-0 scale-100 transition dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition dark:rotate-0 dark:scale-100" />
          </Button>

          {isAuthenticated ? (
            <>
              {iconLink(
                "/notifications",
                "Thông báo",
                <Bell className="size-4" />,
              )}
              {iconLink("/me", "Thư viện", <BookMarked className="size-4" />)}
              <Link
                to="/write"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "hidden sm:inline-flex",
                )}
              >
                <PenLine className="size-4" />
                Viết
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full p-0"
                    aria-label="Tài khoản"
                  >
                    <Avatar className="size-8">
                      <AvatarImage
                        src={profile?.avatarUrl}
                        alt=""
                        loading="lazy"
                      />
                      <AvatarFallback>
                        {(profile?.displayName ?? "?").slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(profile ? `/u/${profile.username}` : "/")
                    }
                  >
                    <User className="size-4" />
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/write")}>
                    <PenLine className="size-4" />
                    Viết bài
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
