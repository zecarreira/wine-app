import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "./env";

// Type for JWT payload
interface JWTPayload {
  userId: string;
  role: string;
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password with hash
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create JWT token
export function createToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    env.JWT_SECRET,
    { expiresIn: "7d" } // Token expires in 7 days
  );
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch {
    // Token is invalid or expired
    return null;
  }
}
