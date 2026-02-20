import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export default function Input({ label, error, fullWidth = true, className = "", ...props }: InputProps) {
  const inputId = props.id || props.name;
  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label htmlFor={inputId} className="block text-white font-semibold mb-2">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-white/10 border-2 ${
          error ? "border-red-500" : "border-white/20"
        } rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 text-lg ${
          fullWidth ? "w-full" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
}
