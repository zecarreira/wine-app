"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

export default function DinnerPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dinner, setDinner] = useState<Dinner | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchDinnerAndPhotos();
  }, [id]);

  async function fetchDinnerAndPhotos() {
    try {
      // Fetch dinner info
      const dinnerResponse = await fetch("/api/dinners");
      const dinnerData = await dinnerResponse.json();
      const currentDinner = dinnerData.dinners.find((d: any) => d.id === id);
      setDinner(currentDinner);

      // Fetch photos
      const photosResponse = await fetch(`/api/dinners/${id}/photos`);
      const photosData = await photosResponse.json();

      if (photosData.success) {
        setPhotos(photosData.photos);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  }

  async function uploadPhotos() {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first");
        router.push("/login");
        return;
      }

      // Upload each file
      for (const file of selectedFiles) {
        // 1. Upload to storage
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "dinner-photos");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          throw new Error(uploadData.error);
        }

        // 2. Save photo record to database
        const photoResponse = await fetch(`/api/dinners/${id}/photos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            photo_url: uploadData.url,
          }),
        });

        const photoData = await photoResponse.json();

        if (!photoData.success) {
          throw new Error(photoData.error);
        }
      }

      // Refresh photos
      await fetchDinnerAndPhotos();
      setSelectedFiles([]);
    } catch (error: any) {
      alert("Error uploading photos: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">📸</div>
          <div className="text-white text-xl">Loading photos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📸</div>
          <h1 className="text-4xl font-bold text-white mb-2">Photo Gallery</h1>
          {dinner && (
            <p className="text-purple-200">
              {dinner.name} • {new Date(dinner.event_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Upload Photos</h2>

          <div className="space-y-4">
            <label className="block w-full bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors">
              <div className="text-5xl mb-2">📷</div>
              <div className="text-white/60">Click to select photos</div>
              <div className="text-white/40 text-sm mt-1">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file${
                      selectedFiles.length !== 1 ? "s" : ""
                    } selected`
                  : "Multiple files supported"}
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
              <button
                onClick={uploadPhotos}
                disabled={uploading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-green-500/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading
                  ? "📤 Uploading..."
                  : `📤 Upload ${selectedFiles.length} Photo${
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
            <p className="text-white/60 text-lg">No photos yet</p>
            <p className="text-white/40 text-sm mt-2">Upload some memories!</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Gallery ({photos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={photo.photo_url}
                    alt="Dinner photo"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-3">
                    <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.uploaded_by_user.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
              className="absolute top-4 right-4 text-white text-4xl hover:text-red-400 transition-colors"
            >
              ×
            </button>

            {lightboxIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex - 1);
                }}
                className="absolute left-4 text-white text-6xl hover:text-purple-400 transition-colors"
              >
                ‹
              </button>
            )}

            <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
              <Image
                src={photos[lightboxIndex].photo_url}
                alt="Full size"
                fill
                className="object-contain"
              />
            </div>

            {lightboxIndex < photos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex + 1);
                }}
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
