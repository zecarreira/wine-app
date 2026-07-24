"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { apiFetch, ApiError } from "@/lib/api-client";
import DeadlineBanner from "@/components/DeadlineBanner";
import { MIN_AVAILABLE_FOR_SCHEDULED_DINNER } from "@/lib/domain/constants";

type Poll = {
  id: string;
  status: string;
  window_start: string;
  window_end: string;
  suggested_organizer_id: string | null;
  suggested_organizer?: { id: string; name: string } | null;
  chosen_date: string | null;
  created_dinner_id: string | null;
};

type ResponseRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  status: string;
  days: string[];
};

type Penalty = {
  id: string;
  user_id: string;
  user_name: string | null;
  amount: number;
  reason: string;
  status: string;
  period_index: number;
  period_deadline: string | null;
};

type DeadlineStatus = {
  has_cycle: boolean;
  urgency: string;
  deadline_at: string | null;
  days_left: number | null;
  organizer: { id: string; name: string } | null;
};

function eachDay(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    const [y, m, d] = cur.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + 1));
    cur = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
    if (out.length > 400) break;
  }
  return out;
}

function formatPt(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === "admin";
  const isFounder = user?.role === "admin" || user?.role === "founder";

  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [myDays, setMyDays] = useState<Set<string>>(new Set());
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [foundersTotal, setFoundersTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [settings, setSettings] = useState<{
    dinner_interval_months: number;
    deadline_fine_amount: number;
  } | null>(null);
  const [intervalInput, setIntervalInput] = useState("6");
  const [fineInput, setFineInput] = useState("20");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [deadlineStatus, setDeadlineStatus] = useState<DeadlineStatus | null>(
    null
  );

  const load = useCallback(async () => {
    if (!user || !isFounder) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{
        success: boolean;
        poll: Poll | null;
        responses: ResponseRow[];
        day_counts: Record<string, number>;
        my_response: ResponseRow | null;
        submitted_count: number;
        founders_total: number;
      }>("/api/calendar/polls/active");

      setPoll(data.poll);
      setResponses(data.responses ?? []);
      setDayCounts(data.day_counts ?? {});
      setSubmittedCount(data.submitted_count ?? 0);
      setFoundersTotal(data.founders_total ?? 0);
      if (data.my_response) {
        setMyDays(new Set(data.my_response.days ?? []));
        setMyStatus(data.my_response.status);
      } else {
        setMyDays(new Set());
        setMyStatus(null);
      }

      try {
        const dl = await apiFetch<{
          success: boolean;
          status: DeadlineStatus;
        }>("/api/deadline/status");
        setDeadlineStatus(dl.status);
      } catch {
        setDeadlineStatus(null);
      }

      if (isAdmin) {
        const [penData, setData] = await Promise.all([
          apiFetch<{ success: boolean; penalties: Penalty[] }>(
            "/api/deadline/penalties"
          ),
          apiFetch<{
            success: boolean;
            settings: {
              dinner_interval_months: number;
              deadline_fine_amount: number;
            };
          }>("/api/settings"),
        ]);
        setPenalties(penData.penalties ?? []);
        setSettings(setData.settings);
        setIntervalInput(String(setData.settings.dinner_interval_months));
        setFineInput(String(setData.settings.deadline_fine_amount));
      }
    } catch (err) {
      console.error(err);
      showToast(
        err instanceof ApiError ? err.message : "Erro ao carregar calendário",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [user, isFounder, isAdmin, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!isFounder) {
      showToast("Apenas fundadores podem aceder ao calendário", "error");
      router.push("/");
      return;
    }
    void load();
  }, [authLoading, user, isFounder, load, router, showToast]);

  const days = useMemo(() => {
    if (!poll?.window_start || !poll?.window_end) return [];
    return eachDay(
      String(poll.window_start).slice(0, 10),
      String(poll.window_end).slice(0, 10)
    );
  }, [poll]);

  function toggleDay(day: string) {
    setMyDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function handleSubmitAvailability() {
    if (!poll) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/calendar/polls/${poll.id}/respond`, {
        method: "POST",
        body: { days: [...myDays].sort() },
      });
      showToast("Disponibilidade submetida!", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Erro ao submeter",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenPoll() {
    setSubmitting(true);
    try {
      const body: Record<string, string> = {};
      if (windowStart) body.window_start = windowStart;
      if (windowEnd) body.window_end = windowEnd;
      await apiFetch("/api/calendar/polls", {
        method: "POST",
        body: Object.keys(body).length ? body : undefined,
      });
      showToast("Poll aberto!", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Erro ao abrir poll",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelPoll() {
    if (!poll) return;
    if (!confirm("Cancelar o poll activo?")) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/calendar/polls/${poll.id}`, {
        method: "PATCH",
        body: { status: "cancelled" },
      });
      showToast("Poll cancelado", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Erro ao cancelar",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateWindow() {
    if (!poll || !windowStart || !windowEnd) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/calendar/polls/${poll.id}`, {
        method: "PATCH",
        body: { window_start: windowStart, window_end: windowEnd },
      });
      showToast("Janela actualizada", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Erro ao actualizar janela",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChooseDate(date: string) {
    if (!poll) return;
    const n = dayCounts[date] ?? 0;
    if (n < MIN_AVAILABLE_FOR_SCHEDULED_DINNER) {
      showToast(
        `São necessários pelo menos ${MIN_AVAILABLE_FOR_SCHEDULED_DINNER} membros disponíveis (Posso) neste dia.`,
        "error"
      );
      return;
    }
    if (
      !confirm(
        `Confirmar marcação do jantar em ${formatPt(date)}? (${n} membros disponíveis)`
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiFetch<{
        success: boolean;
        dinner: { id: string };
      }>(`/api/calendar/polls/${poll.id}/choose-date`, {
        method: "POST",
        body: { date },
      });
      showToast("Jantar criado!", "success");
      router.push(`/dinners/${data.dinner.id}`);
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Erro ao escolher data",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveSettings() {
    setSubmitting(true);
    try {
      await apiFetch("/api/settings", {
        method: "PATCH",
        body: {
          dinner_interval_months: Number(intervalInput),
          deadline_fine_amount: Number(fineInput),
        },
      });
      showToast("Definições guardadas (não retroagem no ciclo activo)", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Erro ao guardar",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWaive(id: string) {
    if (!confirm("Dispensar esta multa de prazo?")) return;
    try {
      await apiFetch(`/api/deadline/penalties/${id}`, {
        method: "PATCH",
        body: { status: "waived" },
      });
      showToast("Multa dispensada", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Erro ao dispensar",
        "error"
      );
    }
  }

  async function handleReemit(id: string) {
    try {
      await apiFetch(`/api/deadline/penalties/${id}`, {
        method: "PATCH",
        body: { status: "pending" },
      });
      showToast("Multa reactivada", "success");
      await load();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Erro ao reactivar",
        "error"
      );
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header useBackButton />
        <div className="container mx-auto px-4 py-8 text-white/70" role="status">
          A carregar calendário…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header useBackButton />
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Calendário</h1>
        <p className="text-purple-200 text-sm mb-4">
          Poll de disponibilidade e limite de marcação do próximo jantar
        </p>

        <DeadlineBanner />

        {/* Deadline limit card — always visible */}
        <Card className="p-4 mb-4">
          <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
            <span>⏳</span> Limite de marcação do próximo jantar
          </h2>
          {deadlineStatus?.has_cycle && deadlineStatus.deadline_at ? (
            <div className="text-sm space-y-1">
              <p className="text-white/90">
                Prazo:{" "}
                <span className="font-semibold text-white">
                  {formatPt(deadlineStatus.deadline_at)}
                </span>
              </p>
              <p className="text-purple-200">
                {deadlineStatus.days_left == null
                  ? "—"
                  : deadlineStatus.days_left < 0
                    ? `Em atraso há ${Math.abs(deadlineStatus.days_left)} dia(s)`
                    : deadlineStatus.days_left === 0
                      ? "É hoje o limite"
                      : `Faltam ${deadlineStatus.days_left} dia(s)`}
                {deadlineStatus.organizer?.name
                  ? ` · Organizador da vez: ${deadlineStatus.organizer.name}`
                  : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-white/60">
              Sem prazo activo (ainda não há jantar realizado).
            </p>
          )}
        </Card>

        {/* Poll section */}
        <Card className="p-4 mb-4">
          <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
            <span>🗓️</span> Poll de disponibilidade
          </h2>
          <p className="text-xs text-white/50 mb-3">
            O poll serve só para indicar disponibilidade. A marcação do jantar
            exige confirmação do admin e pelo menos{" "}
            {MIN_AVAILABLE_FOR_SCHEDULED_DINNER} membros com &quot;Posso&quot;
            nesse dia. Também podes criar um jantar sem poll (máx. 1 jantar
            marcado de cada vez).
          </p>

          {!poll ? (
            <div className="text-white/60 text-sm space-y-3">
              <p>Não há poll aberto de momento.</p>
              {isAdmin && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-white/50">
                      Início (opcional)
                      <input
                        type="date"
                        value={windowStart}
                        onChange={(e) => setWindowStart(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-white text-sm"
                      />
                    </label>
                    <label className="text-xs text-white/50">
                      Fim (opcional)
                      <input
                        type="date"
                        value={windowEnd}
                        onChange={(e) => setWindowEnd(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-white text-sm"
                      />
                    </label>
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    icon="+"
                    onClick={handleOpenPoll}
                    disabled={submitting}
                    fullWidth
                  >
                    Abrir poll
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-purple-200">
                Janela: {formatPt(poll.window_start)} — {formatPt(poll.window_end)}
              </p>
              <p className="text-sm text-white/80">
                {submittedCount}/{foundersTotal || "?"} responderam
                {poll.suggested_organizer?.name
                  ? ` · Sugestão: ${poll.suggested_organizer.name}`
                  : ""}
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-64 overflow-y-auto">
                {(days ?? []).map((day) => {
                  const selected = myDays.has(day);
                  const count = dayCounts[day] ?? 0;
                  const canChoose =
                    isAdmin && count >= MIN_AVAILABLE_FOR_SCHEDULED_DINNER;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-lg px-1.5 py-2 text-center text-xs border transition-colors ${
                        selected
                          ? "bg-purple-600 border-purple-400 text-white"
                          : "bg-white/5 border-white/15 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <div className="font-semibold">{formatPt(day).slice(0, 5)}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {count} Posso
                      </div>
                      {isAdmin && (
                        <span
                          role="button"
                          tabIndex={canChoose ? 0 : -1}
                          title={
                            canChoose
                              ? `Confirmar marcação (${count} disponíveis)`
                              : `Precisas de pelo menos ${MIN_AVAILABLE_FOR_SCHEDULED_DINNER} Posso (tens ${count})`
                          }
                          aria-disabled={!canChoose}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!canChoose) return;
                            void handleChooseDate(day);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              if (!canChoose) return;
                              void handleChooseDate(day);
                            }
                          }}
                          className={`mt-1 block text-[10px] ${
                            canChoose
                              ? "text-amber-300 underline cursor-pointer"
                              : "text-white/30 cursor-not-allowed no-underline"
                          }`}
                        >
                          Escolher
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-white/50">
                Marca só os dias em que podes (&quot;Posso&quot;). 0 dias é
                submit válido. A marcação do jantar só com confirmação admin e ≥
                {MIN_AVAILABLE_FOR_SCHEDULED_DINNER} Posso.
                {myStatus === "submitted"
                  ? " · Já submeteste (podes alterar)."
                  : ""}
              </p>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitAvailability}
                disabled={submitting}
                fullWidth
              >
                Submeter disponibilidade
              </Button>

              {isAdmin && (
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-white/50">
                      Início
                      <input
                        type="date"
                        value={windowStart || poll.window_start}
                        onChange={(e) => setWindowStart(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-white text-sm"
                      />
                    </label>
                    <label className="text-xs text-white/50">
                      Fim
                      <input
                        type="date"
                        value={windowEnd || poll.window_end}
                        onChange={(e) => setWindowEnd(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-white text-sm"
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleUpdateWindow}
                      disabled={submitting}
                      fullWidth
                    >
                      Actualizar janela
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleCancelPoll}
                      disabled={submitting}
                      fullWidth
                    >
                      Cancelar poll
                    </Button>
                  </div>
                </div>
              )}

              {responses.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-white/50 mb-1">Respostas</p>
                  <ul className="space-y-1">
                    {(responses ?? []).map((r) => (
                      <li key={r.id} className="text-xs text-white/70 flex justify-between">
                        <span>{r.user_name ?? r.user_id.slice(0, 8)}</span>
                        <span>
                          {r.status === "submitted"
                            ? `${r.days.length} dia(s)`
                            : "pendente"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Admin settings + penalties */}
        {isAdmin && (
          <>
            <Card className="p-4 mb-4">
              <h2 className="text-white font-semibold mb-2">⚙️ Definições de prazo</h2>
              <p className="text-xs text-white/50 mb-3">
                Alterações aplicam-se a ciclos futuros (não retroagem).
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <label className="text-xs text-white/50">
                  Intervalo (meses)
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={intervalInput}
                    onChange={(e) => setIntervalInput(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-white text-sm"
                  />
                </label>
                <label className="text-xs text-white/50">
                  Multa (pipas)
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={fineInput}
                    onChange={(e) => setFineInput(e.target.value)}
                    className="mt-1 w-full rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-white text-sm"
                  />
                </label>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveSettings}
                disabled={submitting}
                fullWidth
              >
                Guardar definições
              </Button>
              {settings && (
                <p className="text-[10px] text-white/40 mt-2">
                  Actual: {settings.dinner_interval_months} meses ·{" "}
                  {settings.deadline_fine_amount} pipas
                </p>
              )}
            </Card>

            <Card className="p-4 mb-4">
              <h2 className="text-white font-semibold mb-2">💰 Multas de prazo</h2>
              {penalties.length === 0 ? (
                <p className="text-sm text-white/50">Sem multas de prazo.</p>
              ) : (
                <ul className="space-y-2">
                  {(penalties ?? []).map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl bg-white/5 border border-white/10 p-2 text-sm"
                    >
                      <div className="flex justify-between gap-2 text-white">
                        <span className="font-medium">
                          {p.user_name ?? "—"} · {p.amount} pipas
                        </span>
                        <span className="text-xs text-white/50">{p.status}</span>
                      </div>
                      <p className="text-xs text-white/60 mt-0.5">{p.reason}</p>
                      <div className="flex gap-2 mt-2">
                        {p.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => void handleWaive(p.id)}
                            className="text-xs text-amber-300 underline"
                          >
                            Dispensar
                          </button>
                        )}
                        {p.status === "waived" && (
                          <button
                            type="button"
                            onClick={() => void handleReemit(p.id)}
                            className="text-xs text-emerald-300 underline"
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
