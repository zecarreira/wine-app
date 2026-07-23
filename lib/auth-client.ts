// Client-side auth utilities — session is httpOnly cookie only (no JWT in localStorage).

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "founder" | "guest";
  profile_photo_url?: string | null;
};

/** Module cache kept in sync by AuthProvider. */
let cachedUser: AuthUser | null = null;

export function setCachedUser(user: AuthUser | null): void {
  cachedUser = user;
}

/** Remove leftover localStorage keys from pre-cookie auth. */
export function clearClientAuthState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {
    /* private mode / blocked storage */
  }
  // Keep cache coherent with cleared storage
  if (cachedUser !== null) {
    cachedUser = null;
  }
}

export async function logout(): Promise<void> {
  clearClientAuthState();
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    /* ignore network errors on logout */
  }
}
