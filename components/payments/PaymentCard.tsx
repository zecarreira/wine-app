"use client";

import type { Fine, Payment } from "./types";

interface PaymentCardProps {
  payment: Payment;
  isAdmin: boolean;
  actionLoading: boolean;
  onMarkAsPaid: (paymentId: string, status: string) => void;
  onAddFine: (paymentId: string) => void;
  onEditFine: (paymentId: string, fine: Fine) => void;
  onDeleteFine: (paymentId: string, fineId: string, amount: number) => void;
}

export function PaymentCard({
  payment,
  isAdmin,
  actionLoading,
  onMarkAsPaid,
  onAddFine,
  onEditFine,
  onDeleteFine,
}: PaymentCardProps) {
  return (
    <div
      className={`bg-white/5 border rounded-xl p-4 ${
        payment.status === "paid"
          ? "border-green-400/30"
          : "border-orange-400/30"
      }`}
    >
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

      <div className="grid grid-cols-2 gap-2 text-xs md:text-sm mb-3">
        <div className="text-white/70">
          Valor:{" "}
          <span className="text-white font-semibold">{payment.base_amount}</span>
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
                  <div className="text-white/60 text-xs">{fine.reason}</div>
                  <div className="text-white/40 text-[10px] mt-1">
                    Adicionada por {fine.admin.name} •{" "}
                    {new Date(fine.created_at).toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon" })}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button type="button"
                      onClick={() => onEditFine(payment.id, fine)}
                      disabled={actionLoading}
                      aria-label="Editar multa"
                      className="bg-blue-500/30 text-blue-300 border border-blue-400/50 hover:bg-blue-500/40 px-2 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50"
                    >
                      ✏️
                    </button>
                    <button type="button"
                      onClick={() =>
                        onDeleteFine(payment.id, fine.id, fine.amount)
                      }
                      disabled={actionLoading}
                      aria-label="Remover multa"
                      className="bg-red-600/30 text-red-300 border border-red-400/50 hover:bg-red-600/40 px-2 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
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
          Pago em {new Date(payment.paid_at).toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon" })}
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
          <button type="button"
            onClick={() => onMarkAsPaid(payment.id, payment.status)}
            disabled={actionLoading}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
              payment.status === "paid"
                ? "bg-orange-500/30 text-orange-300 border border-orange-400/50 hover:bg-orange-500/40"
                : "bg-green-500/30 text-green-300 border border-green-400/50 hover:bg-green-500/40"
            }`}
          >
            {payment.status === "paid"
              ? "⏳ Marcar Pendente"
              : "✅ Marcar Pago"}
          </button>
          <button type="button"
            onClick={() => onAddFine(payment.id)}
            disabled={actionLoading}
            className="bg-red-500/30 text-red-300 border border-red-400/50 hover:bg-red-500/40 px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
          >
            🚨 Adicionar Multa
          </button>
        </div>
      )}
    </div>
  );
}
