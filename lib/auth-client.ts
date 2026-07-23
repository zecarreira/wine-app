// Client-side auth utilities — session is httpOnly cookie only (no JWT in localStorage).

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "founder" | "guest";
  profile_photo_url?: string | null;
};

/** Module cache for sync reads (e.g. getUser()?.role). Kept in sync by AuthProvider. */
let cachedUser: AuthUser | null = null;

export function getUser(): AuthUser | null {
  return cachedUser;
}

export function setCachedUser(user: AuthUser | null): void {
  cachedUser = user;
}

/** @deprecated Cookie session only — always returns null. */
export function getAuthToken(): string | null {
  return null;
}

/** @deprecated Cookie session only — no-op. */
export function setAuthToken(_token: string): void {
  // no-op
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
}

/** @deprecated Use clearClientAuthState + logout(). Clears storage only (no network). */
export function removeAuthToken(): void {
  clearClientAuthState();
  cachedUser = null;
}

export async function logout(): Promise<void> {
  clearClientAuthState();
  cachedUser = null;
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    /* ignore network errors on logout */
  }
}

/** True if module cache has a user (after AuthProvider loads /me or login). */
export function checkAuthStatus(): boolean {
  return cachedUser !== null;
}
