"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Founder {
  id: string;
  name: string;
  email: string;
}

export default function CreateDinnerPage() {
  const router = useRouter();
  const { error: toastError } = useToast();
  const { user: authUser, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [isBlind, setIsBlind] = useState(true);
  const [organizerId, setOrganizerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    data: availableFounders = [],
    isLoading: loadingFounders,
    error: foundersError,
  } = useQuery({
    queryKey: ["seasons", "active", "available-organizers"],
    queryFn: async () => {
      const data = await apiFetch<{
        success: boolean;
        founders: Founder[];
        error?: string;
      }>("/api/seasons/active/available-organizers");
      return data.founders;
    },
    enabled: !!authUser && !authLoading,
  });

  // Surface query errors (except 401 which shows login CTA)
  const foundersQueryError =
    foundersError instanceof ApiError && foundersError.status !== 401
      ? foundersError.message
      : foundersError && !(foundersError instanceof ApiError)
        ? "Erro ao carregar fundadores"
        : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<{
        success: boolean;
        dinner: { id: string };
      }>("/api/dinners", {
        method: "POST",
        body: {
          name,
          event_date: eventDate,
          location: location || null,
          is_blind: isBlind,
          ...(organizerId ? { organizer_id: organizerId } : {}),
        },
      });
      router.push(`/dinners/${data.dinner.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toastError("Por favor faz login primeiro");
        setError("Por favor faz login primeiro");
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "Erro de conexão. Tenta novamente."
      );
    } finally {
      setLoading(false);
    }
  }


  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 motion-safe:animate-spin" aria-hidden="true">🍽️</div>
          <div role="status" className="text-white text-lg">A carregar…</div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">Login necessário</h1>
          <p className="text-purple-200 mb-6">Precisas de iniciar sessão para criar um jantar.</p>
          <Link
            href="/login"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-purple-500/50"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button type="button"
            onClick={() => router.back()}
            className="text-white/80 hover:text-white text-2xl"
            aria-label="Voltar"
          >
            ←
          </button>
          <Link href="/" className="text-white/80 hover:text-white text-2xl" aria-label="Início">
            🏠
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
              <label htmlFor="dinner-name" className="block text-white font-semibold mb-2 text-sm">
                Nome do Jantar *
              </label>
              <input
                id="dinner-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Noite de Vinhos Italianos"
                required
                autoComplete="off"
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 text-white placeholder:text-white/40 focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 text-base"
              />
            </div>

            {/* Event Date */}
            <div>
              <label htmlFor="dinner-date" className="block text-white font-semibold mb-2 text-sm">
                Data do Evento *
              </label>
              <input
                id="dinner-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                autoComplete="off"
                className="w-full max-w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 text-white focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 text-base scheme-dark"
                style={{ colorScheme: "dark" }}
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="dinner-location" className="block text-white font-semibold mb-2 text-sm">
                Localização (Opcional)
              </label>
              <input
                id="dinner-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lisboa, Portugal"
                autoComplete="street-address"
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 text-white placeholder:text-white/40 focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 text-base"
              />
            </div>

            {/* Organizer Selection */}
            <div>
              {loadingFounders ? (
                <div className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 text-white/60 text-base">
                  A carregar founders...
                </div>
              ) : availableFounders.length === 0 ? (
                <div className="w-full bg-amber-500/20 border-2 border-amber-400/30 rounded-2xl px-4 py-3 text-amber-200 text-sm">
                  🎁 Jantar extra — todos os founders já organizaram um jantar nesta temporada, por isso este não precisa de organizador.
                </div>
              ) : (
                <>
                  <label htmlFor="dinner-organizer" className="block text-white font-semibold mb-2 text-sm">
                    Organizador *
                  </label>
                  <select
                    id="dinner-organizer"
                    value={organizerId}
                    onChange={(e) => setOrganizerId(e.target.value)}
                    required
                    className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-2.5 text-white focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 text-base"
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
                  <p className="text-purple-200 text-xs mt-2">
                    Cada founder só pode organizar 1 jantar por temporada
                  </p>
                </>
              )}
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
                  id="dinner-blind"
                  type="checkbox"
                  checked={isBlind}
                  onChange={(e) => setIsBlind(e.target.checked)}
                  className="w-6 h-6"
                />
              </label>
            </div>

            {/* Error Message */}
            {(error || foundersQueryError) && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-3 text-red-200 text-center text-sm">
                {error || foundersQueryError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white px-5 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70"
            >
              {loading ? "A criar..." : "Criar Jantar 🍽️"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
