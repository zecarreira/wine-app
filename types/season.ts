export interface Season {
  id: string;
  season_number: number;
  start_date: string;
  end_date: string | null;
  status: "active" | "completed";
  created_at: string;
  updated_at: string;
}

export interface SeasonWithStats extends Season {
  total_dinners: number;
  extra_dinners: number;
  regular_dinners: number;
}

export interface SeasonWithDinners extends Season {
  dinners: Dinner[];
}

export interface Dinner {
  id: string;
  name: string;
  event_date: string;
  location: string | null;
  is_blind: boolean;
  created_by: string;
  season_id: string | null;
  dinner_number_in_season: number | null;
  is_extra_dinner: boolean;
  created_at: string;
  status?: string;
}
