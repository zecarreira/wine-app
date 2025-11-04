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
    lg: "text-6xl md:text-7xl",
  };

  const textSizeClasses = {
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
  };

  return (
    <div className="text-center">
      <div className={`${sizeClasses[size]} mb-4 animate-spin`}>{icon}</div>
      <div className={`text-white ${textSizeClasses[size]}`}>{message}</div>
    </div>
  );
}
