"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { AuthUser } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
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
      const data = await apiFetch<{ success: boolean; user: AuthUser }>(
        "/api/auth/register",
        {
          method: "POST",
          body: { name, email, password },
        }
      );
      setUser(data.user);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Falha no registo");
      } else {
        setError("Erro de conexão. Tenta novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-6 md:mb-8">
          <div className="text-5xl md:text-6xl mb-3">🍷</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            VinoRate
          </h1>
          <p className="text-sm md:text-base text-purple-200">
            Cria a tua conta
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-5 md:p-6 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="register-name" className="block text-white font-semibold mb-2 text-xs md:text-sm">
                Nome
              </label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="O teu nome"
                required
                autoComplete="name"
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 md:py-3 text-white placeholder:text-white/40 focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 text-sm md:text-base"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-white font-semibold mb-2 text-xs md:text-sm">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teu@email.com"
                required
                autoComplete="email"
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 md:py-3 text-white placeholder:text-white/40 focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 text-sm md:text-base"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-white font-semibold mb-2 text-xs md:text-sm">
                Palavra-passe
              </label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 md:py-3 text-white placeholder:text-white/40 focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 text-sm md:text-base"
              />
              <p className="text-white/40 text-xs mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-3 text-red-200 text-center text-sm">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-2xl p-3 text-blue-200 text-xs">
              <p className="font-semibold mb-1">ℹ️ Info Nova Conta:</p>
              <p>
                • Vais começar como <strong>Guest</strong>
              </p>
              <p>
                • O Admin pode promover-te a <strong>Fundador</strong>
              </p>
              <p>• Apenas o Admin pode criar jantares.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-3.5 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70"
            >
              {loading ? "A criar conta..." : "Registar 🍷"}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-white/60 text-xs md:text-sm">
                Já tens conta?{" "}
                <Link
                  href="/login"
                  className="text-purple-300 hover:text-white font-semibold underline"
                >
                  Entra aqui
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
