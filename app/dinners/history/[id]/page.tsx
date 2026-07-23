"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/Card";
import { useToast } from "@/components/ToastProvider";
import { apiFetch } from "@/lib/api-client";

interface Dinner {
  id: string;
  name: string;
  event_date: string;
  location: string;
  is_blind: boolean;
  is_extra_dinner: boolean;
  dinner_number_in_season: number;
}

interface SeasonDetails {
  id: string;
  season_number: number;
  status: string;
  start_date: string;
  end_date: string | null;
  dinners: Dinner[];
}

export default function SeasonDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [season, setSeason] = useState<SeasonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSeason();
  }, [params.id]);

  async function fetchSeason() {
    try {
      const data = await apiFetch<{ success: boolean; season: SeasonDetails }>(
        `/api/seasons/${params.id}`
      );
      setSeason(data.season);
    } catch (error) {
      console.error("Error fetching season:", error);
      showToast("Erro ao carregar temporada", "error");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
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
              �
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="text-white/60 text-center py-12" role="status">A carregar...</div>
        </div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
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
              �
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-white/60 text-lg">Temporada não encontrada</p>
          </Card>
        </div>
      </div>
    );
  }

  const regularDinners = season.dinners.filter((d) => !d.is_extra_dinner);
  const extraDinner = season.dinners.find((d) => d.is_extra_dinner);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </button>
          <Link href="/" className="text-white/80 hover:text-white text-2xl">
            �
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Temporada {season.season_number}
          </h1>
          <div className="flex items-center gap-4 text-purple-200">
            <span>
              📅{" "}
              {new Date(season.start_date).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {season.end_date && (
                <>
                  {" - "}
                  {new Date(season.end_date).toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </>
              )}
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-200 rounded-full text-sm font-semibold">
              ✅ Concluída
            </span>
          </div>
        </div>

        {/* Regular Dinners */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Jantares ({regularDinners.length}/7)
          </h2>
          <div className="space-y-3">
            {regularDinners.map((dinner) => (
              <Link
                key={dinner.id}
                href={`/dinners/${dinner.id}`}
                className="block"
              >
                <Card className="p-5 hover:border-purple-400/50 transform hover:scale-[1.01] transition-[colors,transform] cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white/60 font-bold text-sm shrink-0">
                          #{dinner.dinner_number_in_season}
                        </span>
                        <h3 className="text-xl font-semibold text-white">
                          {dinner.name}
                        </h3>
                        {dinner.is_blind && (
                          <span className="shrink-0 bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full text-xs font-semibold">
                            🎭 Prova Cega
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-purple-200 text-sm">
                        <span>
                          📅{" "}
                          {new Date(dinner.event_date).toLocaleDateString(
                            "pt-PT"
                          )}
                        </span>
                        {dinner.location && <span>📍 {dinner.location}</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Extra Dinner */}
        {extraDinner && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Jantar Extra 🎁
            </h2>
            <Link href={`/dinners/${extraDinner.id}`} className="block">
              <Card className="p-5 hover:border-amber-400/50 transform hover:scale-[1.01] transition-[colors,transform] cursor-pointer border-amber-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white/60 font-bold text-sm">
                        #{extraDinner.dinner_number_in_season}
                      </span>
                      <h3 className="text-xl font-semibold text-white">
                        {extraDinner.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-purple-200 text-sm">
                      <span>
                        📅{" "}
                        {new Date(extraDinner.event_date).toLocaleDateString(
                          "pt-PT"
                        )}
                      </span>
                      {extraDinner.location && (
                        <span>📍 {extraDinner.location}</span>
                      )}
                      <span className="bg-amber-500/30 text-amber-200 px-2 py-1 rounded-full text-xs font-semibold">
                        🎁 Extra
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
