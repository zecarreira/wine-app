"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Rating {
  id: string;
  score: number;
  tasting_notes: string;
  created_at: string;
  user: {
    id: string;
    name: string;
  };
}

interface Bottle {
  id: string;
  name: string;
  description: string;
  vintage: number;
  producer: string;
  wine_type: string;
  position: number;
  photo_url: string;
  dinner: {
    id: string;
    name: string;
    event_date: string;
    location: string;
    is_blind: boolean;
    status: string;
    host: {
      id: string;
      name: string;
    };
  };
  brought_by_user: {
    id: string;
    name: string;
  };
  ratings: Rating[];
  stats: {
    total_ratings: number;
    average_score: string;
  };
}

export default function BottleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [bottle, setBottle] = useState<BottleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBottle();
  }, [id]);

  async function fetchBottle() {
    try {
      const response = await fetch(`/api/bottles/${id}`);
      const data = await response.json();

      if (data.success) {
        setBottle(data.bottle);
      }
    } catch (error) {
      console.error("Error fetching bottle:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🍷</div>
          <div className="text-white text-xl">Loading bottle...</div>
        </div>
      </div>
    );
  }

  if (!bottle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-white text-xl">Bottle not found</div>
        </div>
      </div>
    );
  }

  const sortedRatings = [...bottle.ratings].sort((a, b) => b.score - a.score);

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

      <main className="container mx-auto px-4 py-8 pb-24 max-w-4xl">
        {/* Photo + Main Info Card */}
        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Photo */}
            <div>
              {bottle.photo_url ? (
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black/20">
                  <Image
                    src={bottle.photo_url}
                    alt={bottle.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[3/4] rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border-2 border-white/10">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🍷</div>
                    <div className="text-white/60">No photo</div>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  {bottle.name}
                </h1>

                <div className="space-y-3 text-purple-200 mb-6">
                  {bottle.producer && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏛️</span>
                      <div>
                        <div className="text-white/60 text-xs">Producer</div>
                        <div className="font-semibold text-lg">
                          {bottle.producer}
                        </div>
                      </div>
                    </div>
                  )}

                  {bottle.vintage && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📅</span>
                      <div>
                        <div className="text-white/60 text-xs">Vintage</div>
                        <div className="font-semibold text-lg">
                          {bottle.vintage}
                        </div>
                      </div>
                    </div>
                  )}

                  {bottle.wine_type && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍷</span>
                      <div>
                        <div className="text-white/60 text-xs">Type</div>
                        <div className="font-semibold text-lg capitalize">
                          {bottle.wine_type}
                        </div>
                      </div>
                    </div>
                  )}

                  {bottle.brought_by_user && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <div className="text-white/60 text-xs">Brought By</div>
                        <div className="font-semibold text-lg">
                          {bottle.brought_by_user.name}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {bottle.description && (
                  <div className="bg-white/5 rounded-2xl p-4 mb-6">
                    <p className="text-white/80 italic leading-relaxed">
                      "{bottle.description}"
                    </p>
                  </div>
                )}
              </div>

              {/* Stats */}
              {bottle.stats.total_ratings > 0 && (
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-400/30">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-amber-400 mb-2">
                      {bottle.stats.average_score}
                    </div>
                    <div className="text-white/80 text-sm">Average Score</div>
                    <div className="text-white/60 text-xs mt-1">
                      {bottle.stats.total_ratings} rating
                      {bottle.stats.total_ratings !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dinner Info */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🍽️</span>
            <div>
              <div className="text-white/60 text-sm">Served At</div>
              <h2 className="text-2xl font-bold text-white">
                {bottle.dinner.name}
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-purple-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <div className="text-white/60 text-xs">Date</div>
                <div className="font-semibold">
                  {new Date(bottle.dinner.event_date).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </div>
              </div>
            </div>

            {bottle.dinner.location && (
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <div>
                  <div className="text-white/60 text-xs">Location</div>
                  <div className="font-semibold">{bottle.dinner.location}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xl">👑</span>
              <div>
                <div className="text-white/60 text-xs">Host</div>
                <div className="font-semibold">{bottle.dinner.host.name}</div>
              </div>
            </div>
          </div>

          <Link
            href={`/dinners/${bottle.dinner.id}`}
            className="mt-4 block w-full text-center bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            View Full Dinner →
          </Link>
        </div>

        {/* Ratings */}
        {bottle.ratings.length > 0 ? (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">⭐</span>
              <h2 className="text-2xl font-bold text-white">
                Ratings ({bottle.ratings.length})
              </h2>
            </div>

            <div className="space-y-4">
              {sortedRatings.map((rating, index) => (
                <div
                  key={rating.id}
                  className="bg-white/5 rounded-2xl p-5 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {index === 0 && bottle.ratings.length > 1 && (
                        <span className="text-2xl">🥇</span>
                      )}
                      {index === 1 && bottle.ratings.length > 2 && (
                        <span className="text-2xl">🥈</span>
                      )}
                      {index === 2 && bottle.ratings.length > 3 && (
                        <span className="text-2xl">🥉</span>
                      )}
                      <div>
                        <div className="text-white font-semibold text-lg">
                          {rating.user.name}
                        </div>
                        <div className="text-white/40 text-xs">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-amber-400">
                      {rating.score}
                    </div>
                  </div>

                  {rating.tasting_notes && (
                    <div className="bg-white/5 rounded-xl p-3 mt-3">
                      <p className="text-white/80 text-sm italic">
                        "{rating.tasting_notes}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/10">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-white/60 text-lg">No ratings yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
