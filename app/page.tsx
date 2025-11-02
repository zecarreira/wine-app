import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Decorative wine glass overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Logo/Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-block">
            <div className="text-7xl mb-4 animate-bounce">🍷</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">
            Jantar do <span className="text-amber-400">Vinho</span>
          </h1>
          <p className="text-xl text-purple-200 max-w-md mx-auto leading-relaxed">
            Entre amigos e copos de vinho, nascem as melhores memórias
          </p>
          {/* CTA Buttons */}
          <div className="w-full max-w-sm space-y-4">
            <Link
              href="/dinners"
              className="block w-full bg-linear-to-r from-purple-600 to-pink-600 text-white text-center px-8 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <div className="flex items-center justify-center gap-3">
                <span>🍽️</span>
                <span>View Dinners</span>
              </div>
            </Link>

            <a
              href="/login"
              className="block w-full bg-white/10 backdrop-blur-lg text-white text-center px-8 py-5 rounded-2xl font-semibold text-lg border-2 border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <div className="flex items-center justify-center gap-3">
                <span>👤</span>
                <span>Login</span>
              </div>
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-3 gap-4 w-full max-w-md text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-3xl mb-2">🎭</div>
            <p className="text-white/80 text-sm font-medium">Prova Cega</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-white/80 text-sm font-medium">Classifica 1-10</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-white/80 text-sm font-medium">Rankings</p>
          </div>
        </div>
      </main>
    </div>
  );
}
