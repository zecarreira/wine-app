"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Founder {
  id: string;
  name: string;
  email: string;
}

export default function CreateDinnerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [isBlind, setIsBlind] = useState(true);
  const [organizerId, setOrganizerId] = useState("");
  const [availableFounders, setAvailableFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFounders, setLoadingFounders] = useState(true);
  const [error, setError] = useState("");

  // Fetch available founders on mount
  useEffect(() => {
    async function fetchFounders() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          "/api/seasons/active/available-organizers",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setAvailableFounders(data.founders);
        } else {
          setError(data.error || "Failed to load founders");
        }
      } catch (err) {
        setError("Failed to load founders");
      } finally {
        setLoadingFounders(false);
      }
    }

    fetchFounders();
  }, [router]);

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
          organizer_id: organizerId,
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
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
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

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🍽️</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Criar Novo Jantar
          </h1>
          <p className="text-purple-200 text-sm">
            Configura o teu evento de prova de vinhos
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dinner Name */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Nome do Jantar *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Noite de Vinhos Italianos"
                required
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-base"
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Data do Evento *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full max-w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-400 text-base scheme-dark"
                style={{ colorScheme: "dark" }}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Localização (Opcional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lisboa, Portugal"
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-base"
              />
            </div>

            {/* Organizer Selection */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Organizador *
              </label>
              {loadingFounders ? (
                <div className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 text-white/60 text-base">
                  A carregar founders...
                </div>
              ) : availableFounders.length === 0 ? (
                <div className="w-full bg-red-500/20 border-2 border-red-500/50 rounded-2xl px-4 py-2.5 text-red-200 text-sm">
                  ⚠️ Todos os founders já organizaram um jantar nesta temporada
                </div>
              ) : (
                <select
                  value={organizerId}
                  onChange={(e) => setOrganizerId(e.target.value)}
                  required
                  className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-400 text-base"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="" className="bg-slate-800">
                    Seleciona quem organiza...
                  </option>
                  {availableFounders.map((founder) => (
                    <option
                      key={founder.id}
                      value={founder.id}
                      className="bg-slate-800"
                    >
                      {founder.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-purple-200 text-xs mt-2">
                Cada founder só pode organizar 1 jantar por temporada
              </p>
            </div>

            {/* Blind Tasting Toggle */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-white font-semibold mb-1 text-sm">
                    🎭 Modo Prova Cega
                  </div>
                  <div className="text-purple-200 text-xs">
                    Esconde os nomes dos vinhos durante a avaliação
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
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-3 text-red-200 text-center text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white px-5 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "A criar..." : "Criar Jantar 🍽️"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
