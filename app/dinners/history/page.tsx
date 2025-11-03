"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Card from "@/components/Card";
import { useToast } from "@/components/ToastProvider";

interface Season {
  id: string;
  season_number: number;
  status: string;
  start_date: string;
  end_date: string | null;
  total_dinners: number;
  regular_dinners: number;
  extra_dinners: number;
}

export default function DinnersHistoryPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSeasons();
  }, []);

  async function fetchSeasons() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/seasons", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Filter out active season (show only completed)
        const completedSeasons = data.seasons.filter(
          (s: Season) => s.status === "completed"
        );
        setSeasons(completedSeasons);
      }
    } catch (error) {
      console.error("Error fetching seasons:", error);
      showToast("Erro ao carregar histórico", "error");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header useBackButton backText="Voltar" />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-6">
            Histórico de Temporadas
          </h1>
          <div className="text-white/60 text-center py-12">A carregar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header useBackButton backText="Voltar" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Histórico de Temporadas
          </h1>
          <p className="text-purple-200">
            Todas as temporadas anteriores concluídas
          </p>
        </div>

        {seasons.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-white/60 text-lg mb-2">
              Ainda não há temporadas concluídas
            </p>
            <p className="text-white/40 text-sm">
              As temporadas fechadas aparecerão aqui
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {seasons.map((season) => (
              <Link
                key={season.id}
                href={`/dinners/history/${season.id}`}
                className="block"
              >
                <Card className="p-6 hover:border-purple-400/50 transform hover:scale-[1.01] transition-all duration-200 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Temporada {season.season_number}
                      </h2>
                      <div className="flex items-center gap-4 text-purple-200">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🍽️</span>
                          <span>
                            {season.regular_dinners} jantares
                            {season.extra_dinners > 0 && " + 1 extra"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📅</span>
                          <span>
                            {new Date(season.start_date).toLocaleDateString(
                              "pt-PT",
                              {
                                month: "short",
                                year: "numeric",
                              }
                            )}
                            {season.end_date && (
                              <>
                                {" - "}
                                {new Date(season.end_date).toLocaleDateString(
                                  "pt-PT",
                                  {
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-amber-400">
                          {season.total_dinners}
                        </div>
                        <div className="text-white/60 text-xs">jantares</div>
                      </div>
                      <div className="text-2xl">✅</div>
                    </div>
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
