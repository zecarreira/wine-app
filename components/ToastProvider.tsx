"use client";

import {
  createContext,
  use,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function getToastStyles(type: ToastType) {
  switch (type) {
    case "success":
      return "bg-green-500/90 border-green-400";
    case "error":
      return "bg-red-500/90 border-red-400";
    case "warning":
      return "bg-amber-500/90 border-amber-400";
    case "info":
      return "bg-blue-500/90 border-blue-400";
    default:
      return "bg-purple-500/90 border-purple-400";
  }
}

function getToastIcon(type: ToastType) {
  switch (type) {
    case "success":
      return "✅";
    case "error":
      return "❌";
    case "warning":
      return "⚠️";
    case "info":
      return "ℹ️";
    default:
      return "🔔";
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const success = useCallback(
    (message: string) => showToast(message, "success"),
    [showToast]
  );
  const error = useCallback(
    (message: string) => showToast(message, "error"),
    [showToast]
  );
  const info = useCallback(
    (message: string) => showToast(message, "info"),
    [showToast]
  );
  const warning = useCallback(
    (message: string) => showToast(message, "warning"),
    [showToast]
  );

  const value = useMemo(
    () => ({ showToast, success, error, info, warning }),
    [showToast, success, error, info, warning]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === "error" || toast.type === "warning" ? "alert" : "status"}
            aria-live={toast.type === "error" || toast.type === "warning" ? "assertive" : "polite"}
            className={`${getToastStyles(
              toast.type
            )} backdrop-blur-lg border-2 rounded-2xl px-6 py-4 shadow-2xl text-white font-semibold flex items-center gap-3 motion-safe:animate-slide-in-right pointer-events-auto min-w-[300px] max-w-[500px]`}
          >
            <span className="text-2xl" aria-hidden="true">{getToastIcon(toast.type)}</span>
            <span className="flex-1">{toast.message}</span>
            <button type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              aria-label="Fechar notificação"
              className="text-white/80 hover:text-white text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = use(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
