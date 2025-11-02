import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userRole?: string;
}

export async function authenticate(
  request: NextRequest
): Promise<{ userId: string; userRole: string } | null> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return null;
    }

    return {
      userId: payload.userId,
      userRole: payload.role,
    };
  } catch (error) {
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

  if (auth.userRole !== "founder") {
    return NextResponse.json(
      { error: "Forbidden. Only founders can perform this action." },
      { status: 403 }
    );
  }

  return auth;
}
