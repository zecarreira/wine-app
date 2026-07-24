"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import DeadlineBanner from "@/components/DeadlineBanner";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent"></div>

      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-6">
        <div className="text-center mb-6 space-y-3">
          <div className="inline-block">
            <div className="text-5xl mb-3 motion-safe:animate-bounce">🍷</div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Jantar do <span className="text-amber-400">Vinho</span>
          </h1>
          <p className="text-sm text-purple-200 max-w-sm mx-auto leading-relaxed px-4">
            Entre amigos e copos de vinho, nascem as melhores memórias
          </p>

          {user && (
            <div className="mt-3 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 inline-block">
              <p className="text-white font-semibold text-sm">
                Olá, <span className="text-amber-400">{user.name}</span>! 👋
              </p>
            </div>
          )}

          {/* CTA Buttons - Mobile Optimized */}
          <div className="w-full max-w-sm space-y-2.5 mt-6 px-4">
            {loading ? (
              <div className="text-white/60 text-sm py-3" role="status">
                A verificar sessão…
              </div>
            ) : user ? (
              <>
                <DeadlineBanner />
                <Link
                  href="/dinners"
                  className="block w-full bg-linear-to-r from-purple-600 to-pink-600 text-white text-center px-5 py-3.5 rounded-xl font-bold text-base shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 transition-[colors,transform,box-shadow] duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">🍽️</span>
                    <span>Ver Jantares</span>
                  </div>
                </Link>

                <Link
                  href="/calendar"
                  className="block w-full bg-linear-to-r from-indigo-600 to-violet-600 text-white text-center px-5 py-3.5 rounded-xl font-bold text-base shadow-xl hover:shadow-indigo-500/50 transform hover:scale-105 transition-[colors,transform,box-shadow] duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">📅</span>
                    <span>Calendário</span>
                  </div>
                </Link>

                <Link
                  href="/bottles"
                  className="block w-full bg-linear-to-r from-amber-600 to-orange-600 text-white text-center px-5 py-3.5 rounded-xl font-bold text-base shadow-xl hover:shadow-amber-500/50 transform hover:scale-105 transition-[colors,transform,box-shadow] duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">🍷</span>
                    <span>Catálogo de Vinhos</span>
                  </div>
                </Link>

                <Link
                  href="/stats"
                  className="block w-full bg-linear-to-r from-blue-600 to-cyan-600 text-white text-center px-5 py-3.5 rounded-xl font-bold text-base shadow-xl hover:shadow-blue-500/50 transform hover:scale-105 transition-[colors,transform,box-shadow] duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">📊</span>
                    <span>Estatísticas Gerais</span>
                  </div>
                </Link>

                <Link
                  href="/mandamentos"
                  className="block w-full bg-linear-to-r from-emerald-600 to-teal-600 text-white text-center px-5 py-3.5 rounded-xl font-bold text-base shadow-xl hover:shadow-emerald-500/50 transform hover:scale-105 transition-[colors,transform,box-shadow] duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">📜</span>
                    <span>Mandamentos do Vinho</span>
                  </div>
                </Link>

                <Link
                  href="/profile"
                  className="block w-full bg-white/10 backdrop-blur-lg text-white text-center px-5 py-3.5 rounded-xl font-semibold text-base border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-[colors,transform,box-shadow] duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">👤</span>
                    <span>Ver Perfil</span>
                  </div>
                </Link>
              </>
            ) : (
              <div className="space-y-2.5">
                <Link
                  href="/login"
                  className="block w-full bg-linear-to-r from-purple-600 to-pink-600 text-white text-center px-5 py-3.5 rounded-xl font-bold text-base shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 transition-[colors,transform,box-shadow] duration-200 active:scale-95"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">🔐</span>
                    <span>Entrar</span>
                  </div>
                </Link>
                <Link
                  href="/register"
                  className="block w-full bg-white/10 backdrop-blur-lg text-white text-center px-5 py-3 rounded-xl font-semibold text-sm border border-white/20 hover:bg-white/20 transition-colors duration-200"
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
      <SpeedInsights />
      <Analytics />
    </div>
  );
}
