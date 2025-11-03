"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RevealedBottle {
  id: string;
  name: string;
  producer: string;
  vintage: number;
  wine_type: string;
  description: string;
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
  const [revealedBottles, setRevealedBottles] = useState<RevealedBottle[]>([]);
  const [revealStatus, setRevealStatus] = useState<RevealStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [lastRevealed, setLastRevealed] = useState<LastRevealedData | null>(
    null
  );

  const fetchRevealStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/dinners/${id}/reveal-status`);
      const data = await response.json();

      if (data.success) {
        setRevealStatus(data);
      }
    } catch {
      console.error("Error fetching reveal status");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRevealStatus();
  }, [fetchRevealStatus]);

  // Se já está tudo revelado, redireciona para rankings
  useEffect(() => {
    if (revealStatus?.remainingCount === 0 && revealStatus) {
      router.push(`/dinners/${id}/rankings`);
    }
  }, [revealStatus, id, router]);

  async function handleRevealNext() {
    setRevealing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/dinners/${id}/reveal-next`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setLastRevealed(data);
        setRevealedBottles([...revealedBottles, data.bottle]);

        await fetchRevealStatus();

        if (data.isComplete) {
          setTimeout(() => {
            router.push(`/dinners/${id}/rankings`);
          }, 3000);
        }
      } else {
        alert(data.error || "Failed to reveal");
      }
    } catch {
      alert("Error revealing bottle");
    } finally {
      setRevealing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎭</div>
          <div className="text-white text-xl">Loading reveal ceremony...</div>
        </div>
      </div>
    );
  }

  const isComplete = revealStatus?.remainingCount === 0;

  if (!revealStatus || !revealStatus.canReveal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-white text-xl mb-4">
            Dinner must be ended before revealing
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
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </button>
          <Link href="/" className="text-white/80 hover:text-white text-2xl">
            �
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎭 Reveal Ceremony
          </h1>
          <p className="text-purple-200">
            {isComplete
              ? "All wines revealed!"
              : `${revealStatus.remainingCount} bottle${
                  revealStatus.remainingCount !== 1 ? "s" : ""
                } remaining`}
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

                <div className="grid grid-cols-2 gap-4 text-purple-200 mb-4">
                  {lastRevealed.bottle.producer && (
                    <div>
                      <div className="text-white/60 text-sm">Producer</div>
                      <div className="font-semibold">
                        {lastRevealed.bottle.producer}
                      </div>
                    </div>
                  )}
                  {lastRevealed.bottle.vintage && (
                    <div>
                      <div className="text-white/60 text-sm">Vintage</div>
                      <div className="font-semibold">
                        {lastRevealed.bottle.vintage}
                      </div>
                    </div>
                  )}
                  {lastRevealed.bottle.wine_type && (
                    <div>
                      <div className="text-white/60 text-sm">Type</div>
                      <div className="font-semibold capitalize">
                        {lastRevealed.bottle.wine_type}
                      </div>
                    </div>
                  )}
                  {lastRevealed.bottle.brought_by_user && (
                    <div>
                      <div className="text-white/60 text-sm">Brought By</div>
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
                  Average Score ({lastRevealed.bottle.stats.total_ratings}{" "}
                  rating
                  {lastRevealed.bottle.stats.total_ratings !== 1 ? "s" : ""})
                </div>
                <div className="text-amber-300/60 text-sm">
                  📊 Total: {lastRevealed.bottle.stats.total_points} points
                </div>
              </div>

              {lastRevealed.bottle.ratings &&
                lastRevealed.bottle.ratings.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="text-white font-semibold text-center mb-3">
                      Individual Ratings:
                    </div>
                    {lastRevealed.bottle.ratings.map(
                      (rating, index: number) => (
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
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-lg rounded-3xl p-8 border-2 border-amber-400/30 mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                All Bottles Revealed!
              </h2>
              <p className="text-purple-200">
                Redirecting to final rankings...
              </p>
            </div>
            <Link
              href={`/dinners/${id}/rankings`}
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-amber-500/50 transform hover:scale-[1.02] transition-all"
            >
              View Final Rankings 🏆
            </Link>
          </div>
        ) : (
          <button
            onClick={handleRevealNext}
            disabled={revealing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-6 rounded-3xl font-bold text-2xl shadow-2xl hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {revealing ? (
              <span>Revealing...</span>
            ) : (
              <span>
                {revealStatus.remainingCount === revealStatus.totalBottles
                  ? "🎭 Start Revealing"
                  : "🎭 Reveal Next Bottle"}
              </span>
            )}
          </button>
        )}

        {revealedBottles.length > 0 && !isComplete && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Already Revealed:
            </h3>
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
                        📊 {bottle.stats.total_points} points total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-400 font-bold text-2xl">
                        {bottle.stats.average_score}
                      </div>
                      <div className="text-white/60 text-xs">avg</div>
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
