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
  profile_photo_url?: string;
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
      } else {
        console.error("API error:", data.error);
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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A foto deve ter no máximo 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem válida");
      return;
    }

    setUploadingPhoto(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Upload photo to storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "profile-photos");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || "Failed to upload photo");
      }

      // Update user profile with photo URL
      const updateResponse = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile_photo_url: uploadData.url,
        }),
      });

      const updateData = await updateResponse.json();

      if (updateData.success) {
        // Refresh profile
        await fetchProfile();
      } else {
        throw new Error(updateData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      alert("Erro ao fazer upload da foto. Tenta novamente.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-spin">👤</div>
          <div className="text-white text-lg">A carregar perfil...</div>
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
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </button>
          <Link href="/" className="text-white/80 hover:text-white text-2xl">
            🏠
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-3xl p-6 mb-4 border border-white/20 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="relative group">
              {user.profile_photo_url ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-purple-500/30">
                  <Image
                    src={user.profile_photo_url}
                    alt={user.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white">
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
                  <span className="text-white text-2xl animate-spin">⏳</span>
                ) : (
                  <span className="text-white text-2xl">📸</span>
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
              <h1 className="text-2xl font-bold text-white mb-1">
                {user.name}
              </h1>
              <p className="text-purple-200 text-sm mb-2">{user.email}</p>
              <p className="text-white/40 text-xs mb-2 italic">
                💡 Clica na foto para alterar
              </p>
              <div className="mb-3">
                <span
                  className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
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
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <span>Backend</span>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">🍽️</div>
              <div className="text-xl font-bold text-white">
                {user.stats.total_dinners}
              </div>
              <div className="text-white/60 text-xs">Jantares</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xl font-bold text-white">
                {user.stats.total_ratings}
              </div>
              <div className="text-white/60 text-xs">Avaliações</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">🍷</div>
              <div className="text-xl font-bold text-white">
                {user.stats.total_bottles_brought}
              </div>
              <div className="text-white/60 text-xs">Garrafas</div>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xl font-bold text-white">
                {user.stats.average_rating || "N/A"}
              </div>
              <div className="text-white/60 text-xs">Média</div>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Favorite Wine */}
        {user.favorite_wine &&
          !(
            user.favorite_wine.bottle.dinner.status === "active" &&
            user.favorite_wine.bottle.dinner.is_blind
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
                  rating.bottle.dinner.status === "active" &&
                  rating.bottle.dinner.is_blind;

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
                      {new Date(rating.created_at).toLocaleDateString()}
                    </p>
                    {rating.tasting_notes && (
                      <p className="text-white/70 text-xs mt-1.5 italic">
                        &quot;{rating.tasting_notes.substring(0, 100)}
                        {rating.tasting_notes.length > 100 ? "..." : ""}&quot;
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
              {user.bottles_brought.map((bottle) => (
                <Link
                  key={bottle.id}
                  href={`/bottles/${bottle.id}`}
                  className="block bg-white/5 rounded-2xl p-3 hover:bg-white/10 transition-colors"
                >
                  <div className="flex gap-2">
                    {bottle.photo_url && (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={bottle.photo_url}
                          alt={bottle.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-0.5">
                        {bottle.name}
                      </h3>
                      {bottle.producer && (
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
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
