"use client";

import { useState } from "react";
import { usePayments } from "@/lib/hooks/usePayments";
import type { Fine } from "@/components/payments/types";
import { FineModal } from "@/components/payments/FineModal";
import { PaymentCard } from "@/components/payments/PaymentCard";
import { PaymentStatsStrip } from "@/components/payments/PaymentStatsStrip";
import { useToast } from "@/components/ToastProvider";

interface PaymentsSectionProps {
  dinnerId: string;
  isAdmin: boolean;
}

export function PaymentsSection({ dinnerId, isAdmin }: PaymentsSectionProps) {
  const { error: toastError } = useToast();
  const {
    payments,
    stats,
    loading,
    actionLoading,
    markAsPaid,
    saveFine,
    deleteFine,
  } = usePayments(dinnerId);

  const [showFineModal, setShowFineModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null
  );
  const [selectedFineId, setSelectedFineId] = useState<string | null>(null);
  const [isEditingFine, setIsEditingFine] = useState(false);
  const [fineAmount, setFineAmount] = useState("");
  const [fineReason, setFineReason] = useState("");

  function openFineModal(paymentId: string) {
    setSelectedPaymentId(paymentId);
    setSelectedFineId(null);
    setIsEditingFine(false);
    setFineAmount("");
    setFineReason("");
    setShowFineModal(true);
  }

  function openEditFineModal(paymentId: string, fine: Fine) {
    setSelectedPaymentId(paymentId);
    setSelectedFineId(fine.id);
    setIsEditingFine(true);
    setFineAmount(fine.amount.toString());
    setFineReason(fine.reason);
    setShowFineModal(true);
  }

  function closeFineModal() {
    setShowFineModal(false);
    setSelectedPaymentId(null);
    setSelectedFineId(null);
    setIsEditingFine(false);
    setFineAmount("");
    setFineReason("");
  }

  async function handleSaveFine() {
    if (!selectedPaymentId || !fineAmount || !fineReason.trim()) {
      toastError("Por favor preenche todos os campos");
      return;
    }

    const amount = parseInt(fineAmount);
    if (isNaN(amount) || amount <= 0) {
      toastError("O valor da multa tem de ser um número positivo");
      return;
    }

    try {
      await saveFine(
        selectedPaymentId,
        amount,
        fineReason.trim(),
        isEditingFine ? selectedFineId : null
      );
      closeFineModal();
    } catch (err) {
      toastError(
        err instanceof Error ? `Erro: ${err.message}` : "Falhou ao guardar multa"
      );
    }
  }

  async function handleMarkAsPaid(paymentId: string, currentStatus: string) {
    if (!isAdmin) return;
    try {
      await markAsPaid(paymentId, currentStatus);
    } catch (err) {
      toastError(
        err instanceof Error
          ? `Erro: ${err.message}`
          : "Falhou ao atualizar estado do pagamento"
      );
    }
  }

  async function handleDeleteFine(
    paymentId: string,
    fineId: string,
    fineAmount: number
  ) {
    try {
      await deleteFine(paymentId, fineId, fineAmount);
    } catch (err) {
      toastError(
        err instanceof Error
          ? `Erro: ${err.message}`
          : "Falhou ao remover multa"
      );
    }
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/20 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">💰 Pagamentos</h2>
        <div className="text-white/70">A carregar pagamentos...</div>
      </div>
    );
  }

  if (!stats || payments.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/20 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">💰 Pagamentos</h2>
        <div className="text-white/70">Ainda não há pagamentos</div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/20 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6">💰 Pagamentos</h2>

      <PaymentStatsStrip stats={stats} />

      <div className="space-y-3">
        {payments.map((payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            isAdmin={isAdmin}
            actionLoading={actionLoading}
            onMarkAsPaid={handleMarkAsPaid}
            onAddFine={openFineModal}
            onEditFine={openEditFineModal}
            onDeleteFine={handleDeleteFine}
          />
        ))}
      </div>

      <FineModal
        open={showFineModal}
        isEditing={isEditingFine}
        amount={fineAmount}
        reason={fineReason}
        loading={actionLoading}
        onAmountChange={setFineAmount}
        onReasonChange={setFineReason}
        onClose={closeFineModal}
        onSave={handleSaveFine}
      />
    </div>
  );
}
