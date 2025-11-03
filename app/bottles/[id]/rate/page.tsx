"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";

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
  tasting_notes: string;
}

export default function RateBottlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [score, setScore] = useState(5);
  const [tastingNotes, setTastingNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingRating, setExistingRating] = useState<ExistingRating | null>(
    null
  );

  useEffect(() => {
    fetchBottleAndRating();
  }, [id]);

  async function fetchBottleAndRating() {
    try {
      const bottleResponse = await fetch(`/api/bottles/${id}`);
      const bottleData = await bottleResponse.json();

      if (bottleData.success) {
        setBottle(bottleData.bottle);
      }

      const token = localStorage.getItem("token");
      if (token) {
        const ratingsResponse = await fetch(`/api/bottles/${id}/ratings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const ratingsData = await ratingsResponse.json();

        if (ratingsData.success && ratingsData.ratings) {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            const myRating = ratingsData.ratings.find(
              (r: { user_id: string; score: number; tasting_notes?: string }) =>
                r.user_id === user.id
            );

            if (myRating) {
              setExistingRating(myRating);
              setScore(myRating.score);
              setTastingNotes(myRating.tasting_notes || "");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function submitRating() {
    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      const response = await fetch(`/api/bottles/${id}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score,
          tasting_notes: tastingNotes || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/dinners/${bottle?.dinner.id}`);
      } else {
        setError(data.error || "Failed to submit rating");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🍷</div>
          <div className="text-white text-xl">Loading wine...</div>
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

  const isBlindMode = bottle.dinner.status === "active";

  const scoreLabels = [
    "",
    "Poor",
    "Fair",
    "Decent",
    "Good",
    "Very Good",
    "Great",
    "Excellent",
    "Outstanding",
    "Exceptional",
    "Perfect",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white flex items-center gap-2 text-lg"
          >
            <span>←</span>
            <span className="font-semibold">Voltar</span>
          </button>
          <div className="text-white text-2xl">⭐</div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        {existingRating && (
          <div className="bg-amber-500/20 backdrop-blur-sm rounded-3xl p-4 mb-6 border border-amber-400/30">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✏️</span>
              <div>
                <p className="text-white font-semibold">Editing Your Rating</p>
                <p className="text-amber-200 text-sm">
                  You already rated this wine. Update your score below.
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
                <span>BLIND TASTING</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Mystery Wine
              </h1>
              <p className="text-purple-200 text-lg">
                Wine details are hidden. Rate based on taste, aroma, and finish!
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
            {existingRating ? "Update Your Rating" : "Your Rating"}
          </h2>
          <p className="text-purple-200 text-center mb-8">
            Slide to rate this wine
          </p>

          <div className="text-center mb-8">
            <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
              {score}
            </div>
            <div className="text-2xl font-semibold text-amber-400">
              {scoreLabels[score]}
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
            <div className="flex justify-between mt-2 px-1">
              <span className="text-white/60 text-xs">1</span>
              <span className="text-white/60 text-xs">5.5</span>
              <span className="text-white/60 text-xs">10</span>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-white font-semibold mb-3">
              Tasting Notes (Optional)
            </label>
            <textarea
              value={tastingNotes}
              onChange={(e) => setTastingNotes(e.target.value)}
              placeholder="What flavors do you taste? How's the finish? Any standout characteristics?"
              rows={4}
              className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-4 text-red-200 text-center">
              {error}
            </div>
          )}

          <button
            onClick={submitRating}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center px-6 py-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span>Submitting...</span>
            ) : existingRating ? (
              <span>Update Rating ⭐</span>
            ) : (
              <span>Submit Rating ⭐</span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
