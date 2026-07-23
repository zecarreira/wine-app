import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { CatalogBottle } from "@/components/BottleCard";

// Types
interface Dinner {
  id: string;
  name: string;
  event_date: string;
  location: string;
  is_blind: boolean;
  status: string;
  host_id: string;
  created_by: string;
}

interface Bottle {
  id: string;
  name: string;
  description: string;
  vintage: number;
  producer: string;
  wine_type: string;
  position: number;
}

export interface ActiveSeasonDinner {
  id: string;
  name: string;
  event_date: string;
  location: string | null;
  is_blind: boolean;
  status?: string;
  dinner_number_in_season?: number | null;
  is_extra_dinner?: boolean;
  is_completed?: boolean;
}

export interface ActiveSeason {
  id: string;
  season_number: number;
  dinners: ActiveSeasonDinner[];
  stats: {
    total_dinners: number;
    regular_dinners: number;
    extra_dinners: number;
    is_full: boolean;
    can_close: boolean;
  };
}

export interface DinnerRatingUser {
  id: string;
  name: string;
}

export interface DinnerRatingItem {
  score: number;
  tasting_notes?: string | null;
  user?: DinnerRatingUser | null;
}

export interface DinnerRatingsBottle {
  id: string;
  name: string;
  producer?: string | null;
  vintage?: number | null;
  wine_type?: string | null;
  position?: number | null;
  ratings?: DinnerRatingItem[];
  stats?: {
    total_ratings: number;
    average_score: number;
    total_points: number;
    highest_rating: number;
  };
}

export interface DinnerRatingsResponse {
  success: boolean;
  bottles: DinnerRatingsBottle[];
  rankings: DinnerRatingsBottle[];
  stats?: {
    total_bottles: number;
    total_ratings: number;
  };
  message?: string;
}

export interface BottlesCatalogResponse {
  success: boolean;
  bottles: CatalogBottle[];
  producers: string[];
  total: number;
}

export function useActiveSeason() {
  return useQuery({
    queryKey: ["seasons", "active"],
    queryFn: async () => {
      const data = await apiFetch<{ success: boolean; season: ActiveSeason | null }>(
        "/api/seasons/active"
      );
      return data.season ?? null;
    },
  });
}

// Fetch dinners
export function useDinners() {
  return useQuery({
    queryKey: ["dinners"],
    queryFn: async () => {
      const data = await apiFetch<{ success: boolean; dinners: Dinner[] }>(
        "/api/dinners"
      );
      return data.dinners;
    },
  });
}

// Fetch dinner by ID
export function useDinner(id: string) {
  return useQuery({
    queryKey: ["dinners", id],
    queryFn: async () => {
      const data = await apiFetch<{ success: boolean; dinner: Dinner }>(
        `/api/dinners/${id}`
      );
      return data.dinner;
    },
    enabled: !!id,
  });
}

// Fetch bottles for a dinner
export function useDinnerBottles(dinnerId: string) {
  return useQuery({
    queryKey: ["dinners", dinnerId, "bottles"],
    queryFn: async () => {
      const data = await apiFetch<{ success: boolean; bottles: Bottle[] }>(
        `/api/dinners/${dinnerId}/bottles`
      );
      return data.bottles;
    },
    enabled: !!dinnerId,
  });
}

// Fetch ratings/rankings for a dinner
export function useDinnerRatings(dinnerId: string) {
  return useQuery({
    queryKey: ["dinners", dinnerId, "ratings"],
    queryFn: async () => {
      return apiFetch<DinnerRatingsResponse>(`/api/dinners/${dinnerId}/ratings`);
    },
    enabled: !!dinnerId,
  });
}

// Create dinner mutation
export function useCreateDinner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dinnerData: {
      name: string;
      event_date: string;
      location?: string | null;
      is_blind: boolean;
      is_extra?: boolean;
      organizer_id?: string | null;
    }) => {
      const data = await apiFetch<{ success: boolean; dinner: Dinner }>(
        "/api/dinners",
        { method: "POST", body: dinnerData }
      );
      return data.dinner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dinners"] });
      queryClient.invalidateQueries({ queryKey: ["seasons", "active"] });
    },
  });
}

// Submit rating mutation
export function useSubmitRating(bottleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ratingData: {
      score: number;
      tasting_notes?: string;
    }) => {
      const data = await apiFetch<{ success: boolean; rating: unknown }>(
        `/api/bottles/${bottleId}/ratings`,
        { method: "POST", body: ratingData }
      );
      return data.rating;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bottles", bottleId, "ratings"],
      });
    },
  });
}

// Fetch bottles catalog with filters
export function useBottlesCatalog(params?: {
  sortBy?: string;
  order?: string;
  producer?: string;
  wineType?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.order) searchParams.set("order", params.order);
  if (params?.producer) searchParams.set("producer", params.producer);
  if (params?.wineType) searchParams.set("wineType", params.wineType);

  return useQuery({
    queryKey: ["bottles", "catalog", params],
    queryFn: async () => {
      return apiFetch<BottlesCatalogResponse>(`/api/bottles?${searchParams}`);
    },
  });
}

export function useCloseSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seasonId: string) => {
      return apiFetch<{ success: boolean; message?: string }>(
        `/api/seasons/${seasonId}/close`,
        { method: "POST" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons", "active"] });
      queryClient.invalidateQueries({ queryKey: ["dinners"] });
    },
  });
}

export function useCreateSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiFetch<{ success: boolean; season: { season_number: number } }>(
        "/api/seasons",
        { method: "POST" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons", "active"] });
      queryClient.invalidateQueries({ queryKey: ["dinners"] });
    },
  });
}
