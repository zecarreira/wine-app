import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "info";
  icon?: string;
  size?: "sm" | "md";
}

export default function Badge({
  children,
  variant = "primary",
  icon,
  size = "md",
}: BadgeProps) {
  const variantClasses = {
    primary: "bg-purple-500/30 text-purple-200 border-purple-400/30",
    success: "bg-green-500/30 text-green-200 border-green-400/30",
    warning: "bg-amber-500/30 text-amber-200 border-amber-400/30",
    danger: "bg-red-500/30 text-red-200 border-red-400/30",
    info: "bg-blue-500/30 text-blue-200 border-blue-400/30",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-xs px-3 py-1.5",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} font-bold rounded-full border`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span className="uppercase">{children}</span>
    </div>
  );
}
