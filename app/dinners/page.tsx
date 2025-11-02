"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Dinner {
  id: string;
  name: string;
  event_date: string;
  location: string;
  is_blind: boolean;
  is_completed: boolean;
}

export default function DinnersPage() {
  const [dinners, setDinners] = useState<Dinner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDinners();
  }, []);

  async function fetchDinners() {
    try {
      const response = await fetch("/api/dinners");
      const data = await response.json();

      if (data.success) {
        setDinners(data.dinners);
      }
    } catch (error) {
      console.error("Error fetching dinners:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🍷</div>
          <div className="text-white text-xl">Loading dinners...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <Link
              href="/"
              className="text-purple-300 hover:text-white font-semibold mb-4 inline-block"
            >
              ← Regressar
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Jantares</h1>
            <p className="text-purple-200">Seleciona um jantar para começar</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-semibold transition-colors"
            >
              <span>👤</span>
              <span>Perfil</span>
            </Link>
            <Link
              href="/create-dinner"
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all"
            >
              <span className="text-xl">+</span>
              <span>Novo</span>
            </Link>
          </div>
        </div>

        {/* Header */}
        <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-white/80 hover:text-white flex items-center gap-2 text-lg"
            >
              <span>←</span>
              <span className="font-semibold">VinoRate</span>
            </Link>
            <div className="text-white text-2xl">🍷</div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 pb-20">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Wine Dinners</h1>
            <p className="text-purple-200">Select an event to start rating</p>
          </div>

          {/* Dinners Grid */}
          {dinners.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/10">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-white/60 text-lg">No dinners yet</p>
              <p className="text-white/40 text-sm mt-2">
                Create one using the API
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dinners.map((dinner) => (
                <Link
                  key={dinner.id}
                  href={`/dinners/${dinner.id}`}
                  className="block bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-purple-400/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] shadow-xl"
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {dinner.name}
                      </h2>
                      {dinner.is_blind && (
                        <div className="inline-flex items-center gap-2 bg-purple-500/30 text-purple-200 text-xs font-bold px-3 py-1 rounded-full border border-purple-400/30">
                          <span>🎭</span>
                          <span>BLIND TASTING</span>
                        </div>
                      )}
                    </div>
                    <div className="text-3xl">
                      {dinner.is_completed ? "✅" : "⏳"}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-purple-200">
                      <span className="text-xl">📅</span>
                      <span className="text-lg">
                        {new Date(dinner.event_date).toLocaleDateString(
                          "en-US",
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
                      <div className="flex items-center gap-3 text-purple-200">
                        <span className="text-xl">📍</span>
                        <span className="text-lg">{dinner.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          dinner.is_completed
                            ? "text-green-400"
                            : "text-amber-400"
                        }`}
                      >
                        {dinner.is_completed ? "Completed" : "Upcoming"}
                      </span>
                      <span className="text-white/60 text-sm">
                        Tap to view →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
