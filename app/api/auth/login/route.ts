import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { comparePassword, createToken } from "@/lib/auth";
import { parseBody } from "@/lib/api/parse-body";
import { loginApiSchema } from "@/lib/validations";
import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth-cookie";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, loginApiSchema);
    if ("error" in parsed) return parsed.error;
    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: "This account does not have a password set" },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = createToken(user.id, user.role);

    const res = NextResponse.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
    res.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
