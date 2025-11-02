"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  stats: {
    total_dinners: number;
    total_ratings: number;
    total_bottles_brought: number;
    average_rating: string;
  };
  favorite_wine: any;
  recent_ratings: any[];
  bottles_brought: any[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/login");
        return;
      }

      const currentUser = JSON.parse(userStr);

      const response = await fetch(`/api/users/${currentUser.id}`);
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">👤</div>
          <div className="text-white text-xl">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-white text-xl">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/dinners"
            className="text-white/80 hover:text-white flex items-center gap-2 text-lg"
          >
            <span>←</span>
            <span className="font-semibold">Back</span>
          </Link>
          <div className="text-white text-2xl">👤</div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-3xl p-8 mb-6 border border-white/20 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-5xl font-bold text-white flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-1">
                {user.name}
              </h1>
              <p className="text-purple-200 mb-3">{user.email}</p>
              <div className="mb-4">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                    user.role === "admin"
                      ? "bg-red-500/30 text-red-200 border border-red-400/30"
                      : user.role === "founder"
                      ? "bg-amber-500/30 text-amber-200 border border-amber-400/30"
                      : "bg-blue-500/30 text-blue-200 border border-blue-400/30"
                  }`}
                >
                  {user.role === "admin"
                    ? "👑 Admin"
                    : user.role === "founder"
                    ? "🍷 Founder"
                    : "👤 Guest"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                  <span>Backend</span>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">🍽️</div>
              <div className="text-2xl font-bold text-white">
                {user.stats.total_dinners}
              </div>
              <div className="text-white/60 text-sm">Dinners</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-white">
                {user.stats.total_ratings}
              </div>
              <div className="text-white/60 text-sm">Ratings</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">🍷</div>
              <div className="text-2xl font-bold text-white">
                {user.stats.total_bottles_brought}
              </div>
              <div className="text-white/60 text-sm">Bottles</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold text-white">
                {user.stats.average_rating || "N/A"}
              </div>
              <div className="text-white/60 text-sm">Avg Rating</div>
            </div>
          </div>
          <div className="flex justify-center mt-[1cm]">
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-xl font-semibold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Favorite Wine */}
        {user.favorite_wine && (
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border-2 border-amber-400/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⭐</span>
              <h2 className="text-2xl font-bold text-white">
                Your Favorite Wine
              </h2>
            </div>

            <Link
              href={`/bottles/${user.favorite_wine.bottle.id}`}
              className="block bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {user.favorite_wine.bottle.name}
                  </h3>
                  {user.favorite_wine.bottle.producer && (
                    <p className="text-purple-200 text-sm">
                      {user.favorite_wine.bottle.producer}
                    </p>
                  )}
                  <p className="text-white/60 text-xs mt-2">
                    From: {user.favorite_wine.bottle.dinner.name}
                  </p>
                </div>
                <div className="text-4xl font-bold text-amber-400">
                  {user.favorite_wine.score}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Recent Ratings */}
        {user.recent_ratings.length > 0 && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📝</span>
              <h2 className="text-2xl font-bold text-white">Recent Ratings</h2>
            </div>

            <div className="space-y-3">
              {user.recent_ratings.map((rating) => (
                <Link
                  key={rating.id}
                  href={`/bottles/${rating.bottle.id}`}
                  className="block bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {rating.bottle.name}
                    </h3>
                    <div className="text-2xl font-bold text-amber-400">
                      {rating.score}
                    </div>
                  </div>
                  <p className="text-white/60 text-sm">
                    {rating.bottle.dinner.name} •{" "}
                    {new Date(rating.created_at).toLocaleDateString()}
                  </p>
                  {rating.tasting_notes && (
                    <p className="text-white/70 text-sm mt-2 italic">
                      "{rating.tasting_notes.substring(0, 100)}
                      {rating.tasting_notes.length > 100 ? "..." : ""}"
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottles Brought */}
        {user.bottles_brought.length > 0 && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🍾</span>
              <h2 className="text-2xl font-bold text-white">
                Bottles You Brought
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.bottles_brought.map((bottle) => (
                <Link
                  key={bottle.id}
                  href={`/bottles/${bottle.id}`}
                  className="block bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex gap-3">
                    {bottle.photo_url && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={bottle.photo_url}
                          alt={bottle.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {bottle.name}
                      </h3>
                      {bottle.producer && (
                        <p className="text-purple-200 text-sm">
                          {bottle.producer}
                        </p>
                      )}
                      <p className="text-white/60 text-xs mt-1">
                        {bottle.dinner.name}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
