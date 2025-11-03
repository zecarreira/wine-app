"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { DinnerCardSkeleton } from "@/components/Skeletons";
import { useDinners } from "@/lib/hooks/useApi";
import { useToast } from "@/components/ToastProvider";
import { getUser } from "@/lib/auth-client";

interface Dinner {
  id: string;
  name: string;
  event_date: string;
  location: string;
  is_blind: boolean;
  is_completed?: boolean;
  status?: string;
}

export default function DinnersPage() {
  const { data: dinners, isLoading, error } = useDinners();
  const { showToast } = useToast();

  const userRole = useMemo(() => {
    const user = getUser();
    return user?.role || null;
  }, []);

  useEffect(() => {
    if (error) {
      showToast("Erro ao carregar jantares", "error");
    }
  }, [error, showToast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header backUrl="/" backText="Início" />

        <div className="container mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Jantares</h1>
              <p className="text-purple-200">
                Seleciona um jantar para começar
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                icon="👤"
                onClick={() => (window.location.href = "/profile")}
              >
                Perfil
              </Button>
              {userRole === "founder" && (
                <Button
                  variant="success"
                  size="md"
                  icon="+"
                  onClick={() => (window.location.href = "/create-dinner")}
                >
                  Novo Jantar
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <DinnerCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dinnersData = (dinners || []) as Dinner[];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header backUrl="/" backText="Início" />

      <div className="container mx-auto px-4 py-8">
        {/* Header Actions */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Jantares</h1>
            <p className="text-purple-200">Seleciona um jantar para começar</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              icon="👤"
              onClick={() => (window.location.href = "/profile")}
            >
              Perfil
            </Button>
            {userRole === "founder" && (
              <Button
                variant="success"
                size="md"
                icon="+"
                onClick={() => (window.location.href = "/create-dinner")}
              >
                Novo Jantar
              </Button>
            )}
          </div>
        </div>

        {/* Dinners List */}
        {dinnersData.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-white/60 text-lg mb-2">Ainda não há jantares</p>
            <p className="text-white/40 text-sm">
              {userRole === "founder"
                ? "Cria o primeiro jantar usando o botão acima"
                : "Aguarda que um organizador crie um jantar"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {dinnersData.map((dinner) => (
              <Link
                key={dinner.id}
                href={`/dinners/${dinner.id}`}
                className="block"
              >
                <Card className="p-6 hover:border-purple-400/50 transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] cursor-pointer">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {dinner.name}
                      </h2>
                      {dinner.is_blind && (
                        <div className="inline-flex items-center gap-2 bg-purple-500/30 text-purple-200 text-xs font-bold px-3 py-1 rounded-full border border-purple-400/30">
                          <span>🎭</span>
                          <span>PROVA CEGA</span>
                        </div>
                      )}
                    </div>
                    <div className="text-3xl">
                      {dinner.is_completed || dinner.status === "completed"
                        ? "✅"
                        : "⏳"}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-purple-200">
                      <span className="text-xl">📅</span>
                      <span className="text-lg">
                        {new Date(dinner.event_date).toLocaleDateString(
                          "pt-PT",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {dinner.location && (
                      <div className="flex items-center gap-3 text-purple-200">
                        <span className="text-xl">📍</span>
                        <span className="text-lg">{dinner.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          dinner.is_completed || dinner.status === "completed"
                            ? "text-green-400"
                            : "text-amber-400"
                        }`}
                      >
                        {dinner.is_completed || dinner.status === "completed"
                          ? "Concluído"
                          : "Agendado"}
                      </span>
                      <span className="text-white/60 text-sm">
                        Ver detalhes →
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
