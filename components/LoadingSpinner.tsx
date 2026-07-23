interface LoadingSpinnerProps {
  icon?: string;
  message?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "text-4xl",
  md: "text-5xl",
  lg: "text-6xl md:text-7xl",
} as const;

const TEXT_SIZE_CLASSES = {
  sm: "text-sm md:text-base",
  md: "text-base md:text-lg",
  lg: "text-lg md:text-xl",
} as const;

export default function LoadingSpinner({
  icon = "🍷",
  message = "A carregar...",
  size = "lg",
}: LoadingSpinnerProps) {
  return (
    <div className="text-center" role="status" aria-label={message}>
      <div className={`${SIZE_CLASSES[size]} mb-4 motion-safe:animate-spin`} aria-hidden="true">{icon}</div>
      <div className={`text-white ${TEXT_SIZE_CLASSES[size]}`} aria-hidden="true">{message}</div>
      <span className="sr-only">{message}</span>
    </div>
  );
}
