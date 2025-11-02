"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateDinnerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [isBlind, setIsBlind] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/dinners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          event_date: eventDate,
          location: location || null,
          is_blind: isBlind,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/dinners/${data.dinner.id}`);
      } else {
        setError(data.error || "Failed to create dinner");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/dinners"
            className="text-white/80 hover:text-white flex items-center gap-2 text-lg"
          >
            <span>←</span>
            <span className="font-semibold">Back</span>
          </Link>
          <div className="text-white text-2xl">🍷</div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Create New Dinner
          </h1>
          <p className="text-purple-200">Set up your wine tasting event</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dinner Name */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Dinner Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Italian Wine Night"
                required
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-lg"
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Event Date *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-purple-400 text-lg"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lisbon, Portugal"
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-lg"
              />
            </div>

            {/* Blind Tasting Toggle */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-white font-semibold mb-1">
                    🎭 Blind Tasting Mode
                  </div>
                  <div className="text-purple-200 text-sm">
                    Hide wine names during rating
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isBlind}
                  onChange={(e) => setIsBlind(e.target.checked)}
                  className="w-6 h-6"
                />
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-4 text-red-200 text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Dinner 🍽️"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
