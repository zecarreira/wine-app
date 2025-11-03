import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "font-bold rounded-2xl shadow-lg transform transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

  const variantClasses = {
    primary:
      "bg-linear-to-r from-purple-600 to-pink-600 text-white hover:shadow-purple-500/50 hover:scale-[1.02]",
    secondary:
      "bg-white/10 backdrop-blur-lg text-white border-2 border-white/20 hover:bg-white/20 hover:scale-[1.02]",
    success:
      "bg-linear-to-r from-green-600 to-emerald-600 text-white hover:shadow-green-500/50 hover:scale-[1.02]",
    warning:
      "bg-linear-to-r from-amber-600 to-orange-600 text-white hover:shadow-amber-500/50 hover:scale-[1.02]",
    danger:
      "bg-linear-to-r from-orange-600 to-red-600 text-white hover:shadow-orange-500/50 hover:scale-[1.02]",
    ghost:
      "bg-white/5 backdrop-blur-sm text-white border border-white/10 hover:bg-white/10",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-4 text-base",
    lg: "px-8 py-5 text-xl",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="text-xl">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
