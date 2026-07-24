"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type DeadlineStatus = {
  has_cycle: boolean;
  urgency: "none" | "ok" | "warning" | "overdue" | "paused";
  pause_penalties: boolean;
  anchor_date: string | null;
  deadline_at: string | null;
  days_left: number | null;
  interval_months: number | null;
  fine_amount: number | null;
  organizer: { id: string; name: string } | null;
  pending_penalties_count: number;
  pending_penalties_amount: number;
  today: string;
};

function formatPt(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function DeadlineBanner() {
  const [status, setStatus] = useState<DeadlineStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ success: boolean; status: DeadlineStatus }>(
          "/api/deadline/status"
        );
        if (!cancelled) setStatus(data.status);
      } catch {
        // silent — banner optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status || !status.has_cycle || status.urgency === "none") {
    return null;
  }

  const styles: Record<string, string> = {
    ok: "bg-emerald-500/15 border-emerald-400/40 text-emerald-100",
    warning: "bg-amber-500/20 border-amber-400/50 text-amber-100",
    overdue: "bg-red-500/20 border-red-400/50 text-red-100",
    paused: "bg-blue-500/15 border-blue-400/40 text-blue-100",
  };

  const icons: Record<string, string> = {
    ok: "📅",
    warning: "⏰",
    overdue: "🚨",
    paused: "ℹ️",
  };

  const urgency = status.urgency;
  const box = styles[urgency] ?? styles.ok;
  const icon = icons[urgency] ?? "📅";
  const org = status.organizer?.name ?? "—";

  let title = "";
  let detail = "";

  if (urgency === "paused") {
    title = "Prazo em pausa (falta o jantar extra)";
    detail = `Próximo jantar sugerido até ${formatPt(status.deadline_at)} · Organizador: ${org}`;
  } else if (urgency === "overdue") {
    title = "Em atraso";
    detail = `${status.pending_penalties_count} multa(s) pendente(s) · ${status.pending_penalties_amount} pipas · Organizador: ${org}`;
  } else if (urgency === "warning") {
    title = `Próximo jantar até ${formatPt(status.deadline_at)}`;
    detail = `Faltam ${status.days_left} dia(s) · Organizador: ${org}`;
  } else {
    title = `Próximo jantar até ${formatPt(status.deadline_at)}`;
    detail = `Faltam ${status.days_left} dia(s) · Organizador: ${org}`;
  }

  return (
    <div className={`mb-4 rounded-2xl border-2 px-3 py-3 ${box}`}>
      <div className="flex items-start gap-2">
        <span className="text-xl shrink-0" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs opacity-90 mt-0.5">{detail}</p>
          <Link
            href="/calendar"
            className="inline-block mt-2 text-xs font-semibold underline underline-offset-2 opacity-90 hover:opacity-100"
          >
            Ver calendário →
          </Link>
        </div>
      </div>
    </div>
  );
}
