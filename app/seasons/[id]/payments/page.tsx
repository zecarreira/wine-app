"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
}

interface DinnerStats {
  dinner_id: string;
  dinner_name: string;
  dinner_date: string;
  total_payments: number;
  paid_count: number;
  pending_count: number;
  total_collected: number;
  total_pending: number;
  total_fines: number;
  base_amount: number;
}

interface SeasonStats {
  total_dinners: number;
  total_payments: number;
  total_collected: number;
  total_pending: number;
  total_fines: number;
  base_amount: number;
  paid_count: number;
  pending_count: number;
  grand_total: number;
}

export default function SeasonPaymentStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [season, setSeason] = useState<Season | null>(null);
  const [stats, setStats] = useState<SeasonStats | null>(null);
  const [dinners, setDinners] = useState<DinnerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasonStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchSeasonStats() {
    try {
      setLoading(true);
      const response = await fetch(`/api/seasons/${id}/stats`);
      const data = await response.json();

      if (data.success) {
        setSeason(data.season);
        setStats(data.stats);
        setDinners(data.dinners);
      }
    } catch (error) {
      console.error("Failed to fetch season stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 motion-safe:animate-spin" aria-hidden="true">📊</div>
          <div className="text-white text-xl" role="status">A carregar estatísticas...</div>
        </div>
      </div>
    );
  }

  if (!season || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Temporada não encontrada</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            aria-label="Voltar"
            className="text-white/80 hover:text-white text-2xl rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            ←
          </button>
          <Link href="/" aria-label="Início" className="text-white/80 hover:text-white text-2xl rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
            🏠
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
            💰 Estatísticas de Pagamentos
          </h1>
          <p className="text-lg md:text-xl text-purple-300">{season.name}</p>
          <p className="text-white/60 text-xs md:text-sm">
            {new Date(season.start_date).toLocaleDateString("pt-PT")}
            {season.end_date &&
              ` - ${new Date(season.end_date).toLocaleDateString("pt-PT")}`}
          </p>
        </div>

        {/* Overall Stats */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-6 mb-6 md:mb-8 border border-white/20 shadow-xl">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
            📊 Visão Geral
          </h2>

          <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4 md:mb-6">
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-3 md:p-4 text-center">
              <div className="text-blue-400 text-xs md:text-sm font-semibold mb-1">
                🍷 Jantares
              </div>
              <div className="text-white text-2xl md:text-3xl font-bold">
                {stats.total_dinners}
              </div>
            </div>

            <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-3 md:p-4 text-center">
              <div className="text-purple-400 text-xs md:text-sm font-semibold mb-1">
                👥 Pagamentos
              </div>
              <div className="text-white text-2xl md:text-3xl font-bold">
                {stats.total_payments}
              </div>
            </div>

            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3 md:p-4 text-center">
              <div className="text-green-400 text-xs md:text-sm font-semibold mb-1">
                ✅ Pago
              </div>
              <div className="text-white text-2xl md:text-3xl font-bold">
                {stats.paid_count}
              </div>
            </div>

            <div className="bg-orange-500/20 border border-orange-400/30 rounded-xl p-3 md:p-4 text-center">
              <div className="text-orange-400 text-xs md:text-sm font-semibold mb-1">
                ⏳ Por Pagar
              </div>
              <div className="text-white text-2xl md:text-3xl font-bold">
                {stats.pending_count}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10">
              <div className="text-white/70 text-xs md:text-sm mb-1">
                Valor Base
              </div>
              <div className="text-white text-xl md:text-2xl font-bold">
                {stats.base_amount}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10">
              <div className="text-white/70 text-xs md:text-sm mb-1">
                Total Multas
              </div>
              <div className="text-red-400 text-xl md:text-2xl font-bold">
                +{stats.total_fines}
              </div>
            </div>

            <div className="bg-green-500/20 rounded-xl p-3 md:p-4 border border-green-400/30">
              <div className="text-green-300 text-xs md:text-sm mb-1">
                💰 Recebido
              </div>
              <div className="text-white text-xl md:text-2xl font-bold">
                {stats.total_collected}
              </div>
            </div>

            <div className="bg-orange-500/20 rounded-xl p-3 md:p-4 border border-orange-400/30">
              <div className="text-orange-300 text-xs md:text-sm mb-1">
                ⏳ Por Receber
              </div>
              <div className="text-white text-xl md:text-2xl font-bold">
                {stats.total_pending}
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-6 bg-amber-500/20 border-2 border-amber-400/40 rounded-xl p-4 md:p-6 text-center">
            <div className="text-amber-300 text-base md:text-lg font-semibold mb-2">
              🎯 Total Geral
            </div>
            <div className="text-white text-3xl md:text-5xl font-bold">
              {stats.grand_total}
            </div>
            <div className="text-amber-200 text-xs md:text-sm mt-2">
              Base: {stats.base_amount} + Multas: {stats.total_fines}
            </div>
          </div>
        </div>

        {/* Per-Dinner Breakdown */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/20 shadow-xl">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
            🍽️ Por Jantar
          </h2>

          {dinners.length === 0 ? (
            <div className="text-white/70 text-center py-8 text-sm md:text-base">
              Ainda não há jantares com pagamentos
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {dinners.map((dinner) => (
                <div
                  key={dinner.dinner_id}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 mb-3 md:mb-4">
                    <div className="flex-1">
                      <h3 className="text-white text-base md:text-lg font-bold mb-1">
                        {dinner.dinner_name}
                      </h3>
                      <p className="text-white/60 text-xs md:text-sm">
                        {new Date(dinner.dinner_date).toLocaleDateString(
                          "pt-PT"
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/dinners/${dinner.dinner_id}`}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors text-center"
                    >
                      Ver Jantar →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="bg-blue-500/10 rounded-lg p-2 md:p-3">
                      <div className="text-blue-300 text-xs mb-1">
                        Pagamentos
                      </div>
                      <div className="text-white text-sm md:text-base font-bold">
                        {dinner.total_payments}
                      </div>
                      <div className="text-blue-400 text-xs">
                        {dinner.base_amount}
                      </div>
                    </div>

                    <div className="bg-green-500/10 rounded-lg p-2 md:p-3">
                      <div className="text-green-300 text-xs mb-1">Pago</div>
                      <div className="text-white text-sm md:text-base font-bold">
                        {dinner.paid_count}
                      </div>
                      <div className="text-green-400 text-xs">
                        {dinner.total_collected}
                      </div>
                    </div>

                    <div className="bg-orange-500/10 rounded-lg p-2 md:p-3">
                      <div className="text-orange-300 text-xs mb-1">
                        Pendente
                      </div>
                      <div className="text-white text-sm md:text-base font-bold">
                        {dinner.pending_count}
                      </div>
                      <div className="text-orange-400 text-xs">
                        {dinner.total_pending}
                      </div>
                    </div>

                    <div className="bg-red-500/10 rounded-lg p-2 md:p-3">
                      <div className="text-red-300 text-xs mb-1">Multas</div>
                      <div className="text-white text-sm md:text-base font-bold">
                        +{dinner.total_fines}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-xs md:text-sm">
                        Total deste jantar:
                      </span>
                      <span className="text-white text-base md:text-lg font-bold">
                        {dinner.total_collected + dinner.total_pending}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
