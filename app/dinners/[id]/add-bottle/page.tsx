"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function AddBottlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [producer, setProducer] = useState("");
  const [vintage, setVintage] = useState("");
  const [wineType, setWineType] = useState("red");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photo) return null;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", photo);
      formData.append("bucket", "bottle-photos");

      const token = localStorage.getItem("token");

      // DEBUG - Remove depois
      console.log("🔑 Token exists?", !!token);
      console.log("🔑 Token length:", token?.length);
      console.log("🔑 Token starts with:", token?.substring(0, 20));
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        return data.url;
      } else {
        throw new Error(data.error || "Failed to upload photo");
      }
    } catch (error: any) {
      console.error("Photo upload error:", error);
      setError("Failed to upload photo: " + error.message);
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  }

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

      // Upload photo first if exists
      let photoUrl = null;
      if (photo) {
        photoUrl = await uploadPhoto();
        if (!photoUrl) {
          setLoading(false);
          return; // Error already set by uploadPhoto
        }
      }

      // Create bottle
      const response = await fetch(`/api/dinners/${id}/bottles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          producer: producer || null,
          vintage: vintage ? parseInt(vintage) : null,
          wine_type: wineType,
          description: description || null,
          photo_url: photoUrl,
        }),
      });

      const data = await response.json();

      // Debug: verificar se a garrafa criada tem ID
      console.log("✅ Garrafa criada:", data);
      if (data.bottle) {
        console.log("🆔 ID da garrafa:", data.bottle.id);
        console.log("📍 Posição da garrafa:", data.bottle.position);
      }

      if (data.success) {
        router.push(`/dinners/${id}`);
      } else {
        setError(data.error || "Failed to add bottle");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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

      <main className="container mx-auto px-4 py-8 max-w-2xl pb-24">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍾</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Adicionar Garrafa
          </h1>
          <p className="text-purple-200">Adiciona uma garrafa a este jantar</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Foto da Garrafa (Opcional)
              </label>

              {photoPreview ? (
                <div className="relative w-full h-64 mb-3 rounded-2xl overflow-hidden">
                  <Image
                    src={photoPreview}
                    alt="Pré-visualização"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="block w-full bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors">
                  <div className="text-5xl mb-2">📸</div>
                  <div className="text-white/60">Clica para carregar foto</div>
                  <div className="text-white/40 text-sm mt-1">
                    JPG, PNG até 5MB
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Wine Name */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Nome do Vinho *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Barolo Riserva 2015"
                required
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-lg"
              />
            </div>

            {/* Producer */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Produtor (Opcional)
              </label>
              <input
                type="text"
                value={producer}
                onChange={(e) => setProducer(e.target.value)}
                placeholder="Marchesi di Barolo"
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-lg"
              />
            </div>

            {/* Vintage & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Ano
                </label>
                <input
                  type="number"
                  value={vintage}
                  onChange={(e) => setVintage(e.target.value)}
                  placeholder="2015"
                  min="1900"
                  max="2025"
                  className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-lg"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Tipo
                </label>
                <select
                  value={wineType}
                  onChange={(e) => setWineType(e.target.value)}
                  className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-purple-400 text-lg appearance-none cursor-pointer"
                >
                  <option value="red" className="bg-slate-800">
                    Tinto
                  </option>
                  <option value="white" className="bg-slate-800">
                    Branco
                  </option>
                  <option value="rosé" className="bg-slate-800">
                    Rosé
                  </option>
                  <option value="sparkling" className="bg-slate-800">
                    Espumante
                  </option>
                  <option value="dessert" className="bg-slate-800">
                    Sobremesa
                  </option>
                  <option value="fortified" className="bg-slate-800">
                    Fortificado
                  </option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Descrição (Opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Full-bodied do Alentejo..."
                rows={3}
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-4 text-red-200 text-center">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || uploadingPhoto}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto
                  ? "📸 A Carregar Foto..."
                  : loading
                  ? "A Adicionar..."
                  : "Adicionar Garrafa 🍷"}
              </button>

              <Link
                href={`/dinners/${id}`}
                className="block w-full text-center text-white/60 hover:text-white py-3"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
