import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = "", ...props }, ref) => {
    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="block text-white font-semibold mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`bg-white/10 border-2 ${
            error ? "border-red-500" : "border-white/20"
          } rounded-2xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 text-lg ${
            fullWidth ? "w-full" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
