"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";

interface Bottle {
  id: string;
  name: string;
  description: string;
  vintage: number;
  producer: string;
  wine_type: string;
  position: number;
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
}

// Deterministic shuffle function - same seed = same order for all users
function shuffleArray<T>(array: T[], seed: string): T[] {
  console.log("🎲 shuffleArray INPUT:", array.length, "elements");

  const arr = [...array];

  console.log("🎲 Array copy created:", arr.length, "elements");
  console.log("🎲 First 3 elements:", arr.slice(0, 3));

  let hash = 0;

  // Generate hash from seed
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }

  console.log("🎲 Hash generated:", hash);

  // Fisher-Yates shuffle with deterministic randomness
  for (let i = arr.length - 1; i > 0; i--) {
    hash = (hash * 9301 + 49297) % 233280;
    // Ensure j is always positive by using Math.abs
    const j = Math.abs(hash) % (i + 1);
    console.log(`🎲 Swap ${i} ↔ ${j}`);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  console.log("🎲 shuffleArray OUTPUT:", arr.length, "elements");
  console.log("🎲 First 3 shuffled:", arr.slice(0, 3));

  // Check for undefined
  const undefinedCount = arr.filter((item) => item == null).length;
  if (undefinedCount > 0) {
    console.error(
      `🎲 ❌ CRITICAL: ${undefinedCount} undefined items in shuffled array!`
    );
  }

  return arr;
}

export default function DinnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [dinner, setDinner] = useState<Dinner | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    fetchDinnerAndBottles();
    checkIfHost();
  }, [id]);

  function checkIfHost() {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    return null;
  }

  async function fetchDinnerAndBottles() {
    try {
      const dinnerResponse = await fetch("/api/dinners");
      const dinnerData = await dinnerResponse.json();
      const currentDinner = dinnerData.dinners.find((d: Dinner) => d.id === id);
      setDinner(currentDinner);

      // Check if user is host
      const userId = checkIfHost();
      if (userId && currentDinner) {
        setIsHost(
          userId === currentDinner.host_id ||
            userId === currentDinner.created_by
        );
      }

      const bottlesResponse = await fetch(`/api/dinners/${id}/bottles`);
      const bottlesData = await bottlesResponse.json();

      if (bottlesData.success) {
        // Debug: verificar se todas as garrafas têm ID e position
        console.log(
          "📦 Total de garrafas recebidas da API:",
          bottlesData.bottles.length
        );

        // Check if any bottle is missing ID
        const missingIds = bottlesData.bottles.filter((b: any) => !b.id);
        if (missingIds.length > 0) {
          console.error(
            "❌ CRITICAL: Garrafas sem ID recebidas da API:",
            missingIds
          );
        }

        bottlesData.bottles.forEach((bottle: any, index: number) => {
          console.log(`Garrafa ${index}:`, {
            id: bottle.id,
            position: bottle.position,
            name: bottle.name,
            hasId: !!bottle.id,
            hasPosition: bottle.position != null,
          });
          if (!bottle.id) {
            console.error(
              `⚠️ Garrafa sem ID encontrada na posição ${index}:`,
              bottle
            );
          }
          if (bottle.position == null) {
            console.error(`⚠️ Garrafa sem position encontrada:`, {
              id: bottle.id,
              name: bottle.name,
            });
          }
        });
        setBottles(bottlesData.bottles);
      }

      // Fetch participants (users who rated bottles)
      const ratingsResponse = await fetch(`/api/dinners/${id}/ratings`);
      const ratingsData = await ratingsResponse.json();

      if (ratingsData.success && ratingsData.bottles) {
        const uniqueParticipants = new Map<
          string,
          { id: string; name: string }
        >();
        ratingsData.bottles.forEach((bottle: any) => {
          bottle.ratings?.forEach((rating: any) => {
            if (rating.user) {
              uniqueParticipants.set(rating.user.id, {
                id: rating.user.id,
                name: rating.user.name,
              });
            }
          });
        });
        setParticipants(Array.from(uniqueParticipants.values()));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartDinner() {
    if (
      !confirm(
        "Start the blind tasting? Bottle names will be hidden and order will be shuffled!"
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
        alert("🎭 Blind tasting started!");
        fetchDinnerAndBottles();
      } else {
        alert(data.error || "Failed to start dinner");
      }
    } catch (error) {
      alert("Error starting dinner");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEndDinner() {
    if (
      !confirm("End the dinner and lock all ratings? Ready to reveal results!")
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
        alert("✅ Dinner ended! Ready for reveal!");
        fetchDinnerAndBottles();
      } else {
        alert(data.error || "Failed to end dinner");
      }
    } catch (error) {
      alert("Error ending dinner");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🍷</div>
          <div className="text-white text-xl">Loading dinner...</div>
        </div>
      </div>
    );
  }

  if (!dinner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-white text-xl">Dinner not found</div>
        </div>
      </div>
    );
  }

  const isBlindActive = dinner.status === "active";

  // Prepare display bottles - shuffle if blind mode active
  // Filter out bottles without position and sort by position
  const validBottles = bottles
    .filter((b) => b.id && b.position != null)
    .sort((a, b) => a.position - b.position);

  console.log(
    "✅ validBottles BEFORE shuffle:",
    validBottles.length,
    validBottles.map((b) => ({ id: b.id, name: b.name, position: b.position }))
  );

  const displayBottles: DisplayBottle[] = isBlindActive
    ? (() => {
        const shuffled = shuffleArray(validBottles, id);
        console.log("🔀 AFTER shuffleArray:", shuffled.length, "items");

        // Safety check: filter out any undefined/null elements
        const safeShuffled = shuffled.filter((b) => b != null && b.id);

        if (safeShuffled.length !== shuffled.length) {
          console.error(
            `⚠️ CRITICAL: shuffleArray returned ${
              shuffled.length - safeShuffled.length
            } undefined/null elements!`
          );
          console.error("Original shuffled array:", shuffled);
        }

        console.log(
          "✅ safeShuffled:",
          safeShuffled.length,
          safeShuffled.map((b) => ({ id: b.id, name: b.name }))
        );

        return safeShuffled.map((bottle, index) => {
          console.log(`🔍 Shuffle - Bottle ${index}:`, {
            id: bottle.id,
            name: bottle.name,
            position: bottle.position,
            displayLabel: String.fromCharCode(65 + index),
          });
          return {
            ...bottle,
            displayPosition: index + 1,
            displayLabel: String.fromCharCode(65 + index), // A, B, C, D...
          };
        });
      })()
    : validBottles.map((bottle) => ({
        ...bottle,
        displayPosition: bottle.position,
        displayLabel: bottle.position?.toString() || "?",
      }));

  // Debug: Verify all displayBottles have IDs
  console.log("🎯 displayBottles final check:");
  displayBottles.forEach((bottle, index) => {
    console.log(`  ${index}. ${bottle.displayLabel}:`, {
      id: bottle.id,
      hasId: !!bottle.id,
      name: isBlindActive ? `Wine ${bottle.displayLabel}` : bottle.name,
    });
    if (!bottle.id) {
      console.error(`❌ CRITICAL: Bottle ${bottle.displayLabel} has NO ID!`);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/dinners"
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </Link>
          <Link href="/" className="text-white/80 hover:text-white text-2xl">
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
                      <span className="uppercase">{dinner.status}</span>
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
                {new Date(dinner.event_date).toLocaleDateString("en-US", {
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

        {/* HOST CONTROL PANEL */}
        {isHost && (
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border-2 border-amber-400/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">👑</div>
              <div>
                <h2 className="text-xl font-bold text-white">Host Controls</h2>
                <p className="text-amber-200 text-sm">Only you can see this</p>
              </div>
            </div>

            {/* Buttons based on status */}
            <div className="space-y-3">
              {dinner.status === "setup" && (
                <button
                  onClick={handleStartDinner}
                  disabled={actionLoading || bottles.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading
                    ? "..."
                    : bottles.length === 0
                    ? "⚠️ Add bottles first"
                    : "🎭 Start Blind Tasting"}
                </button>
              )}

              {dinner.status === "active" && (
                <button
                  onClick={handleEndDinner}
                  disabled={actionLoading}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-orange-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {actionLoading ? "..." : "⏸️ End Dinner & Prepare Reveal"}
                </button>
              )}

              {(dinner.status === "ended" || dinner.status === "revealing") && (
                <Link
                  href={`/dinners/${id}/reveal`}
                  className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                >
                  🎭{" "}
                  {dinner.status === "ended"
                    ? "Start Reveal Ceremony"
                    : "Continue Revealing"}
                </Link>
              )}

              {dinner.status === "completed" && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-white font-semibold">Dinner completed!</p>
                  <p className="text-white/60 text-sm">All results revealed</p>
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
                  Blind Tasting Mode Active
                </p>
                <p className="text-purple-200 text-sm">
                  Wines are labeled A, B, C... and shuffled randomly
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
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-blue-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
            >
              <span className="text-2xl">+</span>
              <span>Add Wine Bottle</span>
            </Link>
          </div>
        )}

        {/* Extra Dinner Warning - No Bottles Allowed */}
        {dinner.status === "setup" && dinner.is_extra_dinner && (
          <div className="mb-6 bg-amber-500/20 backdrop-blur-sm rounded-3xl p-4 border border-amber-400/30">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎁</span>
              <div>
                <p className="text-white font-semibold">Jantar Extra</p>
                <p className="text-amber-200 text-sm">
                  Este é um jantar especial apenas para fotos e convívio. Não é
                  permitido adicionar garrafas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Photo Gallery Button */}
        <div className="mb-6">
          <Link
            href={`/dinners/${id}/photos`}
            className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-pink-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
          >
            <span className="text-2xl">📸</span>
            <span>View Photos</span>
          </Link>
        </div>

        {/* Bottles Section - Only show if NOT extra dinner */}
        {!dinner.is_extra_dinner && (
          <>
            {displayBottles.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/10">
                <div className="text-6xl mb-4">🍾</div>
                <p className="text-white/60 text-lg">No bottles yet</p>
                <p className="text-white/40 text-sm mt-2">
                  Add bottles via API
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayBottles.map((bottle) => (
                  <div
                    key={bottle.id || `temp-${bottle.displayPosition}`}
                    className="relative"
                  >
                    {/* Clickable Card Wrapper - Only if bottle has valid ID */}
                    {bottle.id ? (
                      <Link href={`/bottles/${bottle.id}`} className="block">
                        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl hover:border-purple-400/50 hover:shadow-purple-500/20 transition-all cursor-pointer">
                          {/* Position Badge */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">
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
                                    {bottle.stats.total_ratings !== 1
                                      ? "s"
                                      : ""}
                                  </div>
                                </div>
                              )}
                          </div>

                          {/* Wine Info - Hidden in Blind Mode */}
                          {isBlindActive ? (
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-3">
                                Wine {bottle.displayLabel}
                              </h3>
                              <p className="text-purple-200 text-sm mb-4">
                                🎭 Wine details hidden until reveal
                              </p>
                            </div>
                          ) : (
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-3">
                                {bottle.name}
                              </h3>

                              <div className="space-y-1.5 text-purple-200 mb-4">
                                {bottle.producer && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span>🏛️</span>
                                    <span>{bottle.producer}</span>
                                  </div>
                                )}
                                {bottle.vintage && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span>📅</span>
                                    <span>{bottle.vintage}</span>
                                  </div>
                                )}
                                {bottle.wine_type && (
                                  <div className="flex items-center gap-2 text-sm capitalize">
                                    <span>🍷</span>
                                    <span>{bottle.wine_type}</span>
                                  </div>
                                )}
                              </div>

                              {bottle.description && (
                                <p className="text-white/80 text-sm mb-4 italic leading-relaxed">
                                  &quot;{bottle.description}&quot;
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    ) : (
                      /* No ID - Display error card without link */
                      <div className="bg-red-500/10 backdrop-blur-lg rounded-3xl p-6 border-2 border-red-400/50 shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-red-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl">
                            ⚠️
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-red-200">
                              Error Loading Bottle
                            </h3>
                            <p className="text-red-300 text-sm">
                              Bottle ID is missing. Please refresh the page.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rate Button - Only show if dinner is active AND bottle has valid ID */}
                    {dinner.status === "active" && bottle.id ? (
                      <Link
                        href={`/bottles/${bottle.id}/rate`}
                        className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] mt-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>⭐</span>
                          <span>Rate This Wine</span>
                        </div>
                      </Link>
                    ) : dinner.status === "active" && !bottle.id ? (
                      <div className="mt-4 bg-red-500/20 backdrop-blur-sm rounded-2xl p-4 border border-red-400/30">
                        <div className="flex items-center gap-2 text-red-200 text-sm">
                          <span>⚠️</span>
                          <span>Error: Bottle ID missing. Please refresh.</span>
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
              className="block w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center px-6 py-5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-amber-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-center justify-center gap-2">
                <span>🏆</span>
                <span>View Final Rankings</span>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
