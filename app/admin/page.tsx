"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminPanelPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [founderCount, setFounderCount] = useState(0);
  const [maxFounders] = useState(7);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const checkAdminAndFetchUsers = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/login");
        return;
      }

      const currentUser = JSON.parse(userStr);

      if (currentUser.role !== "admin") {
        alert("Acesso de admin necessário");
        router.push("/dinners");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setFounderCount(data.founderCount);
      } else {
        alert("Erro ao carregar utilizadores");
      }
    } catch {
      console.error("Error loading users");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAdminAndFetchUsers();
  }, [checkAdminAndFetchUsers]);

  async function updateUserRole(userId: string, newRole: string) {
    const roleText = newRole === "founder" ? "Fundador" : "Convidado";
    if (!confirm(`Promover este utilizador a ${roleText}?`)) return;

    setUpdating(userId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        await checkAdminAndFetchUsers();
        alert(`✅ Utilizador promovido a ${roleText}!`);
      } else {
        alert(data.error || "Erro ao atualizar role");
      }
    } catch {
      alert("Erro ao atualizar role");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">👑</div>
          <div className="text-white text-xl">A carregar painel admin...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </button>
          <Link href="/" className="text-white/80 hover:text-white text-2xl">
            🏠
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24 max-w-6xl">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👑</div>
          <h1 className="text-4xl font-bold text-white mb-2">Painel Admin</h1>
          <p className="text-purple-200">
            Gerir roles e permissões dos utilizadores
          </p>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border-2 border-amber-400/30 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Vagas de Fundadores
              </h2>
              <p className="text-amber-200">
                {founderCount} / {maxFounders} vagas usadas
              </p>
            </div>
            <div className="text-5xl font-bold text-amber-400">
              {founderCount}/{maxFounders}
            </div>
          </div>
          {founderCount >= maxFounders && (
            <div className="mt-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl p-3 text-red-200 text-sm">
              ⚠️ Máximo de fundadores atingido! Não é possível promover mais
              utilizadores.
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            Todos os Utilizadores ({users.length})
          </h2>

          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-white">
                        {user.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${
                          user.role === "admin"
                            ? "bg-red-500/30 text-red-200 border-2 border-red-400/50"
                            : user.role === "founder"
                            ? "bg-amber-500/30 text-amber-200 border-2 border-amber-400/50"
                            : "bg-blue-500/30 text-blue-200 border-2 border-blue-400/50"
                        }`}
                      >
                        {user.role === "admin" && <span>👑</span>}
                        {user.role === "founder" && <span>🍷</span>}
                        {user.role === "guest" && <span>👤</span>}
                        <span className="uppercase">{user.role}</span>
                      </span>
                    </div>
                    <p className="text-purple-200 text-sm mb-1">{user.email}</p>
                    <p className="text-white/40 text-xs">
                      Registado:{" "}
                      {new Date(user.created_at).toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Role Actions */}
                  {user.role !== "admin" && (
                    <div className="flex gap-3 flex-shrink-0">
                      {user.role === "guest" && (
                        <button
                          onClick={() => updateUserRole(user.id, "founder")}
                          disabled={
                            updating === user.id || founderCount >= maxFounders
                          }
                          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all text-sm shadow-lg hover:shadow-amber-500/50 transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          {updating === user.id ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              <span>A atualizar...</span>
                            </>
                          ) : (
                            <>
                              <span>🍷</span>
                              <span>Promover a Fundador</span>
                            </>
                          )}
                        </button>
                      )}
                      {user.role === "founder" && (
                        <button
                          onClick={() => updateUserRole(user.id, "guest")}
                          disabled={updating === user.id}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all text-sm shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          {updating === user.id ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              <span>A atualizar...</span>
                            </>
                          ) : (
                            <>
                              <span>👤</span>
                              <span>Despromover a Convidado</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {user.role === "admin" && (
                    <div className="flex-shrink-0">
                      <div className="bg-red-500/20 border-2 border-red-400/50 text-red-200 px-4 py-2 rounded-xl text-sm font-semibold">
                        🔒 Role Protegida
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
