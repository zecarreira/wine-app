export function DinnerCardSkeleton() {
  return (
    <div className="bg-linear-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-8 bg-white/10 rounded-lg w-3/4 mb-2"></div>
          <div className="h-5 bg-white/10 rounded-lg w-1/3"></div>
        </div>
        <div className="w-10 h-10 bg-white/10 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-5 bg-white/10 rounded-lg w-1/2"></div>
        <div className="h-5 bg-white/10 rounded-lg w-2/3"></div>
      </div>
    </div>
  );
}

export function BottleCardSkeleton() {
  return (
    <div className="bg-linear-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-white/20 rounded-2xl"></div>
        <div className="w-16 h-8 bg-white/10 rounded-lg"></div>
      </div>
      <div className="space-y-3">
        <div className="h-7 bg-white/10 rounded-lg w-3/4"></div>
        <div className="space-y-1.5">
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          <div className="h-4 bg-white/10 rounded w-2/5"></div>
        </div>
        <div className="h-12 bg-white/10 rounded-lg"></div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-linear-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-xl animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-white/20 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-10 bg-white/10 rounded-lg"></div>
        <div className="h-10 bg-white/10 rounded-lg"></div>
        <div className="h-10 bg-white/10 rounded-lg"></div>
      </div>
    </div>
  );
}

export function RankingsSkeleton() {
  return (
    <div className="bg-linear-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 bg-white/10 rounded w-32"></div>
            <div className="h-4 bg-white/10 rounded w-24"></div>
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="h-10 bg-white/10 rounded w-16 ml-auto"></div>
          <div className="h-3 bg-white/10 rounded w-12 ml-auto"></div>
        </div>
      </div>
    </div>
  );
}
