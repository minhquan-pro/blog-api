import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchAuthMe,
  loginApi,
  logoutApi,
  registerApi,
} from "@/lib/api";
import type { User, UserProfile } from "@/types/domain";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (
    email: string,
    password: string,
    displayName: string,
    username: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let c = false;
    void fetchAuthMe()
      .then((me) => {
        if (c) return;
        if (!me) {
          setUser(null);
          setProfile(null);
          return;
        }
        setUser(me.user);
        setProfile(me.profile);
      })
      .catch(() => {
        if (!c) {
          setUser(null);
          setProfile(null);
        }
      });
    return () => {
      c = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const me = await loginApi(email, password);
      setUser(me.user);
      setProfile(me.profile);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    void logoutApi().finally(() => {
      setUser(null);
      setProfile(null);
    });
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      username: string,
    ) => {
      try {
        const me = await registerApi(email, password, displayName, username);
        setUser(me.user);
        setProfile(me.profile);
        return { ok: true } as const;
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Đăng ký thất bại — kiểm tra API và kết nối mạng.";
        return { ok: false as const, error: msg };
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAuthenticated: !!user,
      login,
      logout,
      register,
    }),
    [user, profile, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
