"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ToastProvider";

interface RevealedBottle {
  id: string;
  name: string;
  producer: string;
  vintage: number;
  wine_type: string;
  description: string;
  photo_url: string | null;
  position: number;
  brought_by_user: {
    name: string;
  };
  ratings: Array<{
    score: number;
    user: {
      name: string;
    };
    tasting_notes: string;
  }>;
  stats: {
    total_ratings: number;
    average_score: number;
    total_points: number;
  };
}

interface RevealStatus {
  status: string;
  totalBottles: number;
  revealedCount: number;
  remainingCount: number;
  canReveal: boolean;
}

interface LastRevealedData {
  bottle: RevealedBottle;
  medal: string;
  message: string;
  isWinner: boolean;
  isComplete: boolean;
}

export default function RevealCeremonyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { error: toastError } = useToast();
  const [revealedBottles, setRevealedBottles] = useState<RevealedBottle[]>([]);
  const [revealStatus, setRevealStatus] = useState<RevealStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [lastRevealed, setLastRevealed] = useState<LastRevealedData | null>(
    null
  );

  const fetchRevealStatus = useCallback(async () => {
    try {
      const data = await apiFetch<any>(`/api/dinners/${id}/reveal-status`);
      setRevealStatus(data);
    } catch {
      console.error("Error fetching reveal status");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRevealStatus();
  }, [fetchRevealStatus]);

  // Redireciona para rankings só se já está tudo revelado no carregamento inicial
  // (quando lastRevealed está definido, o redirect é feito pelo setTimeout em handleRevealNext)
  useEffect(() => {
    if (revealStatus?.remainingCount === 0 && revealStatus && !lastRevealed) {
      router.push(`/dinners/${id}/rankings`);
    }
  }, [revealStatus, id, router, lastRevealed]);

  async function handleRevealNext() {
    setRevealing(true);
    try {
      const data = await apiFetch<any>(`/api/dinners/${id}/reveal-next`, {
        method: "POST",
      });
      setLastRevealed(data);
      setRevealedBottles([...revealedBottles, data.bottle]);
      await fetchRevealStatus();
      // isComplete: o botão "Fim Jantar" fica visível para o utilizador clicar manualmente
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao revelar garrafa");
    } finally {
      setRevealing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎭</div>
          <div className="text-white text-xl">
            A carregar cerimónia de revelação...
          </div>
        </div>
      </div>
    );
  }

  const isComplete = revealStatus?.remainingCount === 0;

  // Só mostra erro se não há nada a exibir — se lastRevealed estiver definido,
  // a última garrafa acabou de ser revelada e ainda precisa de ser vista pelo utilizador
  if (!revealStatus || (!revealStatus.canReveal && !lastRevealed)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-white text-xl mb-4">
            O jantar deve ser terminado antes de revelar
          </div>
          <button
            onClick={() => router.back()}
            className="text-purple-300 hover:text-white underline"
          >
            ←
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            aria-label="Voltar"
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </button>
          <Link href="/" aria-label="Início" className="text-white/80 hover:text-white text-2xl">
            🏠
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎭 Cerimónia de Revelação
          </h1>
          <p className="text-purple-200">
            {isComplete
              ? "Todos os vinhos revelados!"
              : `${revealStatus.remainingCount} garrafa${
                  revealStatus.remainingCount !== 1 ? "s" : ""
                } por revelar`}
          </p>
        </div>

        {lastRevealed && (
          <div className="mb-8 animate-fade-in">
            <div
              className={`bg-gradient-to-br backdrop-blur-lg rounded-3xl p-8 border-2 shadow-2xl ${
                lastRevealed.isWinner
                  ? "from-amber-500/30 to-orange-500/20 border-amber-400/50"
                  : "from-white/15 to-white/5 border-white/20"
              }`}
            >
              <div className="text-center mb-6">
                <div className="text-8xl mb-4 animate-bounce">
                  {lastRevealed.medal}
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {lastRevealed.message}
                </div>
              </div>

              <div className="bg-black/20 rounded-2xl p-6 mb-6">
                <h2 className="text-3xl font-bold text-white mb-4 text-center">
                  {lastRevealed.bottle.name}
                </h2>

                {lastRevealed.bottle.photo_url && (
                  <div className="flex justify-center mb-5">
                    <div className="relative w-40 h-56 rounded-2xl overflow-hidden shadow-2xl">
                      <Image
                        src={lastRevealed.bottle.photo_url}
                        alt={lastRevealed.bottle.name}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-purple-200 mb-4">
                  {lastRevealed.bottle.producer && (
                    <div>
                      <div className="text-white/60 text-sm">Produtor</div>
                      <div className="font-semibold">
                        {lastRevealed.bottle.producer}
                      </div>
                    </div>
                  )}
                  {lastRevealed.bottle.vintage && (
                    <div>
                      <div className="text-white/60 text-sm">Ano</div>
                      <div className="font-semibold">
                        {lastRevealed.bottle.vintage}
                      </div>
                    </div>
                  )}
                  {lastRevealed.bottle.wine_type && (
                    <div>
                      <div className="text-white/60 text-sm">Tipo</div>
                      <div className="font-semibold capitalize">
                        {lastRevealed.bottle.wine_type}
                      </div>
                    </div>
                  )}
                  {lastRevealed.bottle.brought_by_user && (
                    <div>
                      <div className="text-white/60 text-sm">Trazido Por</div>
                      <div className="font-semibold">
                        {lastRevealed.bottle.brought_by_user.name}
                      </div>
                    </div>
                  )}
                </div>

                {lastRevealed.bottle.description && (
                  <p className="text-white/80 italic text-center">
                    &quot;{lastRevealed.bottle.description}&quot;
                  </p>
                )}
              </div>

              <div className="text-center">
                <div className="text-6xl font-bold text-amber-400 mb-2">
                  {lastRevealed.bottle.stats.average_score}
                </div>
                <div className="text-white/80 mb-1">
                  Média ({lastRevealed.bottle.stats.total_ratings} classificaç
                  {lastRevealed.bottle.stats.total_ratings !== 1 ? "ões" : "ão"}
                  )
                </div>
                <div className="text-amber-300/60 text-sm">
                  📊 Total: {lastRevealed.bottle.stats.total_points} pontos
                </div>
              </div>

              {lastRevealed.bottle.ratings &&
                lastRevealed.bottle.ratings.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="text-white font-semibold text-center mb-3">
                      Classificações Individuais:
                    </div>
                    {[...lastRevealed.bottle.ratings]
                      .sort((a, b) => b.score - a.score)
                      .map((rating, index: number) => (
                        <div key={index} className="bg-white/5 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-white font-semibold">
                              {rating.user.name}
                            </span>
                            <span className="text-amber-400 font-bold text-lg">
                              {rating.score}/10
                            </span>
                          </div>
                          {rating.tasting_notes && (
                            <p className="text-white/70 text-sm italic">
                              &quot;{rating.tasting_notes}&quot;
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
            </div>
          </div>
        )}

        {isComplete ? (
          <div className="text-center">
            <Link
              href={`/dinners/${id}/rankings`}
              className="inline-block w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-6 rounded-3xl font-bold text-2xl shadow-2xl hover:shadow-amber-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow]"
            >
              🏁 Fim Jantar
            </Link>
          </div>
        ) : (
          <button
            onClick={handleRevealNext}
            disabled={revealing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-6 rounded-3xl font-bold text-2xl shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70"
          >
            {revealing ? (
              <span>A revelar...</span>
            ) : (
              <span>
                {revealStatus.remainingCount === revealStatus.totalBottles
                  ? "🎭 Começar a Revelar"
                  : "🎭 Revelar Próxima Garrafa"}
              </span>
            )}
          </button>
        )}

        {revealedBottles.length > 0 && !isComplete && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4">Já Revelados:</h3>
            <div className="space-y-3">
              {revealedBottles.map((bottle) => (
                <div
                  key={bottle.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">
                        {bottle.name}
                      </div>
                      <div className="text-purple-200 text-sm">
                        {bottle.producer}
                      </div>
                      <div className="text-white/40 text-xs mt-1">
                        📊 {bottle.stats.total_points} pontos total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-400 font-bold text-2xl">
                        {bottle.stats.average_score}
                      </div>
                      <div className="text-white/60 text-xs">média</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
