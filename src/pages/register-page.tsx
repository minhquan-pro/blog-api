import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const ok = await register(email, password, displayName, username);
      if (ok) {
        toast.success("Đăng ký demo — đã đăng nhập với tài khoản demo");
        navigate("/");
      } else toast.error("Không thể đăng ký (demo)");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-3xl font-semibold">Đăng ký</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Demo đưa bạn vào tài khoản <code className="rounded bg-muted px-1">demo</code>.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-pass">Mật khẩu</Label>
          <Input
            id="reg-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Tên hiển thị</Label>
          <Input
            id="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="user">Username</Label>
          <Input
            id="user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="[a-z0-9_]+"
            title="Chữ thường, số, gạch dưới"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Đang xử lý…" : "Đăng ký"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-accent-foreground underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
