import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createToken } from "@/lib/auth";
import { parseBody } from "@/lib/api/parse-body";
import { registerApiSchema } from "@/lib/validations";
import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth-cookie";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, registerApiSchema);
    if ("error" in parsed) return parsed.error;
    const { name, email, password } = parsed.data;

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password_hash: passwordHash,
        role: "guest",
      })
      .returning();

    const token = createToken(newUser.id, newUser.role);

    const res = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        token,
      },
      { status: 201 }
    );
    res.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return res;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
