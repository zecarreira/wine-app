import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

// Fetch dinners
export function useDinners() {
  return useQuery({
    queryKey: ["dinners"],
    queryFn: async () => {
      const response = await fetch("/api/dinners");
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.dinners as Dinner[];
    },
  });
}

// Fetch dinner by ID
export function useDinner(id: string) {
  return useQuery({
    queryKey: ["dinners", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/dinners/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.dinner as Dinner;
    },
    enabled: !!id,
  });
}

// Fetch bottles for a dinner
export function useDinnerBottles(dinnerId: string) {
  return useQuery({
    queryKey: ["dinners", dinnerId, "bottles"],
    queryFn: async () => {
      const response = await fetch(`/api/dinners/${dinnerId}/bottles`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.bottles as Bottle[];
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
      location?: string;
      is_blind: boolean;
    }) => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/dinners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dinnerData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.dinner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dinners"] });
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
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bottles/${bottleId}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ratingData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
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
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bottles?${searchParams}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
  });
}
