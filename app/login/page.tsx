"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card } from "@/components";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to home page
        router.push("/");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍷</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Jantar do Vinho
          </h1>
          <p className="text-purple-200">Bemvindo de volta</p>
        </div>

        {/* Login Card */}
        <Card padding="lg">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="josecarreira@gmail.com"
              required
            />

            {/* Password */}
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-4 text-red-200 text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              fullWidth
              size="lg"
              icon="🍷"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-white/60">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-purple-300 hover:text-white font-semibold underline"
                >
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-purple-300 hover:text-white">
            ← Regressar
          </Link>
        </div>
      </div>
    </div>
  );
}
