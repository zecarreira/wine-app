"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PaymentsSection } from "@/components/PaymentsSection";

interface Bottle {
  id: string;
  name: string;
  description: string;
  vintage: number;
  producer: string;
  wine_type: string;
  position: number;
  photo_url?: string;
  brought_by?: string;
  stats?: {
    total_ratings: number;
    average_score: number;
  };
}

interface DisplayBottle extends Bottle {
  displayPosition: number;
  displayLabel: string;
}

interface Dinner {
  id: string;
  name: string;
  event_date: string;
  location: string;
  is_blind: boolean;
  status: string;
  host_id: string;
  created_by: string;
  is_extra_dinner?: boolean;
  organizer?: {
    id: string;
    name: string;
  };
}

// Deterministic shuffle function - same seed = same order for all users
function shuffleArray<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  let hash = 0;

  // Generate hash from seed
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }

  // Fisher-Yates shuffle with deterministic randomness
  for (let i = arr.length - 1; i > 0; i--) {
    hash = (hash * 9301 + 49297) % 233280;
    // Ensure j is always positive by using Math.abs
    const j = Math.abs(hash) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export default function DinnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [dinner, setDinner] = useState<Dinner | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isAdmin] = useState(() => {
    if (typeof window === "undefined") return false;
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.role === "admin";
    }
    return false;
  });
  const [participants, setParticipants] = useState<
    Array<{ id: string; name: string }>
  >([]);

  function checkIfHost() {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    return null;
  }

  async function fetchDinnerAndBottles() {
    const [dinnerResponse, bottlesResponse, ratingsResponse] = await Promise.all([
      fetch("/api/dinners").catch(() => null),
      fetch(`/api/dinners/${id}/bottles`).catch(() => null),
      fetch(`/api/dinners/${id}/ratings`).catch(() => null),
    ]);

    if (!dinnerResponse || !bottlesResponse || !ratingsResponse) {
      setLoading(false);
      return;
    }

    const [dinnerData, bottlesData, ratingsData] = await Promise.all([
      dinnerResponse.json().catch(() => null),
      bottlesResponse.json().catch(() => null),
      ratingsResponse.json().catch(() => null),
    ]);

    if (!dinnerData || !bottlesData || !ratingsData) {
      setLoading(false);
      return;
    }

    const currentDinner = dinnerData.dinners.find((d: Dinner) => d.id === id);
    setDinner(currentDinner);

    // Check if user is host
    const userId = checkIfHost();
    if (userId && currentDinner) {
      if (userId === currentDinner.host_id || userId === currentDinner.created_by) {
        setIsHost(true);
      } else {
        setIsHost(false);
      }
    }

    if (bottlesData.success) {
      setBottles(bottlesData.bottles);
    }

    if (ratingsData.success && ratingsData.bottles) {
      const uniqueParticipants = new Map<string, { id: string; name: string }>();
      ratingsData.bottles.forEach((bottle: any) => {
        if (bottle.ratings) {
          bottle.ratings.forEach((rating: any) => {
            if (rating.user) {
              uniqueParticipants.set(rating.user.id, {
                id: rating.user.id,
                name: rating.user.name,
              });
            }
          });
        }
      });
      setParticipants(Array.from(uniqueParticipants.values()));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDinnerAndBottles();
    checkIfHost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStartDinner() {
    if (
      !confirm(
        "Iniciar a prova cega? Os nomes dos vinhos ficarão escondidos e a ordem será baralada!"
      )
    )
      return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/dinners/${id}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert("🎭 Prova cega iniciada!");
        fetchDinnerAndBottles();
      } else {
        if (data.error) {
          alert(data.error);
        } else {
          alert("Erro ao iniciar jantar");
        }
      }
    } catch (error) {
      alert("Erro ao iniciar jantar");
    }
    setActionLoading(false);
  }

  async function handleEndDinner() {
    if (
      !confirm(
        "Terminar o jantar e bloquear todas as avaliações? Pronto para revelar resultados!"
      )
    )
      return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/dinners/${id}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert("✅ Jantar terminado! Pronto para revelar!");
        fetchDinnerAndBottles();
      } else {
        if (data.error) {
          alert(data.error);
        } else {
          alert("Erro ao terminar jantar");
        }
      }
    } catch (error) {
      alert("Erro ao terminar jantar");
    }
    setActionLoading(false);
  }

  async function handleDeleteBottle(bottleId: string) {
    if (!confirm("Tens a certeza que queres apagar esta garrafa?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bottles/${bottleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert("✅ Garrafa apagada com sucesso!");
        fetchDinnerAndBottles();
      } else {
        if (data.error) {
          alert(data.error);
        } else {
          alert("Erro ao apagar garrafa");
        }
      }
    } catch (error) {
      alert("Erro ao apagar garrafa");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🍷</div>
          <div className="text-white text-xl">A carregar jantar...</div>
        </div>
      </div>
    );
  }

  if (!dinner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-white text-xl">Jantar não encontrado</div>
        </div>
      </div>
    );
  }

  const isBlindActive = dinner.is_blind && ["active", "ended", "revealing"].includes(dinner.status);

  // Prepare display bottles - shuffle if blind mode active
  // Filter out bottles without position and sort by position
  const validBottles = bottles
    .filter((b) => b.id && b.position != null)
    .sort((a, b) => a.position - b.position);

  const displayBottles: DisplayBottle[] = isBlindActive
    ? shuffleArray(validBottles, id)
        .filter((b) => b != null && b.id) // Safety check: filter out any undefined/null elements
        .map((bottle, index) => ({
          ...bottle,
          displayPosition: index + 1,
          displayLabel: String.fromCharCode(65 + index), // A, B, C, D...
        }))
    : validBottles.map((bottle) => ({
        ...bottle,
        displayPosition: bottle.position,
        displayLabel: bottle.position?.toString() || "?",
      }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            aria-label="Voltar"
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </button>
          <Link href="/" aria-label="Início" className="text-white/80 hover:text-white text-2xl">
            🏠
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Dinner Info Card */}
        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/20 shadow-2xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {dinner.name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-3">
                {dinner.is_extra_dinner && (
                  <div className="inline-flex items-center gap-2 bg-amber-500/30 text-amber-200 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-400/30">
                    <span>🎁</span>
                    <span>EXTRA</span>
                  </div>
                )}

                {/* Only show other badges if NOT extra dinner */}
                {!dinner.is_extra_dinner && (
                  <>
                    {dinner.is_blind && (
                      <div className="inline-flex items-center gap-2 bg-purple-500/30 text-purple-200 text-xs font-bold px-3 py-1.5 rounded-full border border-purple-400/30">
                        <span>🎭</span>
                        <span>PROVA CEGA</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div
                      className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
                        dinner.status === "setup"
                          ? "bg-blue-500/30 text-blue-200 border-blue-400/30"
                          : dinner.status === "active"
                          ? "bg-green-500/30 text-green-200 border-green-400/30"
                          : dinner.status === "ended"
                          ? "bg-orange-500/30 text-orange-200 border-orange-400/30"
                          : dinner.status === "revealing"
                          ? "bg-amber-500/30 text-amber-200 border-amber-400/30"
                          : "bg-purple-500/30 text-purple-200 border-purple-400/30"
                      }`}
                    >
                      <span>
                        {dinner.status === "setup"
                          ? "⚙️"
                          : dinner.status === "active"
                          ? "🎯"
                          : dinner.status === "ended"
                          ? "⏸️"
                          : dinner.status === "revealing"
                          ? "🎭"
                          : "✅"}
                      </span>
                      <span className="uppercase">
                        {dinner.status === "setup" ? "Agendado"
                          : dinner.status === "active" ? "Em Curso"
                          : dinner.status === "ended" ? "Terminado"
                          : dinner.status === "revealing" ? "A Revelar"
                          : "Concluído"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-purple-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="text-base">
                {new Date(dinner.event_date).toLocaleDateString("pt-PT", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {dinner.location && (
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <span className="text-base">{dinner.location}</span>
              </div>
            )}
            {dinner.organizer && (
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span className="text-base">
                  Organizado por: <strong>{dinner.organizer.name}</strong>
                </span>
              </div>
            )}
            {participants.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xl">👥</span>
                <span className="text-base">
                  {participants.length} Participante
                  {participants.length !== 1 ? "s" : ""}:{" "}
                  {participants.map((p) => p.name).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PAYMENTS SECTION - Escondido no jantar extra */}
        {!dinner.is_extra_dinner && <PaymentsSection dinnerId={id} isAdmin={isAdmin} />}

        {/* HOST CONTROL PANEL - Jantar extra: só botão de concluir */}
        {isHost && dinner.is_extra_dinner && dinner.status === "setup" && (
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border-2 border-amber-400/30 shadow-2xl">
            <button
              onClick={async () => {
                if (!confirm("Marcar este jantar extra como concluído?")) return;
                setActionLoading(true);
                try {
                  const token = localStorage.getItem("token");
                  const response = await fetch(`/api/dinners/${id}/end`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const data = await response.json();
                  if (data.success) {
                    fetchDinnerAndBottles();
                  } else {
                    alert(data.error || "Erro ao concluir jantar");
                  }
                } catch {
                  alert("Erro ao concluir jantar");
                }
                setActionLoading(false);
              }}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
            >
              {actionLoading ? "..." : "✅ Concluir Jantar"}
            </button>
          </div>
        )}

        {/* HOST CONTROL PANEL - Escondido no jantar extra (sem prova de vinhos) */}
        {isHost && !dinner.is_extra_dinner && (
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border-2 border-amber-400/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">👑</div>
              <div>
                <h2 className="text-xl font-bold text-white">Controlo do Anfitrião</h2>
                <p className="text-amber-200 text-sm">Só tu podes ver isto</p>
              </div>
            </div>

            {/* Buttons based on status */}
            <div className="space-y-3">
              {dinner.status === "setup" && (
                <button
                  onClick={handleStartDinner}
                  disabled={actionLoading || bottles.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
                >
                  {actionLoading
                    ? "..."
                    : bottles.length === 0
                    ? "⚠️ Adiciona garrafas primeiro"
                    : "🎭 Iniciar Prova Cega"}
                </button>
              )}

              {dinner.status === "active" && (
                <button
                  onClick={handleEndDinner}
                  disabled={actionLoading}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-orange-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
                >
                  {actionLoading ? "..." : "⏸️ Terminar Jantar"}
                </button>
              )}

              {(dinner.status === "ended" || dinner.status === "revealing") && (
                <Link
                  href={`/dinners/${id}/reveal`}
                  className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  🎭{" "}
                  {dinner.status === "ended"
                    ? "Iniciar Cerimónia de Revelação"
                    : "Continuar a Revelar"}
                </Link>
              )}

              {dinner.status === "completed" && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-white font-semibold">Jantar completo!</p>
                  <p className="text-white/60 text-sm">
                    Todos os resultados revelados
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blind Mode Warning */}
        {isBlindActive && (
          <div className="bg-purple-500/20 backdrop-blur-sm rounded-3xl p-4 mb-6 border border-purple-400/30">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎭</span>
              <div>
                <p className="text-white font-semibold">
                  Modo Prova Cega Ativo
                </p>
                <p className="text-purple-200 text-sm">
                  Vinhos etiquetados como A, B, C... e baralhados aleatoriamente
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Bottle Button - Only in Setup Mode AND NOT Extra Dinner */}
        {dinner.status === "setup" && !dinner.is_extra_dinner && (
          <div className="mb-6">
            <Link
              href={`/dinners/${id}/add-bottle`}
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-blue-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <span className="text-2xl">+</span>
              <span>Adicionar Garrafa</span>
            </Link>
          </div>
        )}

        {/* Photo Gallery Button */}
        <div className="mb-6">
          <Link
            href={`/dinners/${id}/photos`}
            className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-pink-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <span className="text-2xl">📸</span>
            <span>Ver Fotos</span>
          </Link>
        </div>

        {/* Bottles Section - Only show if NOT extra dinner */}
        {!dinner.is_extra_dinner && (
          <>
            {displayBottles.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/10">
                <div className="text-6xl mb-4">🍾</div>
                <p className="text-white/60 text-lg">Ainda não há garrafas</p>
                <p className="text-white/40 text-sm mt-2">
                  Adiciona garrafas via botão acima
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayBottles.map((bottle) => (
                  <div
                    key={bottle.id || `temp-${bottle.displayPosition}`}
                    className="relative"
                  >
                    {/* Edit/Delete Buttons - Only in setup mode and for bottle owner */}
                    {dinner.status === "setup" &&
                      bottle.brought_by === checkIfHost() && (
                        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteBottle(bottle.id);
                            }}
                            aria-label="Remover garrafa"
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors shadow-lg"
                          >
                            🗑️
                          </button>
                        </div>
                      )}

                    {/* Clickable Card Wrapper - Disabled during blind active tasting */}
                    {bottle.id ? (
                      <div
                        className="block"
                        onClick={() => { if (!isBlindActive) router.push(`/bottles/${bottle.id}`); }}
                      >
                        <div className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl transition-colors ${!isBlindActive ? "hover:border-purple-400/50 hover:shadow-purple-500/20 cursor-pointer" : ""}`}>
                          {/* Position Badge + Rating */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                              {bottle.displayLabel}
                            </div>
                            {bottle.stats &&
                              bottle.stats.total_ratings > 0 &&
                              !isBlindActive && (
                                <div className="text-right">
                                  <div className="text-3xl font-bold text-amber-400">
                                    {bottle.stats.average_score}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {bottle.stats.total_ratings} rating
                                    {bottle.stats.total_ratings !== 1 ? "s" : ""}
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Wine Info - Hidden in Blind Mode */}
                          {isBlindActive ? (
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-3">
                                Vinho {bottle.displayLabel}
                              </h3>
                              <p className="text-purple-200 text-sm mb-4">
                                🎭 Detalhes escondidos até à revelação
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              {/* Photo */}
                              <div>
                                {bottle.photo_url ? (
                                  <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black/20">
                                    <Image
                                      src={bottle.photo_url}
                                      alt={bottle.name}
                                      fill
                                      sizes="(max-width: 640px) 100vw, 50vw"
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full aspect-[3/4] rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border-2 border-white/10">
                                    <div className="text-5xl">🍷</div>
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex flex-col justify-between">
                                <div>
                                  <h3 className="text-xl font-bold text-white mb-3">
                                    {bottle.name}
                                  </h3>
                                  <div className="space-y-2 text-purple-200 mb-4">
                                    {bottle.producer && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">🏛️</span>
                                        <div>
                                          <div className="text-white/60 text-xs">Produtor</div>
                                          <div className="font-semibold text-sm">{bottle.producer}</div>
                                        </div>
                                      </div>
                                    )}
                                    {bottle.vintage && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">📅</span>
                                        <div>
                                          <div className="text-white/60 text-xs">Ano</div>
                                          <div className="font-semibold text-sm">{bottle.vintage}</div>
                                        </div>
                                      </div>
                                    )}
                                    {bottle.wine_type && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">🍷</span>
                                        <div>
                                          <div className="text-white/60 text-xs">Tipo</div>
                                          <div className="font-semibold text-sm capitalize">{bottle.wine_type}</div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {bottle.description && (
                                    <p className="text-white/70 text-xs italic leading-relaxed">
                                      &quot;{bottle.description}&quot;
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* No ID - Display error card without link */
                      <div className="bg-red-500/10 backdrop-blur-lg rounded-3xl p-6 border-2 border-red-400/50 shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-red-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl">
                            ⚠️
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-red-200">
                              Erro ao carregar garrafa
                            </h3>
                            <p className="text-red-300 text-sm">
                              ID da garrafa em falta. Atualiza a página.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rate Button - Only show if dinner is active AND bottle has valid ID */}
                    {dinner.status === "active" && bottle.id ? (
                      <Link
                        href={`/bottles/${bottle.id}/rate`}
                        className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>⭐</span>
                          <span>Classificar Este Vinho</span>
                        </div>
                      </Link>
                    ) : dinner.status === "active" && !bottle.id ? (
                      <div className="mt-4 bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 border border-red-400/30">
                        <div className="flex items-center gap-2 text-red-200 text-sm">
                          <span>⚠️</span>
                          <span>Erro: ID da garrafa em falta. Atualiza a página.</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* View Rankings Button - Only when completed */}
        {dinner.status === "completed" && bottles.length > 0 && (
          <div className="mt-8">
            <Link
              href={`/dinners/${id}/rankings`}
              className="block w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center px-6 py-5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-amber-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <div className="flex items-center justify-center gap-2">
                <span>🏆</span>
                <span>Ver Rankings Finais</span>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
