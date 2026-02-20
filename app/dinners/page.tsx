"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { DinnerCardSkeleton } from "@/components/Skeletons";
import { useToast } from "@/components/ToastProvider";
import { getUser } from "@/lib/auth-client";

interface Dinner {
  id: string;
  name: string;
  event_date: string;
  location: string;
  is_blind: boolean;
  is_completed?: boolean;
  status?: string;
  is_extra_dinner: boolean;
  dinner_number_in_season: number;
}

interface ActiveSeason {
  id: string;
  season_number: number;
  status: string;
  start_date: string;
  dinners: Dinner[];
  stats: {
    total_dinners: number;
    regular_dinners: number;
    extra_dinners: number;
    is_full: boolean;
    can_close: boolean;
  };
}

export default function DinnersPage() {
  const [activeSeason, setActiveSeason] = useState<ActiveSeason | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const [userRole] = useState(() => getUser()?.role ?? null);

  async function fetchActiveSeason() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/seasons/active", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setActiveSeason(data.season);
      }
    } catch (error) {
      console.error("Error fetching active season:", error);
      showToast("Erro ao carregar temporada", "error");
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchActiveSeason();
  }, []);

  async function handleCloseSeason() {
    if (!activeSeason) return;

    if (
      !confirm(
        `Tens a certeza que queres fechar a Temporada ${activeSeason.season_number}?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/seasons/${activeSeason.id}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showToast(
          `Temporada ${activeSeason.season_number} fechada!`,
          "success"
        );
        fetchActiveSeason();
      } else {
        if (data.error) {
          showToast(data.error, "error");
        } else {
          showToast("Erro ao fechar temporada", "error");
        }
      }
    } catch (error) {
      console.error("Error closing season:", error);
      showToast("Erro ao fechar temporada", "error");
    }
  }

  async function handleCreateSeason() {
    if (
      !confirm(
        "Tens a certeza que queres criar uma nova temporada? A temporada anterior deve estar fechada."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/seasons", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showToast(`Temporada ${data.season.season_number} criada!`, "success");
        fetchActiveSeason();
      } else {
        if (data.error) {
          showToast(data.error, "error");
        } else {
          showToast("Erro ao criar temporada", "error");
        }
      }
    } catch (error) {
      console.error("Error creating season:", error);
      showToast("Erro ao criar temporada", "error");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header useBackButton />

        <div className="container mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Jantares</h1>
              <p className="text-purple-200">A carregar temporada ativa...</p>
            </div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((num) => (
              <DinnerCardSkeleton key={`skeleton-${num}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dinners = activeSeason?.dinners || [];
  const stats = activeSeason?.stats;

  // Check if there are any scheduled (not completed) dinners
  const hasScheduledDinner = dinners.some(
    (dinner) => dinner.status === "setup" || dinner.status === "active"
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header useBackButton />

      <div className="container mx-auto px-4 py-6">
        {/* Header Actions */}
        <div className="mb-4">
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-white mb-1">
              {activeSeason
                ? `Temporada ${activeSeason.season_number}`
                : "Jantares"}
            </h1>
            {activeSeason && stats && (
              <p className="text-purple-200 text-sm">
                {stats.total_dinners}/8 Jantares
              </p>
            )}
            {!activeSeason && (
              <p className="text-purple-200 text-sm">Nenhuma temporada ativa</p>
            )}
          </div>

          {/* Stats and History Buttons */}
          <div className="flex gap-2 mb-3">
            {activeSeason && (
              <Link
                href={`/seasons/${activeSeason.id}/payments`}
                className="flex-1"
              >
                <Button variant="secondary" size="sm" icon="💰" fullWidth>
                  Estatísticas
                </Button>
              </Link>
            )}
            <Link href="/dinners/history" className="flex-1">
              <Button variant="secondary" size="sm" icon="📚" fullWidth>
                Histórico
              </Button>
            </Link>
          </div>

          {/* Admin Buttons */}
          {userRole === "admin" && activeSeason && (
            <div className="flex gap-2">
              {!stats?.is_full && !hasScheduledDinner && (
                <Button
                  variant="success"
                  size="sm"
                  icon="+"
                  onClick={() => (window.location.href = "/create-dinner")}
                  fullWidth
                >
                  {stats?.total_dinners === 7
                    ? "🎁 Jantar Extra"
                    : "Novo Jantar"}
                </Button>
              )}
              {stats?.can_close && (
                <Button
                  variant="danger"
                  size="sm"
                  icon="🔒"
                  onClick={handleCloseSeason}
                  fullWidth
                >
                  Fechar Temporada
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Season Full Warning */}
        {activeSeason && stats?.is_full && !stats?.can_close && (
          <div className="mb-4 bg-amber-500/20 border-2 border-amber-400/50 rounded-2xl p-3 text-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-sm">Temporada Cheia</p>
                <p className="text-xs">Esta temporada já tem 8 jantares.</p>
              </div>
            </div>
          </div>
        )}

        {/* Can Close Season Info */}
        {activeSeason && stats?.can_close && userRole === "admin" && (
          <div className="mb-4 bg-green-500/20 border-2 border-green-400/50 rounded-2xl p-3 text-green-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-semibold text-sm">Temporada Completa!</p>
                <p className="text-xs">
                  Esta temporada tem 8 jantares. Podes fechá-la e criar uma
                  nova.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dinners List */}
        {!activeSeason ? (
          <Card className="p-8 text-center">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-white/60 text-base mb-2">
              Nenhuma temporada ativa
            </p>
            <p className="text-white/40 text-sm mb-4">
              {userRole === "admin"
                ? "Cria uma nova temporada para começar"
                : "Aguarda que o administrador crie uma nova temporada"}
            </p>
            {userRole === "admin" && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="success"
                  size="md"
                  icon="✨"
                  onClick={handleCreateSeason}
                >
                  Criar Nova Temporada
                </Button>
              </div>
            )}
          </Card>
        ) : dinners.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-white/60 text-base mb-2">
              Ainda não há jantares nesta temporada
            </p>
            <p className="text-white/40 text-sm">
              {userRole === "admin"
                ? "Cria o primeiro jantar usando o botão acima"
                : "Aguarda que o administrador crie um jantar"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {dinners.map((dinner) => (
              <Link
                key={dinner.id}
                href={`/dinners/${dinner.id}`}
                className="block"
              >
                <Card className="p-4 hover:border-purple-400/50 transform hover:scale-[1.01] transition-all duration-200 active:scale-[0.98] cursor-pointer">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white/60 font-bold text-xs">
                          #{dinner.dinner_number_in_season}
                        </span>
                        <h2 className="text-lg font-bold text-white">
                          {dinner.name}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {dinner.is_extra_dinner && (
                          <div className="inline-flex items-center gap-1.5 bg-amber-500/30 text-amber-200 text-xs font-bold px-2 py-1 rounded-full border border-amber-400/30">
                            <span>🎁</span>
                            <span>EXTRA</span>
                          </div>
                        )}
                        {!dinner.is_extra_dinner && dinner.is_blind && (
                          <div className="inline-flex items-center gap-1.5 bg-purple-500/30 text-purple-200 text-xs font-bold px-2 py-1 rounded-full border border-purple-400/30">
                            <span>🎭</span>
                            <span>PROVA CEGA</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-2xl">
                      {dinner.is_completed || dinner.status === "completed"
                        ? "✅"
                        : "⏳"}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-purple-200">
                      <span className="text-base">📅</span>
                      <span className="text-sm">
                        {new Date(dinner.event_date).toLocaleDateString(
                          "pt-PT",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {dinner.location && (
                      <div className="flex items-center gap-2 text-purple-200">
                        <span className="text-base">📍</span>
                        <span className="text-sm">{dinner.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span
                      className={`text-xs font-semibold ${
                        dinner.status === "completed" || dinner.is_completed
                          ? "text-green-400"
                          : dinner.status === "active"
                          ? "text-green-300"
                          : dinner.status === "ended" || dinner.status === "revealing"
                          ? "text-amber-400"
                          : "text-blue-300"
                      }`}
                    >
                      {dinner.status === "completed" || dinner.is_completed
                        ? "Concluído"
                        : dinner.status === "active"
                        ? "🎭 Prova em Curso"
                        : dinner.status === "ended"
                        ? "A Revelar"
                        : dinner.status === "revealing"
                        ? "🎭 A Revelar"
                        : "Agendado"}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
