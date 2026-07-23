import { NextResponse } from "next/server";
import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth-cookie";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(AUTH_COOKIE, "", {
    ...authCookieOptions(0),
    maxAge: 0,
  });
  return res;
}
