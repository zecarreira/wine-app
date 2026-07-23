"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/components/AuthProvider";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useState } from "react";

interface ProfileDinner {
  id: string;
  name: string;
  event_date?: string | null;
  status: string;
  is_blind: boolean;
}

interface ProfileBottle {
  id: string;
  name: string;
  producer?: string | null;
  vintage?: number | null;
  photo_url?: string | null;
  dinner: ProfileDinner;
}

interface ProfileRating {
  id: string;
  score: number;
  tasting_notes?: string | null;
  created_at: string;
  bottle: ProfileBottle;
}

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  profile_photo_url?: string;
  stats: {
    total_dinners: number;
    total_ratings: number;
    total_bottles_brought: number;
    average_rating: string;
    total_spent: number;
  };
  favorite_wine: ProfileRating | null;
  recent_ratings: ProfileRating[];
  bottles_brought: ProfileBottle[];
}

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const {
    data: user,
    isLoading: profileLoading,
    refetch,
  } = useQuery({
    queryKey: ["users", authUser?.id],
    queryFn: async () => {
      try {
        const data = await apiFetch<{ success: boolean; user: ProfileUser }>(
          `/api/users/${authUser!.id}`
        );
        return data.user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await logout();
        }
        throw error;
      }
    },
    enabled: !!authUser && !authLoading,
  });

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (!authUser) {
      router.push("/login");
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "profile-photos");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      }).catch(() => null);

      if (!uploadResponse) {
        toast.error("Erro de rede. Tenta novamente.");
        return;
      }

      const uploadData = await uploadResponse.json().catch(() => null);
      if (!uploadData?.success) {
        toast.error(
          uploadData?.error ?? "Erro ao fazer upload da foto. Tenta novamente."
        );
        return;
      }

      try {
        await apiFetch(`/api/users/${user?.id ?? authUser.id}`, {
          method: "PATCH",
          body: { profile_photo_url: uploadData.url },
        });
        await refetch();
      } catch (err) {
        toast.error(
          err instanceof ApiError
            ? err.message
            : "Erro ao atualizar perfil. Tenta novamente."
        );
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (authLoading || (authUser && profileLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 motion-safe:animate-spin" aria-hidden="true">👤</div>
          <div role="status" className="text-white text-lg">A carregar perfil…</div>
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
          <p className="text-purple-200 mb-6">Precisas de iniciar sessão para ver o teu perfil.</p>
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3">❌</div>
          <div className="text-white text-lg">Perfil não encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button type="button"
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

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-6 pb-24 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-3xl p-4 md:p-6 mb-4 border border-white/20 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="relative group">
              {user.profile_photo_url ? (
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-purple-500/30">
                  <Image
                    src={user.profile_photo_url}
                    alt={user.name}
                    fill
                    sizes="(max-width: 768px) 80px, 96px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl md:text-4xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Upload button overlay */}
              <label
                htmlFor="profile-photo-upload"
                className={`absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                  uploadingPhoto ? "opacity-100" : ""
                }`}
              >
                {uploadingPhoto ? (
                  <span className="text-white text-xl md:text-2xl animate-spin">
                    ⏳
                  </span>
                ) : (
                  <span className="text-white text-xl md:text-2xl">📸</span>
                )}
              </label>
              <input
                id="profile-photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                {user.name}
              </h1>
              <p className="text-purple-200 text-xs md:text-sm mb-2">
                {user.email}
              </p>
              <p className="text-white/40 text-[10px] md:text-xs mb-2 italic">
                💡 Clica na foto para alterar
              </p>
              <div className="mb-3">
                <span
                  className={`inline-block px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold ${
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
                    ? "🍷 Fundador"
                    : "👤 Convidado"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <span>Backend</span>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
            <div className="bg-white/5 rounded-2xl p-2.5 md:p-3 text-center">
              <div className="text-xl md:text-2xl mb-1">🍽️</div>
              <div className="text-lg md:text-xl font-bold text-white">
                {user.stats.total_dinners}
              </div>
              <div className="text-white/60 text-[10px] md:text-xs">
                Jantares
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-2.5 md:p-3 text-center">
              <div className="text-xl md:text-2xl mb-1">⭐</div>
              <div className="text-lg md:text-xl font-bold text-white">
                {user.stats.total_ratings}
              </div>
              <div className="text-white/60 text-[10px] md:text-xs">
                Avaliações
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-2.5 md:p-3 text-center">
              <div className="text-xl md:text-2xl mb-1">🍷</div>
              <div className="text-lg md:text-xl font-bold text-white">
                {user.stats.total_bottles_brought}
              </div>
              <div className="text-white/60 text-[10px] md:text-xs">
                Garrafas
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-2.5 md:p-3 text-center">
              <div className="text-xl md:text-2xl mb-1">📊</div>
              <div className="text-lg md:text-xl font-bold text-white">
                {user.stats.average_rating || "N/A"}
              </div>
              <div className="text-white/60 text-[10px] md:text-xs">Média</div>
            </div>

            {user.role !== "guest" && (
              <div className="bg-white/5 rounded-2xl p-2.5 md:p-3 text-center">
                <div className="text-xl md:text-2xl mb-1">💰</div>
                <div className="text-lg md:text-xl font-bold text-white">
                  {user.stats.total_spent}
                </div>
                <div className="text-white/60 text-[10px] md:text-xs">
                  Pipas
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center mt-4">
            <button type="button"
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Favorite Wine */}
        {user.favorite_wine &&
          !(
            user.favorite_wine.bottle.dinner.is_blind &&
            ["active", "ended", "revealing"].includes(user.favorite_wine.bottle.dinner.status)
          ) && (
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-lg rounded-3xl p-5 mb-4 border-2 border-amber-400/30 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⭐</span>
                <h2 className="text-xl font-bold text-white">
                  O Teu Vinho Favorito
                </h2>
              </div>

              <Link
                href={`/bottles/${user.favorite_wine.bottle.id}`}
                className="block bg-white/5 rounded-2xl p-3 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {user.favorite_wine.bottle.name}
                    </h3>
                    {user.favorite_wine.bottle.producer && (
                      <p className="text-purple-200 text-xs">
                        {user.favorite_wine.bottle.producer}
                      </p>
                    )}
                    <p className="text-white/60 text-xs mt-1">
                      De: {user.favorite_wine.bottle.dinner.name}
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-amber-400">
                    {user.favorite_wine.score}
                  </div>
                </div>
              </Link>
            </div>
          )}

        {/* Recent Ratings */}
        {user.recent_ratings.length > 0 && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-5 mb-4 border border-white/20 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📝</span>
              <h2 className="text-xl font-bold text-white">
                Avaliações Recentes
              </h2>
            </div>

            <div className="space-y-2.5">
              {user.recent_ratings.map((rating) => {
                const isBlindActive =
                  rating.bottle.dinner.is_blind &&
                  ["active", "ended", "revealing"].includes(rating.bottle.dinner.status);

                return (
                  <Link
                    key={rating.id}
                    href={`/bottles/${rating.bottle.id}`}
                    className="block bg-white/5 rounded-2xl p-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-semibold text-white">
                        {isBlindActive
                          ? "🎭 Vinho em Prova Cega"
                          : rating.bottle.name}
                      </h3>
                      <div className="text-xl font-bold text-amber-400">
                        {rating.score}
                      </div>
                    </div>
                    <p className="text-white/60 text-xs">
                      {rating.bottle.dinner.name} •{" "}
                      {new Date(rating.created_at).toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon" })}
                    </p>
                    {rating.tasting_notes && (
                      <p className="text-white/70 text-xs mt-1.5 italic">
                        &quot;{rating.tasting_notes.substring(0, 100)}
                        {rating.tasting_notes.length > 100 ? "…" : ""}&quot;
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottles Brought */}
        {user.bottles_brought.length > 0 && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-5 border border-white/20 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🍾</span>
              <h2 className="text-xl font-bold text-white">
                Garrafas que Trouxeste
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {user.bottles_brought.map((bottle) => {
                const isBlindBottle =
                  bottle.dinner?.is_blind &&
                  ["active", "ended", "revealing"].includes(bottle.dinner?.status);
                return (
                  <Link
                    key={bottle.id}
                    href={`/bottles/${bottle.id}`}
                    className="block bg-white/5 rounded-2xl p-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex gap-2">
                      {bottle.photo_url && !isBlindBottle && (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={bottle.photo_url}
                            alt={bottle.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-white mb-0.5">
                          {isBlindBottle ? "🎭 Vinho em Prova Cega" : bottle.name}
                        </h3>
                        {!isBlindBottle && bottle.producer && (
                          <p className="text-purple-200 text-xs">
                            {bottle.producer}
                          </p>
                        )}
                        <p className="text-white/60 text-xs mt-0.5">
                          {bottle.dinner.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
