"use client";

interface FineModalProps {
  open: boolean;
  isEditing: boolean;
  amount: string;
  reason: string;
  loading: boolean;
  onAmountChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function FineModal({
  open,
  isEditing,
  amount,
  reason,
  loading,
  onAmountChange,
  onReasonChange,
  onClose,
  onSave,
}: FineModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border-2 border-red-400/30 rounded-2xl p-4 md:p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
          {isEditing ? "✏️ Editar Multa" : "🚨 Adicionar Multa"}
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="fine-amount"
              className="block text-white/70 text-xs md:text-sm font-semibold mb-2"
            >
              Valor
            </label>
            <input
              id="fine-amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              autoComplete="off"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-red-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
              placeholder="Insere o valor da multa"
            />
          </div>

          <div>
            <label
              htmlFor="fine-reason"
              className="block text-white/70 text-xs md:text-sm font-semibold mb-2"
            >
              Motivo
            </label>
            <textarea
              id="fine-reason"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-red-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 resize-none"
              placeholder="Porque é que esta multa está a ser adicionada?"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-white/10 border border-white/20 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm md:text-base font-bold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm md:text-base font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
          >
            {loading ? "A guardar..." : isEditing ? "Guardar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
