"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  type AuthUser,
  clearClientAuthState,
  logout as clientLogout,
  setCachedUser,
} from "@/lib/auth-client";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    setCachedUser(u);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<{ success: boolean; user: AuthUser }>(
        "/api/auth/me"
      );
      setUser(data.user);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
      } else {
        setUser(null);
      }
    }
  }, [setUser]);

  useEffect(() => {
    let cancelled = false;
    clearClientAuthState();

    void (async () => {
      try {
        const data = await apiFetch<{ success: boolean; user: AuthUser }>(
          "/api/auth/me"
        );
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  const logout = useCallback(async () => {
    await clientLogout();
    setUser(null);
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
