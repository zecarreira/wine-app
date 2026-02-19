import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export default function Textarea({ label, error, fullWidth = true, className = "", ...props }: TextareaProps) {
  const textareaId = props.id || props.name;
  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label htmlFor={textareaId} className="block text-white font-semibold mb-2">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
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
