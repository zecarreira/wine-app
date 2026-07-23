import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { verifyToken } from "./auth";
import { db } from "./db";
import { users } from "./schema";
import { AUTH_COOKIE } from "./auth-cookie";

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userRole?: string;
}

/** @internal Prefer requireAuth / requireFounder / requireAdmin — do not call without null-check. */
async function authenticate(
  request: NextRequest
): Promise<{ userId: string; userRole: string } | null> {
  try {
    const authHeader = request.headers.get("authorization");
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get(AUTH_COOKIE)?.value;
    }

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);

    if (!payload) {
      return null;
    }

    return {
      userId: payload.userId,
      userRole: payload.role,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  const auth = await authenticate(request);

  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized. Please login first." },
      { status: 401 }
    );
  }

  return auth;
}

export async function requireFounder(request: NextRequest) {
  const auth = await authenticate(request);

  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized. Please login first." },
      { status: 401 }
    );
  }

  if (!["admin", "founder"].includes(auth.userRole)) {
    return NextResponse.json(
      { error: "Forbidden. Only founders can perform this action." },
      { status: 403 }
    );
  }

  return auth;
}

/** DB-fresh admin check — re-reads role from users table. */
export async function requireAdmin(request: NextRequest) {
  const auth = await authenticate(request);

  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized. Please login first." },
      { status: 401 }
    );
  }

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1);

  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Admin access required." },
      { status: 403 }
    );
  }

  return { userId: auth.userId, userRole: user.role as string };
}
