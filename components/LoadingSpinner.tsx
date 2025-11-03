interface LoadingSpinnerProps {
  icon?: string;
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  icon = "🍷",
  message = "Loading...",
  size = "lg",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "text-4xl",
    md: "text-5xl",
    lg: "text-6xl",
  };

  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className={`${sizeClasses[size]} mb-4 animate-spin`}>{icon}</div>
        <div className={`text-white ${textSizeClasses[size]}`}>{message}</div>
      </div>
    </div>
  );
}
