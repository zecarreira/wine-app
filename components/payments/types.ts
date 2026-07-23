export interface PaymentUser {
  id: string;
  name: string;
  email: string;
}

export interface Fine {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  admin: {
    id: string;
    name: string;
  };
}

export interface Payment {
  id: string;
  dinner_id: string;
  user_id: string;
  base_amount: number;
  status: "pending" | "paid";
  paid_at: string | null;
  created_at: string;
  user: PaymentUser;
  fines: Fine[];
  total_fines: number;
  total_amount: number;
}

export interface PaymentStats {
  total_payments: number;
  paid_count: number;
  pending_count: number;
  total_collected: number;
  total_pending: number;
  base_amount: number;
  total_fines: number;
}
