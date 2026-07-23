"use client";

import type { PaymentStats } from "./types";

interface PaymentStatsStripProps {
  stats: PaymentStats;
}

export function PaymentStatsStrip({ stats }: PaymentStatsStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
      <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-3 md:p-4 text-center">
        <div className="text-blue-400 text-xs md:text-sm font-semibold mb-1">
          💰 Pagamentos
        </div>
        <div className="text-white text-xl md:text-2xl font-bold">
          {stats.total_payments}
        </div>
        <div className="text-blue-300 text-xs mt-1">{stats.base_amount}</div>
      </div>

      <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3 md:p-4 text-center">
        <div className="text-green-400 text-xs md:text-sm font-semibold mb-1">
          ✅ Pago
        </div>
        <div className="text-white text-xl md:text-2xl font-bold">
          {stats.paid_count}
        </div>
        <div className="text-green-300 text-xs mt-1">{stats.total_collected}</div>
      </div>

      <div className="bg-orange-500/20 border border-orange-400/30 rounded-xl p-3 md:p-4 text-center">
        <div className="text-orange-400 text-xs md:text-sm font-semibold mb-1">
          ⏳ Pendente
        </div>
        <div className="text-white text-xl md:text-2xl font-bold">
          {stats.pending_count}
        </div>
        <div className="text-orange-300 text-xs mt-1">{stats.total_pending}</div>
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
  );
}
