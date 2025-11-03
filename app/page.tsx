"use client";

import { useMemo } from "react";
import Link from "next/link";
import { getUser, checkAuthStatus } from "@/lib/auth-client";

export default function Home() {
  const user = useMemo(() => {
    if (typeof window === "undefined") return null;
    const isAuthenticated = checkAuthStatus();
    return isAuthenticated ? getUser() : null;
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent"></div>

      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-8 space-y-4">
          <div className="inline-block">
            <div className="text-6xl mb-4 animate-bounce">🍷</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Jantar do <span className="text-amber-400">Vinho</span>
          </h1>
          <p className="text-base text-purple-200 max-w-sm mx-auto leading-relaxed px-4">
            Entre amigos e copos de vinho, nascem as melhores memórias
          </p>

          {user && (
            <div className="mt-4 px-5 py-2.5 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 inline-block">
              <p className="text-white font-semibold text-sm">
                Olá, <span className="text-amber-400">{user.name}</span>! 👋
              </p>
            </div>
          )}

          {/* CTA Buttons - Mobile Optimized */}
          <div className="w-full max-w-sm space-y-3 mt-8 px-4">
            {user ? (
              <>
                <Link
                  href="/dinners"
                  className="block w-full bg-linear-to-r from-purple-600 to-pink-600 text-white text-center px-6 py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">🍽️</span>
                    <span>Ver Jantares</span>
                  </div>
                </Link>

                <Link
                  href="/bottles"
                  className="block w-full bg-linear-to-r from-amber-600 to-orange-600 text-white text-center px-6 py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">🍷</span>
                    <span>Catálogo de Vinhos</span>
                  </div>
                </Link>

                {user.role === "founder" && (
                  <Link
                    href="/create-dinner"
                    className="block w-full bg-linear-to-r from-green-600 to-emerald-600 text-white text-center px-6 py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-200 active:scale-95"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">✨</span>
                      <span>Criar Novo Jantar</span>
                    </div>
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="block w-full bg-white/10 backdrop-blur-lg text-white text-center px-6 py-4 rounded-xl font-semibold text-base border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">👤</span>
                    <span>Ver Perfil</span>
                  </div>
                </Link>
              </>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full bg-linear-to-r from-purple-600 to-pink-600 text-white text-center px-6 py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">🔐</span>
                    <span>Entrar</span>
                  </div>
                </Link>
                <Link
                  href="/register"
                  className="block w-full bg-white/10 backdrop-blur-lg text-white text-center px-6 py-3 rounded-xl font-semibold text-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>✍️</span>
                    <span>Criar Conta</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
