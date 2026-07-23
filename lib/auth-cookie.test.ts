import { describe, expect, it } from "vitest";
import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth-cookie";

describe("auth-cookie", () => {
  it("exports the expected cookie name", () => {
    expect(AUTH_COOKIE).toBe("wine_auth_token");
  });

  it("returns secure httpOnly options with defaults", () => {
    const opts = authCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(7 * 24 * 3600);
    expect(typeof opts.secure).toBe("boolean");
  });

  it("accepts custom maxAge", () => {
    expect(authCookieOptions(0).maxAge).toBe(0);
    expect(authCookieOptions(3600).maxAge).toBe(3600);
  });
});
