export const AUTH_COOKIE = "wine_auth_token";

export function authCookieOptions(maxAgeSeconds = 7 * 24 * 3600) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
