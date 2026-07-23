import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "highlight" | "warning" | "ghost";
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const VARIANT_CLASSES = {
  default:
    "bg-linear-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-xl",
  highlight:
    "bg-linear-to-br from-white/15 to-white/5 backdrop-blur-lg border border-white/20 shadow-2xl",
  warning:
    "bg-linear-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-lg border-2 border-amber-400/30 shadow-2xl",
  ghost: "bg-white/5 backdrop-blur-sm border border-white/10",
} as const;

const PADDING_CLASSES = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

export default function Card({
  children,
  variant = "default",
  className = "",
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`rounded-3xl ${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
