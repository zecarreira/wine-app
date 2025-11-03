import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "highlight" | "warning" | "ghost";
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export default function Card({
  children,
  variant = "default",
  className = "",
  padding = "md",
}: CardProps) {
  const variantClasses = {
    default:
      "bg-linear-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-xl",
    highlight:
      "bg-linear-to-br from-white/15 to-white/5 backdrop-blur-lg border border-white/20 shadow-2xl",
    warning:
      "bg-linear-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-lg border-2 border-amber-400/30 shadow-2xl",
    ghost: "bg-white/5 backdrop-blur-sm border border-white/10",
  };

  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`rounded-3xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
