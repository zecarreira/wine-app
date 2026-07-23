"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Payment, PaymentStats } from "@/components/payments/types";

export function usePayments(dinnerId: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{
        payments: Payment[];
        stats: PaymentStats;
      }>(`/api/dinners/${dinnerId}/payments`);
      setPayments(data.payments);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  }, [dinnerId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function markAsPaid(paymentId: string, currentStatus: string) {
    try {
      setActionLoading(true);
      const newStatus = currentStatus === "paid" ? "pending" : "paid";
      await apiFetch(`/api/dinners/${dinnerId}/payments/${paymentId}`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      await refetch();
    } catch (error) {
      console.error("Failed to update payment:", error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }

  async function saveFine(
    paymentId: string,
    amount: number,
    reason: string,
    fineId?: string | null
  ) {
    try {
      setActionLoading(true);
      const body = { amount, reason };

      if (fineId) {
        await apiFetch(
          `/api/dinners/${dinnerId}/payments/${paymentId}/fines/${fineId}`,
          { method: "PATCH", body }
        );
      } else {
        await apiFetch(
          `/api/dinners/${dinnerId}/payments/${paymentId}/fines`,
          { method: "POST", body }
        );
      }
      await refetch();
    } catch (error) {
      console.error("Failed to save fine:", error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteFine(
    paymentId: string,
    fineId: string,
    fineAmount: number
  ) {
    if (
      !confirm(`Tens a certeza que queres remover esta multa de ${fineAmount}?`)
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await apiFetch(
        `/api/dinners/${dinnerId}/payments/${paymentId}/fines/${fineId}`,
        { method: "DELETE" }
      );
      await refetch();
    } catch (error) {
      console.error("Failed to delete fine:", error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }

  return {
    payments,
    stats,
    loading,
    actionLoading,
    refetch,
    markAsPaid,
    saveFine,
    deleteFine,
  };
}

export type { Payment, PaymentStats };
