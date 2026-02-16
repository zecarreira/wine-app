"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";

interface Rating {
  score: number;
  tasting_notes: string;
  user: {
    name: string;
  };
}

interface BottleWithRatings {
  id: string;
  name: string;
  producer: string;
  vintage: number;
  wine_type: string;
  position: number;
  ratings: Rating[];
  stats: {
    total_ratings: number;
    average_score: number;
    total_points: number;
    highest_rating: number;
  };
}

export default function RankingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [rankings, setRankings] = useState<BottleWithRatings[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = useCallback(async () => {
    try {
      const response = await fetch(`/api/dinners/${id}/ratings`);
      const data = await response.json();

      if (data.success) {
        setRankings(data.rankings ?? []);
      }
    } catch {
      console.error("Error fetching rankings");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🏆</div>
          <div className="text-white text-xl">A carregar os rankings...</div>
        </div>
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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

      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Rankings Finais
          </h1>
          <p className="text-purple-200">Organizado por média</p>
        </div>

        {/* Rankings List */}
        {rankings.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/10">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-white/60 text-lg">Sem ranking ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rankings.map((bottle, index) => (
              <div
                key={bottle.id}
                className={`bg-gradient-to-br backdrop-blur-lg rounded-3xl p-6 border shadow-xl ${
                  index === 0
                    ? "from-amber-500/20 to-orange-500/10 border-amber-400/30"
                    : "from-white/10 to-white/5 border-white/20"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Medal or Position */}
                    <div className="text-5xl">
                      {index < 3 ? medals[index] : `#${index + 1}`}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {bottle.name}
                      </h2>
                      <div className="text-purple-200 text-sm space-y-0.5">
                        {bottle.producer && <div>🏛️ {bottle.producer}</div>}
                        {bottle.vintage && <div>📅 {bottle.vintage}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-4xl font-bold text-amber-400">
                      {bottle.stats.average_score}
                    </div>
                    <div className="text-xs text-white/60">
                      {bottle.stats.total_ratings} classificaç
                      {bottle.stats.total_ratings !== 1 ? "ões" : "ão"}
                    </div>
                    <div className="text-amber-300/50 text-xs mt-1">
                      📊 {bottle.stats.total_points} pts
                    </div>
                    <div className="text-amber-300/40 text-xs">
                      ⭐ Max: {bottle.stats.highest_rating}
                    </div>
                  </div>
                </div>

                {/* Individual Ratings */}
                {bottle.ratings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    {bottle.ratings.map((rating, rIndex) => (
                      <div key={rIndex} className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
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
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Winner Announcement */}
        {rankings.length > 0 && rankings[0].stats.total_ratings > 0 && (
          <div className="mt-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-lg rounded-3xl p-8 border-2 border-amber-400/30 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Vencedor: {rankings[0].name}
            </h2>
            <p className="text-amber-400 text-xl font-semibold mb-1">
              Média: {rankings[0].stats.average_score}/10
            </p>
            <p className="text-amber-300/60 text-sm">
              📊 Total: {rankings[0].stats.total_points} pontos • ⭐ Nota Mais
              Alta: {rankings[0].stats.highest_rating}/10
            </p>
            <p className="text-white/40 text-xs mt-3">
              Tiebreaker rules: 1. Média → 2. Total de pontos → 3. Nota mais
              alta
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
