import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
  const secret = process.env.JWT_SECRET!;

  return jwt.sign(
    { userId, role },
    secret,
    { expiresIn: "7d" } // Token expires in 7 days
  );
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  const secret = process.env.JWT_SECRET!;

  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    // Token is invalid or expired
    return null;
  }
}
