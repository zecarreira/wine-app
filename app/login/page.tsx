"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

        // Redirect to dinners
        router.push("/dinners");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
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
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="josecarreira@gmail.com"
                required
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-lg"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-lg"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-4 text-red-200 text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login 🍷"}
            </button>

            {/* Register Link - ADICIONA ISTO */}
            <div className="text-center">
              <p className="text-white/60">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-purple-300 hover:text-white font-semibold underline"
                >
                  Register here
                </Link>
              </p>
            </div>
          </form>
          {/* Demo Credentials */}
          {/* <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/60 text-sm text-center mb-2">
              Demo credentials:
            </p>
            <p className="text-purple-200 text-sm text-center font-mono">
              john@example.com / password123
            </p>
          </div> */}
        </div>

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
