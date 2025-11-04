"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Fine {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  admin: {
    id: string;
    name: string;
  };
}

interface Payment {
  id: string;
  dinner_id: string;
  user_id: string;
  base_amount: number;
  status: "pending" | "paid";
  paid_at: string | null;
  created_at: string;
  user: User;
  fines: Fine[];
  total_fines: number;
  total_amount: number;
}

interface PaymentStats {
  total_payments: number;
  paid_count: number;
  pending_count: number;
  total_collected: number;
  total_pending: number;
  base_amount: number;
  total_fines: number;
}

interface PaymentsSectionProps {
  dinnerId: string;
  isAdmin: boolean;
}

export function PaymentsSection({ dinnerId, isAdmin }: PaymentsSectionProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFineModal, setShowFineModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null
  );
  const [selectedFineId, setSelectedFineId] = useState<string | null>(null);
  const [isEditingFine, setIsEditingFine] = useState(false);
  const [fineAmount, setFineAmount] = useState("");
  const [fineReason, setFineReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchPayments() {
    try {
      setLoading(true);
      const response = await fetch(`/api/dinners/${dinnerId}/payments`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.payments);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dinnerId]);

  async function handleMarkAsPaid(paymentId: string, currentStatus: string) {
    if (!isAdmin) return;

    try {
      setActionLoading(true);
      const newStatus = currentStatus === "paid" ? "pending" : "paid";
      const token = localStorage.getItem("token");

      const response = await fetch(
        `/api/dinners/${dinnerId}/payments/${paymentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        await fetchPayments();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to update payment:", error);
      alert("Falhou ao atualizar estado do pagamento");
    } finally {
      setActionLoading(false);
    }
  }

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

  async function handleAddFine() {
    if (!selectedPaymentId || !fineAmount || !fineReason.trim()) {
      alert("Por favor preenche todos os campos");
      return;
    }

    const amount = parseInt(fineAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("O valor da multa tem de ser um número positivo");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      if (isEditingFine && selectedFineId) {
        // Update existing fine
        const response = await fetch(
          `/api/dinners/${dinnerId}/payments/${selectedPaymentId}/fines/${selectedFineId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              amount,
              reason: fineReason.trim(),
            }),
          }
        );

        if (response.ok) {
          closeFineModal();
          await fetchPayments();
        } else {
          const error = await response.json();
          alert(`Erro: ${error.error}`);
        }
      } else {
        // Add new fine
        const response = await fetch(
          `/api/dinners/${dinnerId}/payments/${selectedPaymentId}/fines`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              amount,
              reason: fineReason.trim(),
            }),
          }
        );

        if (response.ok) {
          closeFineModal();
          await fetchPayments();
        } else {
          const error = await response.json();
          alert(`Erro: ${error.error}`);
        }
      }
    } catch (error) {
      console.error("Failed to save fine:", error);
      alert("Falhou ao guardar multa");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteFine(
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
      const token = localStorage.getItem("token");

      const response = await fetch(
        `/api/dinners/${dinnerId}/payments/${paymentId}/fines/${fineId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchPayments();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to delete fine:", error);
      alert("Falhou ao remover multa");
    } finally {
      setActionLoading(false);
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

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-3 md:p-4 text-center">
          <div className="text-blue-400 text-xs md:text-sm font-semibold mb-1">
            👥 Pagamentos
          </div>
          <div className="text-white text-xl md:text-2xl font-bold">
            {stats.total_payments}
          </div>
        </div>

        <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3 md:p-4 text-center">
          <div className="text-green-400 text-xs md:text-sm font-semibold mb-1">
            ✅ Pago
          </div>
          <div className="text-white text-xl md:text-2xl font-bold">
            {stats.paid_count}
          </div>
          <div className="text-green-300 text-xs mt-1">
            {stats.total_collected}
          </div>
        </div>

        <div className="bg-orange-500/20 border border-orange-400/30 rounded-xl p-3 md:p-4 text-center">
          <div className="text-orange-400 text-xs md:text-sm font-semibold mb-1">
            ⏳ Pendente
          </div>
          <div className="text-white text-xl md:text-2xl font-bold">
            {stats.pending_count}
          </div>
          <div className="text-orange-300 text-xs mt-1">
            {stats.total_pending}
          </div>
        </div>

        <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-3 md:p-4 text-center">
          <div className="text-purple-400 text-xs md:text-sm font-semibold mb-1">
            💵 Valor
          </div>
          <div className="text-white text-xl md:text-2xl font-bold">
            {stats.base_amount}
          </div>
        </div>

        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 md:p-4 text-center">
          <div className="text-red-400 text-xs md:text-sm font-semibold mb-1">
            🚨 Multas
          </div>
          <div className="text-white text-xl md:text-2xl font-bold">
            {stats.total_fines}
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className={`bg-white/5 border rounded-xl p-4 ${
              payment.status === "paid"
                ? "border-green-400/30"
                : "border-orange-400/30"
            }`}
          >
            {/* User Info & Status */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-white font-semibold text-base">
                {payment.user.name}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold ${
                  payment.status === "paid"
                    ? "bg-green-500/30 text-green-300 border border-green-400/50"
                    : "bg-orange-500/30 text-orange-300 border border-orange-400/50"
                }`}
              >
                {payment.status === "paid" ? "✅ PAGO" : "⏳ PENDENTE"}
              </span>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-2 text-xs md:text-sm mb-3">
              <div className="text-white/70">
                Valor:{" "}
                <span className="text-white font-semibold">
                  {payment.base_amount}
                </span>
              </div>
              {payment.total_fines > 0 && (
                <div className="text-red-300">
                  Multas:{" "}
                  <span className="text-red-400 font-semibold">
                    +{payment.total_fines}
                  </span>
                </div>
              )}
              <div className="text-white col-span-2">
                Total:{" "}
                <span className="text-white font-bold text-sm md:text-base">
                  {payment.total_amount}
                </span>
              </div>
            </div>

            {/* Fines Details */}
            {payment.fines.length > 0 && (
              <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3 space-y-2 mb-3">
                <div className="text-red-300 text-xs font-bold mb-2">
                  🚨 Multas ({payment.fines.length})
                </div>
                {payment.fines.map((fine) => (
                  <div
                    key={fine.id}
                    className="bg-red-500/5 rounded-lg p-2 border border-red-400/10"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <div className="font-semibold text-red-300 text-xs md:text-sm">
                          +{fine.amount}
                        </div>
                        <div className="text-white/60 text-xs">
                          {fine.reason}
                        </div>
                        <div className="text-white/40 text-[10px] mt-1">
                          Adicionada por {fine.admin.name} •{" "}
                          {new Date(fine.created_at).toLocaleDateString(
                            "pt-PT"
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditFineModal(payment.id, fine)}
                            disabled={actionLoading}
                            className="bg-blue-500/30 text-blue-300 border border-blue-400/50 hover:bg-blue-500/40 px-2 py-1 rounded text-[10px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteFine(payment.id, fine.id, fine.amount)
                            }
                            disabled={actionLoading}
                            className="bg-red-600/30 text-red-300 border border-red-400/50 hover:bg-red-600/40 px-2 py-1 rounded text-[10px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {payment.paid_at && (
              <div className="text-green-300 text-xs mb-3">
                Pago em {new Date(payment.paid_at).toLocaleDateString("pt-PT")}
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => handleMarkAsPaid(payment.id, payment.status)}
                  disabled={actionLoading}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    payment.status === "paid"
                      ? "bg-orange-500/30 text-orange-300 border border-orange-400/50 hover:bg-orange-500/40"
                      : "bg-green-500/30 text-green-300 border border-green-400/50 hover:bg-green-500/40"
                  }`}
                >
                  {payment.status === "paid"
                    ? "⏳ Marcar Pendente"
                    : "✅ Marcar Pago"}
                </button>
                <button
                  onClick={() => openFineModal(payment.id)}
                  disabled={actionLoading}
                  className="bg-red-500/30 text-red-300 border border-red-400/50 hover:bg-red-500/40 px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🚨 Adicionar Multa
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Fine Modal */}
      {showFineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-red-400/30 rounded-2xl p-4 md:p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
              {isEditingFine ? "✏️ Editar Multa" : "🚨 Adicionar Multa"}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-white/70 text-xs md:text-sm font-semibold mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  min="1"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                  placeholder="Insere o valor da multa"
                />
              </div>

              <div>
                <label className="block text-white/70 text-xs md:text-sm font-semibold mb-2">
                  Motivo
                </label>
                <textarea
                  value={fineReason}
                  onChange={(e) => setFineReason(e.target.value)}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-400/50 resize-none"
                  placeholder="Porque é que esta multa está a ser adicionada?"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeFineModal}
                disabled={actionLoading}
                className="flex-1 bg-white/10 border border-white/20 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm md:text-base font-bold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddFine}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm md:text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading
                  ? "A guardar..."
                  : isEditingFine
                  ? "Guardar"
                  : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
