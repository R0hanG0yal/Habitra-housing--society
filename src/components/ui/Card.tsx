import type { ReactNode } from "react";

type Props = { children: ReactNode; className?: string };

export function Card({ children, className = "" }: Props) {
  return (
    <div
      className={`bg-white rounded-2xl border border-line/80 shadow-card text-ink-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: Props) {
  return (
    <div className={`px-6 py-4 border-b border-line/80 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: Props) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: Props) {
  return (
    <h3
      className={`text-sm font-semibold tracking-[-0.01em] text-ink-900 ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }: Props) {
  return (
    <p className={`text-xs text-ink-500 mt-0.5 ${className}`}>{children}</p>
  );
}
