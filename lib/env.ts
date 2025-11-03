// Environment variables validation
interface EnvVars {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
}

const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
};

// Validate on module load
export function validateEnv(): EnvVars {
  const missing: string[] = [];

  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join(
        "\n"
      )}\n\nPlease check your .env.local file. See .env.example for reference.`
    );
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters long for security.\nGenerate a strong secret using: openssl rand -base64 32"
    );
  }

  return requiredEnvVars as EnvVars;
}

// Export validated env vars
export const env = validateEnv();
