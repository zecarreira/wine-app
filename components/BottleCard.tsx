"use client";

import Link from "next/link";
import Image from "next/image";

export interface CatalogBottle {
  id: string;
  name: string;
  producer: string | null;
  vintage: number | null;
  wine_type: string | null;
  photo_url: string | null;
  average_rating: number;
  total_ratings: number;
  dinner: {
    name: string;
  };
  brought_by_user: {
    name: string;
  } | null;
}

const WINE_TYPE_ICONS: Record<string, string> = {
  red: "🍷",
  white: "🥂",
  rosé: "🌸",
  sparkling: "🍾",
  dessert: "🍯",
  other: "🍇",
};

const WINE_TYPE_LABELS: Record<string, string> = {
  red: "Tinto",
  white: "Branco",
  rosé: "Rosé",
  sparkling: "Espumante",
  dessert: "Sobremesa",
  other: "Outro",
};

function getWineTypeIcon(type: string | null) {
  if (!type) return "🍷";
  return WINE_TYPE_ICONS[type] || "🍷";
}

function getWineTypeLabel(type: string | null) {
  if (!type) return "Outro";
  return WINE_TYPE_LABELS[type] || "Outro";
}

interface BottleCardProps {
  bottle: CatalogBottle;
  variant: "grid" | "list";
}

export function BottleCard({ bottle, variant }: BottleCardProps) {
  if (variant === "list") {
    return (
      <Link
        href={`/bottles/${bottle.id}`}
        className="block bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-[colors,box-shadow] hover:shadow-xl hover:shadow-purple-500/20"
      >
        <div className="flex gap-6">
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
              <span className="text-4xl">{getWineTypeIcon(bottle.wine_type)}</span>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {bottle.name}
                </h3>
                {bottle.producer && (
                  <p className="text-purple-200 text-sm">{bottle.producer}</p>
                )}
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {bottle.average_rating > 0
                    ? bottle.average_rating.toFixed(1)
                    : "N/A"}
                </div>
                <div className="text-white/60 text-xs">
                  {bottle.total_ratings}{" "}
                  {bottle.total_ratings === 1
                    ? "classificação"
                    : "classificações"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-white/60 text-sm">
              {bottle.vintage && <span>📅 {bottle.vintage}</span>}
              <span>
                {getWineTypeIcon(bottle.wine_type)}{" "}
                {getWineTypeLabel(bottle.wine_type)}
              </span>
              <span>🍽️ {bottle.dinner.name}</span>
              {bottle.brought_by_user && (
                <span>👤 {bottle.brought_by_user.name}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/bottles/${bottle.id}`}
      className="group bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition-[colors,transform,box-shadow] hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20"
    >
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
          <span className="text-6xl">{getWineTypeIcon(bottle.wine_type)}</span>
        </div>
      )}

      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
          {bottle.name}
        </h3>

        <div className="space-y-1 mb-4">
          {bottle.producer && (
            <p className="text-purple-200 text-sm">🏭 {bottle.producer}</p>
          )}
          {bottle.vintage && (
            <p className="text-white/60 text-sm">📅 {bottle.vintage}</p>
          )}
        </div>

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
          <div className="text-3xl">{getWineTypeIcon(bottle.wine_type)}</div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-white/60 text-xs">🍽️ {bottle.dinner.name}</p>
          {bottle.brought_by_user && (
            <p className="text-white/60 text-xs">
              👤 Trazido por {bottle.brought_by_user.name}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default BottleCard;
