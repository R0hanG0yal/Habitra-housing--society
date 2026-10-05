import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

// iOS-style filled inputs: quiet fill, invisible border until focus.
const baseField =
  "w-full h-11 rounded-xl border border-transparent bg-surface-2 px-3.5 text-[15px] text-ink-900 placeholder:text-ink-400 transition-all duration-200 hover:bg-surface-2/80 hover:border-line-strong focus:outline-none focus:bg-white focus:border-ink-900 focus:ring-4 focus:ring-ink-900/10 disabled:bg-surface-2 disabled:text-ink-400 disabled:cursor-not-allowed";

export function Label({
  children,
  htmlFor,
  required,
}: {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[13px] font-semibold text-ink-800 mb-1.5 tracking-[-0.01em]"
    >
      {children}
      {required && <span className="text-brand-600 ml-0.5">*</span>}
    </label>
  );
}

export function Input({
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${baseField} ${className}`} {...rest} />;
}

export function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${baseField} pr-9 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23A2937F%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.85rem_center] ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${baseField} h-auto py-3 ${className}`} {...rest} />;
}

export function Field({
  label,
  required,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
