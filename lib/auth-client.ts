// Auth utilities for client-side

// User type from database
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "founder" | "guest";
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function setUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
}

// Check if token is expired (JWT tokens have expiration)
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiration = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiration;
  } catch {
    return true;
  }
}

// Auto-logout if token expired
export function checkAuthStatus(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  if (isTokenExpired(token)) {
    removeAuthToken();
    return false;
  }

  return true;
}
