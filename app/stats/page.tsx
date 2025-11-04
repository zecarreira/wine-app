"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components";

interface SeasonStats {
  id: string;
  name: string;
  is_active: boolean;
  total_dinners: number;
  completed_dinners: number;
  total_amount: number;
  total_paid: number;
  total_pending: number;
  total_fines: number;
}

interface GrandTotals {
  total_seasons: number;
  total_dinners: number;
  completed_dinners: number;
  total_amount: number;
  total_paid: number;
  total_pending: number;
  total_fines: number;
}

interface StatsData {
  grand_totals: GrandTotals;
  seasons: SeasonStats[];
}

export default function AllStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Não autorizado");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/stats/all-seasons", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar estatísticas");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">❌ {error}</p>
          <Link
            href="/dinners"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { grand_totals, seasons } = stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10 px-3 md:px-8 py-4 mb-4 md:mb-6">
          <div className="container mx-auto flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="text-white/80 hover:text-white text-2xl"
            >
              ←
            </button>
            <Link href="/" className="text-white/80 hover:text-white text-2xl">
              🏠
            </Link>
          </div>
        </header>

        <div className="mb-4 md:mb-6 px-3 md:px-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
            📊 Estatísticas Gerais
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            Todas as temporadas desde o início
          </p>
        </div>

        {/* Grand Totals */}
        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-6 border border-white/20 shadow-2xl mx-3 md:mx-8">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
            <span>🏆</span>
            <span>Totais Gerais</span>
          </h2>

          <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4 md:mb-6">
            <div className="bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2">🍂</div>
              <div className="text-xl md:text-2xl font-bold text-white">
                {grand_totals.total_seasons}
              </div>
              <div className="text-white/60 text-xs md:text-sm">Temporadas</div>
            </div>

            <div className="bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2">🍽️</div>
              <div className="text-xl md:text-2xl font-bold text-white">
                {grand_totals.completed_dinners}
              </div>
              <div className="text-white/60 text-xs md:text-sm">Jantares</div>
            </div>

            <div className="bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2">💰</div>
              <div className="text-xl md:text-2xl font-bold text-white">
                {grand_totals.total_amount}
              </div>
              <div className="text-white/60 text-xs md:text-sm">
                Pipas Total
              </div>
            </div>

            <div className="bg-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 text-center">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2">🚨</div>
              <div className="text-xl md:text-2xl font-bold text-white">
                {grand_totals.total_fines}
              </div>
              <div className="text-white/60 text-xs md:text-sm">Multas</div>
            </div>
          </div>

          {/* Paid vs Pending */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <div className="bg-green-500/20 rounded-xl md:rounded-2xl p-3 md:p-4 border border-green-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-200 text-xs md:text-sm mb-1">
                    ✅ PAGO
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {grand_totals.total_paid}
                  </div>
                </div>
                <div className="text-3xl md:text-4xl">💸</div>
              </div>
            </div>

            <div className="bg-orange-500/20 rounded-xl md:rounded-2xl p-3 md:p-4 border border-orange-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-orange-200 text-xs md:text-sm mb-1">
                    ⏳ PENDENTE
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {grand_totals.total_pending}
                  </div>
                </div>
                <div className="text-3xl md:text-4xl">⏰</div>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Season Breakdown */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/20 shadow-xl mx-3 md:mx-8 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
            <span>📋</span>
            <span>Por Temporada</span>
          </h2>

          <div className="space-y-2 md:space-y-3">
            {seasons.map((season) => (
              <Link
                key={season.id}
                href={`/seasons/${season.id}/payments`}
                className="block bg-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
              >
                {/* Season Header */}
                <div className="flex items-center justify-between mb-3 md:mb-4 pb-2 md:pb-3 border-b border-white/10 gap-2">
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <div className="bg-purple-500/20 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg border border-purple-400/30">
                      <h3 className="text-base md:text-lg font-bold text-purple-200">
                        {season.name}
                      </h3>
                    </div>
                    {season.is_active && (
                      <span className="bg-green-500/30 text-green-200 text-xs px-2 py-0.5 md:py-1 rounded-full border border-green-400/30 font-semibold">
                        ✓ ATIVA
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-0">
                  <div className="bg-white/5 rounded-lg md:rounded-xl p-2 md:p-3 text-center">
                    <div className="text-xs md:text-sm text-white/60 mb-0.5 md:mb-1">
                      Jantares
                    </div>
                    <div className="text-lg md:text-xl font-bold text-white">
                      {season.completed_dinners}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg md:rounded-xl p-2 md:p-3 text-center">
                    <div className="text-xs md:text-sm text-white/60 mb-0.5 md:mb-1">
                      Total
                    </div>
                    <div className="text-lg md:text-xl font-bold text-white">
                      {season.total_amount}
                    </div>
                  </div>

                  <div className="bg-green-500/20 rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-green-400/20">
                    <div className="text-xs md:text-sm text-green-200 mb-0.5 md:mb-1">
                      Pago
                    </div>
                    <div className="text-lg md:text-xl font-bold text-white">
                      {season.total_paid}
                    </div>
                  </div>

                  <div className="bg-orange-500/20 rounded-lg md:rounded-xl p-2 md:p-3 text-center border border-orange-400/20">
                    <div className="text-xs md:text-sm text-orange-200 mb-0.5 md:mb-1">
                      Pendente
                    </div>
                    <div className="text-lg md:text-xl font-bold text-white">
                      {season.total_pending}
                    </div>
                  </div>
                </div>

                {season.total_fines > 0 && (
                  <div className="mt-2 md:mt-3 bg-red-500/20 rounded-lg md:rounded-xl p-2 md:p-2.5 border border-red-400/20">
                    <div className="text-center">
                      <span className="text-red-200 text-xs md:text-sm font-semibold">
                        🚨 Multas: {season.total_fines}
                      </span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
