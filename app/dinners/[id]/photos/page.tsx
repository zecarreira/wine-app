"use client";

import { useState } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/components/AuthProvider";

interface Photo {
  id: string;
  photo_url: string;
  created_at: string;
  uploaded_by_user: {
    id: string;
    name: string;
  };
}

interface Dinner {
  id: string;
  name: string;
  event_date: string;
}

interface DinnerApiResponse {
  success?: boolean;
  dinner?: Dinner;
  dinners?: Dinner[];
}

interface PhotosApiResponse {
  success?: boolean;
  photos?: Photo[];
}

export default function DinnerPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { user: authUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dinners", id, "photos-page"],
    queryFn: async () => {
      const [dinnerData, photosData] = await Promise.all([
        apiFetch<DinnerApiResponse>(`/api/dinners/${id}`),
        apiFetch<PhotosApiResponse>(`/api/dinners/${id}/photos`),
      ]);
      const currentDinner =
        dinnerData.dinner ??
        dinnerData.dinners?.find((d) => d.id === id) ??
        null;
      return {
        dinner: currentDinner,
        photos: photosData.photos ?? [],
      };
    },
  });

  const dinner = data?.dinner ?? null;
  const photos = data?.photos ?? [];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  }

  async function uploadPhotos() {
    if (selectedFiles.length === 0) return;

    if (!authUser) {
      toastError("Por favor faz login primeiro");
      router.push("/login");
      return;
    }

    setUploading(true);
    try {
      // Upload each file
      for (const file of selectedFiles) {
        // 1. Upload to storage (FormData — cookie session)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "dinner-photos");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        }).catch(() => null);

        if (!uploadResponse) {
          toastError("Erro de rede. Tenta novamente.");
          return;
        }

        const uploadData = await uploadResponse.json().catch(() => null);
        if (!uploadData?.success) {
          toastError(
            "Erro ao fazer upload das fotos: " +
              (uploadData?.error ?? "Erro desconhecido"),
          );
          return;
        }

        // 2. Save photo record to database
        try {
          await apiFetch(`/api/dinners/${id}/photos`, {
            method: "POST",
            body: { photo_url: uploadData.url },
          });
        } catch (error) {
          toastError(
            "Erro ao guardar foto: " +
              (error instanceof Error ? error.message : "Erro desconhecido"),
          );
          return;
        }
      }

      // Refresh photos
      await refetch();
      setSelectedFiles([]);
      success("Fotos carregadas com sucesso!");
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">📸</div>
          <div className="text-white text-xl">A carregar fotos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button type="button"
            onClick={() => router.back()}
            aria-label="Voltar"
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </button>
          <Link
            href="/"
            aria-label="Início"
            className="text-white/80 hover:text-white text-2xl"
          >
            🏠
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📸</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Galeria de Fotos
          </h1>
          {dinner && (
            <p className="text-purple-200">
              {dinner.name} •{" "}
              {new Date(dinner.event_date).toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon" })}
            </p>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Carregar Fotos</h2>

          <div className="space-y-4">
            <label className="block w-full bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors">
              <div className="text-5xl mb-2">📷</div>
              <div className="text-white/60">Clica para selecionar fotos</div>
              <div className="text-white/40 text-sm mt-1">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} ficheiro${
                      selectedFiles.length !== 1 ? "s" : ""
                    } selecionado${selectedFiles.length !== 1 ? "s" : ""}`
                  : "Podes selecionar várias fotos"}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {selectedFiles.length > 0 && (
              <button type="button"
                onClick={uploadPhotos}
                disabled={uploading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02] transition-[colors,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/70"
              >
                {uploading
                  ? "📤 A carregar..."
                  : `📤 Carregar ${selectedFiles.length} Foto${
                      selectedFiles.length !== 1 ? "s" : ""
                    }`}
              </button>
            )}
          </div>
        </div>

        {/* Gallery */}
        {photos.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/10">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-white/60 text-lg">Ainda não há fotos</p>
            <p className="text-white/40 text-sm mt-2">
              Carrega algumas memórias!
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Galeria ({photos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={`Ver foto de ${photo.uploaded_by_user.name}`}
                  className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group w-full"
                >
                  <Image
                    src={photo.photo_url}
                    alt="Foto do jantar"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-3">
                    <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.uploaded_by_user.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
            role="presentation"
          >
            <button type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
              aria-label="Fechar"
              className="absolute top-4 right-4 text-white text-4xl hover:text-red-400 transition-colors"
            >
              ×
            </button>

            {lightboxIndex > 0 && (
              <button type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev ?? 0) - 1);
                }}
                aria-label="Foto anterior"
                className="absolute left-4 text-white text-6xl hover:text-purple-400 transition-colors"
              >
                ‹
              </button>
            )}

            <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
              <Image
                src={photos[lightboxIndex].photo_url}
                alt="Tamanho completo"
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {lightboxIndex < photos.length - 1 && (
              <button type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev ?? 0) + 1);
                }}
                aria-label="Próxima foto"
                className="absolute right-4 text-white text-6xl hover:text-purple-400 transition-colors"
              >
                ›
              </button>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
