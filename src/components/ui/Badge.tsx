import type { ReactNode } from "react";

type Tone =
  | "paid" | "pending" | "warning" | "overdue" | "partial" | "neutral"
  | "info" | "vacant" | "occupied" | "success" | "critical" | "disabled";

type Props = { tone?: Tone; children: ReactNode; className?: string };

const tones: Record<Tone, string> = {
  paid: "bg-success-500/12 text-success-700 font-medium",
  success: "bg-success-500/12 text-success-700 font-medium",
  occupied: "bg-success-500/12 text-success-700 font-medium",
  pending: "bg-pending-500/12 text-pending-600 font-medium",
  warning: "bg-warning-500/12 text-warning-600 font-medium",
  overdue: "bg-brand-600/10 text-brand-700 font-medium",
  critical: "bg-ink-950 text-white font-medium",
  partial: "bg-info-500/12 text-info-600 font-medium",
  info: "bg-info-500/12 text-info-600 font-medium",
  neutral: "bg-surface-3 text-ink-700 font-medium",
  vacant: "bg-surface-3 text-ink-500 font-medium",
  disabled: "bg-surface-2 text-ink-400 font-medium",
};

export function Badge({ tone = "neutral", children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] leading-4 tracking-[-0.005em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    paid: { tone: "paid", label: "Paid" },
    approved: { tone: "paid", label: "Approved" },
    pending: { tone: "pending", label: "Pending" },
    warning: { tone: "warning", label: "Expiring Soon" },
    overdue: { tone: "overdue", label: "Overdue" },
    critical: { tone: "critical", label: "Critical" },
    partial: { tone: "partial", label: "Partial" },
    info: { tone: "info", label: "Info" },
    vacant: { tone: "vacant", label: "Vacant" },
    occupied: { tone: "occupied", label: "Occupied" },
    disabled: { tone: "disabled", label: "Archived" },
  };
  const cfg = map[status] ?? { tone: "neutral" as Tone, label: status };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
