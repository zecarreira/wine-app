interface LoadingSpinnerProps {
  icon?: string;
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  icon = "🍷",
  message = "A carregar...",
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
    <div className="text-center" role="status" aria-label={message}>
      <div className={`${sizeClasses[size]} mb-4 motion-safe:animate-spin`} aria-hidden="true">{icon}</div>
      <div className={`text-white ${textSizeClasses[size]}`} aria-hidden="true">{message}</div>
      <span className="sr-only">{message}</span>
    </div>
  );
}
