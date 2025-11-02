"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save token and user
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to dinners
        router.push("/dinners");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🍷</div>
          <h1 className="text-4xl font-bold text-white mb-2">VinoRate</h1>
          <p className="text-purple-200">Create your account</p>
        </div>

        {/* Register Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-lg"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
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
                minLength={6}
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-lg"
              />
              <p className="text-white/40 text-xs mt-2">Minimum 6 characters</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-4 text-red-200 text-center">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-2xl p-4 text-blue-200 text-sm">
              <p className="font-semibold mb-1">ℹ️ New Account Info:</p>
              <p>
                • You'll start as a <strong>Guest</strong>
              </p>
              <p>
                • Admin can promote you to <strong>Founder</strong>
              </p>
              <p>• Founders can create dinners</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Register 🍷"}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-white/60">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-purple-300 hover:text-white font-semibold underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
