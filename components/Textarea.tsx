import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = true, className = "", ...props }, ref) => {
    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="block text-white font-semibold mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`bg-white/10 border-2 ${
            error ? "border-red-500" : "border-white/20"
          } rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 resize-none ${
            fullWidth ? "w-full" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
