import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  // Apple-grade primary: near-black, quiet, confident
  primary:
    "bg-ink-950 text-white hover:bg-black active:bg-black/90 font-semibold shadow-xs hover:shadow-card",
  secondary:
    "bg-white text-ink-900 hover:bg-surface-2 active:bg-surface-3 font-semibold border border-line shadow-xs",
  ghost:
    "text-ink-500 hover:text-ink-900 hover:bg-surface-2 active:bg-surface-3 font-medium",
  danger:
    "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700 font-semibold shadow-xs",
  success:
    "bg-success-600 text-white hover:bg-success-700 active:bg-success-700 font-semibold shadow-xs",
  outline:
    "bg-transparent text-ink-700 hover:bg-surface-2 active:bg-surface-3 font-semibold border border-line-strong",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs gap-1.5 rounded-full",
  md: "h-10 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-7 text-[15px] gap-2 rounded-full",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
