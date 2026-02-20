"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import { useBottlesCatalog } from "@/lib/hooks/useApi";

export default function BottlesCatalogPage() {
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [selectedProducer, setSelectedProducer] = useState("");
  const [selectedWineType, setSelectedWineType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch bottles with React Query
  const { data, isLoading } = useBottlesCatalog({
    sortBy,
    order,
    producer: selectedProducer,
    wineType: selectedWineType,
  });

  const bottles = data?.bottles || [];
  const producers = data?.producers || [];

  const wineTypes = [
    { value: "all", label: "Todos os Tipos", icon: "🍷" },
    { value: "red", label: "Tinto", icon: "🍷" },
    { value: "white", label: "Branco", icon: "🥂" },
    { value: "rosé", label: "Rosé", icon: "🌸" },
    { value: "sparkling", label: "Espumante", icon: "🍾" },
    { value: "dessert", label: "Sobremesa", icon: "🍯" },
    { value: "other", label: "Outro", icon: "🍇" },
  ];

  const getWineTypeIcon = (type: string | null) => {
    const wineType = wineTypes.find((t) => t.value === type);
    return wineType?.icon || "🍷";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header useBackButton />

      <main className="container mx-auto px-4 py-8 pb-24 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🍷 Catálogo de Vinhos
          </h1>
          <p className="text-white/60">
            Todos os vinhos que já apareceram nos jantares
          </p>
        </div>

        {/* Filters & Controls - Custom Dropdowns */}
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700">
          <div className="space-y-3">
            {/* Sort By */}
            <div>
              <p className="block text-white/90 text-xs font-semibold mb-1.5">
                Ordenar por
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => setSortBy("name")}
                  aria-pressed={sortBy === "name"}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    sortBy === "name"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 text-white/70 hover:bg-slate-700"
                  }`}
                >
                  Nome
                </button>
                <button
                  onClick={() => setSortBy("producer")}
                  aria-pressed={sortBy === "producer"}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    sortBy === "producer"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 text-white/70 hover:bg-slate-700"
                  }`}
                >
                  Produtor
                </button>
                <button
                  onClick={() => setSortBy("rating")}
                  aria-pressed={sortBy === "rating"}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    sortBy === "rating"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 text-white/70 hover:bg-slate-700"
                  }`}
                >
                  Rating
                </button>
                <button
                  onClick={() => setSortBy("vintage")}
                  aria-pressed={sortBy === "vintage"}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    sortBy === "vintage"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 text-white/70 hover:bg-slate-700"
                  }`}
                >
                  Ano
                </button>
              </div>
            </div>

            {/* Order */}
            <div>
              <p className="block text-white/90 text-xs font-semibold mb-1.5">
                Ordem
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setOrder("asc")}
                  aria-pressed={order === "asc"}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    order === "asc"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 text-white/70 hover:bg-slate-700"
                  }`}
                >
                  ⬆️ Crescente
                </button>
                <button
                  onClick={() => setOrder("desc")}
                  aria-pressed={order === "desc"}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    order === "desc"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 text-white/70 hover:bg-slate-700"
                  }`}
                >
                  ⬇️ Decrescente
                </button>
              </div>
            </div>

            {/* Producer Filter */}
            <div>
              <p className="block text-white/90 text-xs font-semibold mb-1.5">
                Produtor
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedProducer("")}
                  aria-pressed={selectedProducer === ""}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedProducer === ""
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 text-white/70 hover:bg-slate-700"
                  }`}
                >
                  Todos
                </button>
                {producers.slice(0, 4).map((producer: string) => (
                  <button
                    key={producer}
                    onClick={() => setSelectedProducer(producer)}
                    aria-pressed={selectedProducer === producer}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedProducer === producer
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-white/70 hover:bg-slate-700"
                    }`}
                  >
                    {producer}
                  </button>
                ))}
              </div>
              {producers.length > 4 && (
                <details className="mt-2">
                  <summary className="text-white/60 text-xs cursor-pointer hover:text-white">
                    Ver mais produtores ({producers.length - 4})
                  </summary>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {producers.slice(4).map((producer: string) => (
                      <button
                        key={producer}
                        onClick={() => setSelectedProducer(producer)}
                        aria-pressed={selectedProducer === producer}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          selectedProducer === producer
                            ? "bg-purple-600 text-white"
                            : "bg-slate-900 text-white/70 hover:bg-slate-700"
                        }`}
                      >
                        {producer}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Wine Type Filter */}
            <div>
              <p className="block text-white/90 text-xs font-semibold mb-1.5">
                Tipo de Vinho
              </p>
              <div className="flex flex-wrap gap-1.5">
                {wineTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedWineType(type.value)}
                    aria-pressed={selectedWineType === type.value}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedWineType === type.value
                        ? "bg-purple-600 text-white"
                        : "bg-slate-900 text-white/70 hover:bg-slate-700"
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* View Mode Toggle & Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-white/60">
              {bottles.length} {bottles.length === 1 ? "vinho" : "vinhos"}{" "}
              encontrados
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Vista em grelha"
                aria-pressed={viewMode === "grid"}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === "grid"
                    ? "bg-purple-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                🔲 Grelha
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-label="Vista em lista"
                aria-pressed={viewMode === "list"}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === "list"
                    ? "bg-purple-500 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                📋 Lista
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 motion-safe:animate-spin" aria-hidden="true">🍷</div>
            <div role="status" className="text-white text-xl">A carregar vinhos…</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && bottles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍾</div>
            <div className="text-white text-xl mb-2">
              Nenhum vinho encontrado
            </div>
            <p className="text-white/60">
              Experimenta ajustar os filtros ou adiciona vinhos aos jantares
            </p>
          </div>
        )}

        {/* Grid View */}
        {!isLoading && bottles.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bottles.map((bottle: any) => (
              <Link
                key={bottle.id}
                href={`/bottles/${bottle.id}`}
                className="group bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition-[colors,transform,box-shadow] hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20"
              >
                {/* Image */}
                {bottle.photo_url ? (
                  <div className="relative h-48 bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                    <Image
                      src={bottle.photo_url}
                      alt={bottle.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
                    <span className="text-6xl">
                      {getWineTypeIcon(bottle.wine_type)}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Wine Name */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {bottle.name}
                  </h3>

                  {/* Producer & Vintage */}
                  <div className="space-y-1 mb-4">
                    {bottle.producer && (
                      <p className="text-purple-200 text-sm">
                        🏭 {bottle.producer}
                      </p>
                    )}
                    {bottle.vintage && (
                      <p className="text-white/60 text-sm">
                        📅 {bottle.vintage}
                      </p>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-amber-400">
                        {bottle.average_rating > 0
                          ? bottle.average_rating.toFixed(1)
                          : "N/A"}
                      </div>
                      <div className="text-white/60 text-xs">
                        {bottle.total_ratings}{" "}
                        {bottle.total_ratings === 1 ? "classificação" : "classificações"}
                      </div>
                    </div>
                    <div className="text-3xl">
                      {getWineTypeIcon(bottle.wine_type)}
                    </div>
                  </div>

                  {/* Dinner Info */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/60 text-xs">
                      🍽️ {bottle.dinner.name}
                    </p>
                    {bottle.brought_by_user && (
                      <p className="text-white/60 text-xs">
                        👤 Trazido por {bottle.brought_by_user.name}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* List View */}
        {!isLoading && bottles.length > 0 && viewMode === "list" && (
          <div className="space-y-4">
            {bottles.map((bottle: any) => (
              <Link
                key={bottle.id}
                href={`/bottles/${bottle.id}`}
                className="block bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-[colors,box-shadow] hover:shadow-xl hover:shadow-purple-500/20"
              >
                <div className="flex gap-6">
                  {/* Image */}
                  {bottle.photo_url ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={bottle.photo_url}
                        alt={bottle.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center shrink-0">
                      <span className="text-4xl">
                        {getWineTypeIcon(bottle.wine_type)}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {bottle.name}
                        </h3>
                        {bottle.producer && (
                          <p className="text-purple-200 text-sm">
                            {bottle.producer}
                          </p>
                        )}
                      </div>

                      {/* Rating Badge */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-400">
                          {bottle.average_rating > 0
                            ? bottle.average_rating.toFixed(1)
                            : "N/A"}
                        </div>
                        <div className="text-white/60 text-xs">
                          {bottle.total_ratings}{" "}
                          {bottle.total_ratings === 1 ? "classificação" : "classificações"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-white/60 text-sm">
                      {bottle.vintage && <span>📅 {bottle.vintage}</span>}
                      <span>
                        {getWineTypeIcon(bottle.wine_type)}{" "}
                        {wineTypes.find((t) => t.value === bottle.wine_type)
                          ?.label || "Outro"}
                      </span>
                      <span>🍽️ {bottle.dinner.name}</span>
                      {bottle.brought_by_user && (
                        <span>👤 {bottle.brought_by_user.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
