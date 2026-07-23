"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch, ApiError } from "@/lib/api-client";

const SCORE_LABELS = [
  "Não é vinho 💀",
  "É assim tão mau?",
  "Pobre",
  "Ninguém dá 3",
  "Zurrapa do Mi",
  "Zurrapa do Zé",
  "Assim Assim",
  "Já se bebe",
  "Oláá.. é qualquer coisa",
  "Pomada",
  "Casava-me com este vinho",
] as const;

interface Bottle {
  id: string;
  name: string;
  description: string;
  vintage: number;
  producer: string;
  wine_type: string;
  position: number;
  dinner: {
    id: string;
    name: string;
    is_blind: boolean;
    status: string;
  };
}

interface ExistingRating {
  id: string;
  score: number;
  tasting_notes?: string;
}

export default function RateBottlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [score, setScore] = useState(5);
  const [tastingNotes, setTastingNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingRating, setExistingRating] = useState<ExistingRating | null>(
    null
  );

  async function fetchBottleAndRating() {
    try {
      const bottleData = await apiFetch<{ success: boolean; bottle: Bottle }>(
        `/api/bottles/${id}`
      );
      setBottle(bottleData.bottle);

      try {
        const ratingsData = await apiFetch<{
          success: boolean;
          ratings: Array<{
            user_id: string;
            score: number;
            tasting_notes?: string;
            id: string;
          }>;
        }>(`/api/bottles/${id}/ratings`);

        if (ratingsData.ratings && authUser) {
          const myRating = ratingsData.ratings.find(
            (r) => r.user_id === authUser.id
          );
          if (myRating) {
            setExistingRating(myRating);
            setScore(myRating.score);
            setTastingNotes(myRating.tasting_notes || "");
          }
        }
      } catch {
        /* ratings optional if unauthenticated */
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBottleAndRating();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authUser?.id]);

  async function submitRating() {
    setSubmitting(true);
    setError("");

    try {
      if (!authUser) {
        setError("Por favor faz login primeiro");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      await apiFetch(`/api/bottles/${id}/ratings`, {
        method: "POST",
        body: {
          score,
          tasting_notes: tastingNotes || null,
        },
      });
      router.push(`/dinners/${bottle?.dinner.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Erro de conexão. Tenta novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 motion-safe:animate-spin" aria-hidden="true">🍷</div>
          <div role="status" className="text-white text-xl">A carregar vinho…</div>
        </div>
      </div>
    );
  }

  if (!bottle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-white text-xl">Garrafa não encontrada</div>
        </div>
      </div>
    );
  }

  const isBlindMode = bottle.dinner.status === "active";


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button type="button"
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

      <main className="container mx-auto px-4 py-6 pb-24">
        {existingRating && (
          <div className="bg-amber-500/20 backdrop-blur-sm rounded-3xl p-4 mb-6 border border-amber-400/30">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✏️</span>
              <div>
                <p className="text-white font-semibold">
                  A Editar a Tua Classificação
                </p>
                <p className="text-amber-200 text-sm">
                  Já classificaste este vinho. Atualiza a tua pontuação abaixo.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white/20 shadow-2xl">
          {isBlindMode ? (
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/30 text-purple-200 text-xs font-bold px-3 py-1.5 rounded-full border border-purple-400/30 mb-4">
                <span>🎭</span>
                <span>PROVA CEGA</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Vinho Mistério
              </h1>
              <p className="text-purple-200 text-lg">
                Os detalhes do vinho estão escondidos. Classifica com base no
                sabor, aroma e final!
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-white mb-4">
                {bottle.name}
              </h1>
              <div className="space-y-2 text-purple-200">
                {bottle.producer && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏛️</span>
                    <span>{bottle.producer}</span>
                  </div>
                )}
                {bottle.vintage && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <span>{bottle.vintage}</span>
                  </div>
                )}
                {bottle.wine_type && (
                  <div className="flex items-center gap-2 capitalize">
                    <span className="text-lg">🍷</span>
                    <span>{bottle.wine_type}</span>
                  </div>
                )}
              </div>
              {bottle.description && (
                <p className="text-white/80 mt-4 italic leading-relaxed">
                  &quot{bottle.description}&quot;
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            {existingRating
              ? "Atualiza a Tua Classificação"
              : "A Tua Classificação"}
          </h2>
          <p className="text-purple-200 text-center mb-8">
            Desliza para classificar este vinho (1–10)
          </p>

          <div className="text-center mb-8">
            <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
              {score}
            </div>
            <div className="text-2xl font-semibold text-amber-400">
              {SCORE_LABELS[Math.round(score)]}
            </div>
          </div>

          {/* Slider */}
          <div className="mb-8">
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={score}
              aria-label="Classificação"
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-8
                [&::-webkit-slider-thumb]:h-8
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gradient-to-r
                [&::-webkit-slider-thumb]:from-amber-400
                [&::-webkit-slider-thumb]:to-orange-500
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-8
                [&::-moz-range-thumb]:h-8
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-gradient-to-r
                [&::-moz-range-thumb]:from-amber-400
                [&::-moz-range-thumb]:to-orange-500
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between mt-2">
              <span className="text-white/60 text-xs">1</span>
              <span className="text-white/60 text-xs">5</span>
              <span className="text-white/60 text-xs">10</span>
            </div>
          </div>

          <div className="mb-8">
            <label htmlFor="tasting-notes" className="block text-white font-semibold mb-3">
              Notas (Opcional)
            </label>
            <textarea
              id="tasting-notes"
              value={tastingNotes}
              onChange={(e) => setTastingNotes(e.target.value)}
              placeholder="Que sabores sentes? Como é o final? Características marcantes?"
              rows={4}
              className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 resize-none"
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-4 text-red-200 text-center">
              {error}
            </div>
          )}

          <button type="button"
            onClick={submitRating}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center px-6 py-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70"
          >
            {submitting ? (
              <span>A submeter...</span>
            ) : existingRating ? (
              <span>Atualizar Classificação ⭐</span>
            ) : (
              <span>Submeter Classificação ⭐</span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
