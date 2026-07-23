"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

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

type BottleWithDetails = Bottle;

export default function BottleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [bottle, setBottle] = useState<BottleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    producer: "",
    vintage: "",
    wine_type: "",
    description: "",
    photo_url: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
    }

    fetchBottle();
  }, [id]);

  async function fetchBottle() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bottles/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success) {
        setBottle(data.bottle);
        // Initialize edit form with bottle data
        setEditForm({
          name: data.bottle.name || "",
          producer: data.bottle.producer || "",
          vintage: data.bottle.vintage?.toString() || "",
          wine_type: data.bottle.wine_type || "",
          description: data.bottle.description || "",
          photo_url: data.bottle.photo_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching bottle:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit() {
    setIsEditing(true);
  }

  function handleCancelEdit() {
    // Reset form to original values
    if (bottle) {
      setEditForm({
        name: bottle.name || "",
        producer: bottle.producer || "",
        vintage: bottle.vintage?.toString() || "",
        wine_type: bottle.wine_type || "",
        description: bottle.description || "",
        photo_url: bottle.photo_url || "",
      });
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsEditing(false);
  }

  async function handlePhotoClick() {
    if (!isEditing) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toastError("Foto muito grande! Máximo 5MB");
        return;
      }

      setUploadingPhoto(true);
      try {
        const token = localStorage.getItem("token");

        // Create FormData with bucket parameter
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "bottle-photos");

        // Upload photo
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (data.success && data.url) {
          // Update bottle with new photo URL
          const updateResponse = await fetch(`/api/bottles/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              photo_url: data.url,
            }),
          });

          const updateData = await updateResponse.json();
          if (updateData.success) {
            success("Foto atualizada com sucesso!");
            fetchBottle(); // Refresh to show new photo
          } else {
            toastError(updateData.error || "Erro ao atualizar foto");
          }
        } else {
          toastError(data.error || "Erro ao fazer upload da foto");
        }
      } catch (_error) {
        toastError("Erro ao fazer upload da foto");
      } finally {
        setUploadingPhoto(false);
      }
    };

    input.click();
  }

  async function handleSaveEdit() {
    if (!editForm.name.trim()) {
      toastError("Nome da garrafa é obrigatório");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bottles/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          producer: editForm.producer || null,
          vintage: editForm.vintage ? parseInt(editForm.vintage) : null,
          wine_type: editForm.wine_type || null,
          description: editForm.description || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        success("Garrafa atualizada com sucesso!");
        setIsEditing(false);
        fetchBottle(); // Refresh data
      } else {
        toastError(data.error || "Erro ao atualizar garrafa");
      }
    } catch (error) {
      toastError("Erro ao atualizar garrafa");
    }
  }

  async function handleDeleteBottle() {
    if (!confirm("Tens a certeza que queres apagar esta garrafa?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bottles/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        success("Garrafa apagada com sucesso!");
        router.push(`/dinners/${bottle?.dinner.id}`);
      } else {
        toastError(data.error || "Erro ao apagar garrafa");
      }
    } catch (error) {
      toastError("Erro ao apagar garrafa");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 motion-safe:animate-spin" aria-hidden="true">🍷</div>
          <div className="text-white text-xl">A carregar garrafa...</div>
        </div>
      </div>
    );
  }

  if (!bottle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-white text-xl">Garrafa não encontrada</div>
        </div>
      </div>
    );
  }

  // Block access during blind tasting until reveal is complete
  if (bottle.dinner?.is_blind && ["active", "ended", "revealing"].includes(bottle.dinner?.status)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="text-8xl mb-6">🎭</div>
          <h1 className="text-3xl font-bold text-white mb-3">Prova Cega em Curso</h1>
          <p className="text-purple-200 mb-6">
            Este vinho faz parte de uma prova cega ativa. A informação será revelada após a conclusão do jantar.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-semibold transition-colors"
          >
            ← Voltar
          </button>
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
            aria-label="Voltar"
            className="text-white/80 hover:text-white text-2xl rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            ←
          </button>
          <Link href="/" aria-label="Início" className="text-white/80 hover:text-white text-2xl rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
            🏠
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
                <div
                  onClick={handlePhotoClick}
                  className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black/20 ${
                    isEditing
                      ? "cursor-pointer hover:ring-4 hover:ring-purple-400 transition-[box-shadow,outline]"
                      : ""
                  }`}
                >
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📤</div>
                        <div className="text-white text-sm">
                          A fazer upload...
                        </div>
                      </div>
                    </div>
                  )}
                  {isEditing && !uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center transition-[colors,opacity] opacity-0 hover:opacity-100">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📷</div>
                        <div className="text-white text-sm font-medium">
                          Clica para mudar foto
                        </div>
                      </div>
                    </div>
                  )}
                  <Image
                    src={bottle.photo_url}
                    alt={bottle.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  onClick={handlePhotoClick}
                  className={`w-full aspect-[3/4] rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border-2 border-white/10 ${
                    isEditing
                      ? "cursor-pointer hover:ring-4 hover:ring-purple-400 transition-[box-shadow,outline]"
                      : ""
                  }`}
                >
                  {uploadingPhoto ? (
                    <div className="text-center">
                      <div className="text-4xl mb-2">📤</div>
                      <div className="text-white/60">A fazer upload...</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-8xl mb-4">🍷</div>
                      <div className="text-white/60">
                        {isEditing ? "Clica para adicionar foto" : "Sem foto"}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Title */}
                <div className="mb-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      autoComplete="off"
                      className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-3 md:px-4 py-2 text-white text-xl md:text-2xl font-bold focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
                      placeholder="Nome da garrafa *"
                    />
                  ) : (
                    <h1 className="text-2xl md:text-4xl font-bold text-white break-words">
                      {bottle.name}
                    </h1>
                  )}
                </div>

                {/* Edit/Delete Buttons - Only in setup and if owner */}
                {bottle.dinner.status === "setup" &&
                  bottle.brought_by_user.id === currentUserId && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors"
                          >
                            ✅ Guardar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 min-w-[120px] bg-gray-600 hover:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors"
                          >
                            ❌ Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleEdit}
                            className="flex-1 min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={handleDeleteBottle}
                            className="flex-1 min-w-[100px] bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors"
                          >
                            🗑️ Apagar
                          </button>
                        </>
                      )}
                    </div>
                  )}

                {isEditing ? (
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="block text-white/60 text-xs mb-1">
                        🏛️ Produtor
                      </label>
                      <input
                        type="text"
                        value={editForm.producer}
                        onChange={(e) =>
                          setEditForm({ ...editForm, producer: e.target.value })
                        }
                        autoComplete="off"
                        className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-3 py-2 text-white text-sm md:text-base focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
                        placeholder="Produtor"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/60 text-xs mb-1">
                          📅 Ano
                        </label>
                        <input
                          type="number"
                          value={editForm.vintage}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              vintage: e.target.value,
                            })
                          }
                          autoComplete="off"
                        className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-3 py-2 text-white text-sm md:text-base focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
                          placeholder="Ano"
                        />
                      </div>

                      <div>
                        <label className="block text-white/60 text-xs mb-1">
                          🍷 Tipo
                        </label>
                        <input
                          type="text"
                          value={editForm.wine_type}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              wine_type: e.target.value,
                            })
                          }
                          autoComplete="off"
                        className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-3 py-2 text-white text-sm md:text-base focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
                          placeholder="Tipo"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/60 text-xs mb-1">
                        📝 Descrição
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        autoComplete="off"
                        className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-3 py-2 text-white text-sm md:text-base focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
                        placeholder="Descrição"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 text-purple-200 mb-6">
                      {bottle.producer && (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏛️</span>
                          <div>
                            <div className="text-white/60 text-xs">
                              Produtor
                            </div>
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
                            <div className="text-white/60 text-xs">Ano</div>
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
                            <div className="text-white/60 text-xs">Tipo</div>
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
                            <div className="text-white/60 text-xs">
                              Trazido Por
                            </div>
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
                  </>
                )}
              </div>

              {/* Stats */}
              {bottle.stats.total_ratings > 0 && (
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-6 border border-amber-400/30">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-amber-400 mb-2">
                      {bottle.stats.average_score}
                    </div>
                    <div className="text-white/80 text-sm">Média</div>
                    <div className="text-white/60 text-xs mt-1">
                      {bottle.stats.total_ratings}{" "}
                      {bottle.stats.total_ratings !== 1 ? "classificações" : "classificação"}
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
              <div className="text-white/60 text-sm">Servido em</div>
              <h2 className="text-2xl font-bold text-white">
                {bottle.dinner.name}
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-purple-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <div className="text-white/60 text-xs">Data</div>
                <div className="font-semibold">
                  {new Date(bottle.dinner.event_date).toLocaleDateString(
                    "pt-PT",
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
                  <div className="text-white/60 text-xs">Local</div>
                  <div className="font-semibold">{bottle.dinner.location}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xl">👑</span>
              <div>
                <div className="text-white/60 text-xs">Anfitrião</div>
                <div className="font-semibold">{bottle.dinner.host.name}</div>
              </div>
            </div>
          </div>

          <Link
            href={`/dinners/${bottle.dinner.id}`}
            className="mt-4 block w-full text-center bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Ver Jantar Completo →
          </Link>
        </div>

        {/* Ratings */}
        {bottle.ratings.length > 0 ? (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">⭐</span>
              <h2 className="text-2xl font-bold text-white">
                Classificações ({bottle.ratings.length})
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
            <p className="text-white/60 text-lg">Ainda sem classificações</p>
          </div>
        )}
      </main>
    </div>
  );
}
