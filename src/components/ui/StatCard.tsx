import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  tone?: "default" | "success" | "warning" | "danger";
};

const trendColor: Record<string, string> = {
  up: "text-success-600",
  down: "text-danger-600",
  flat: "text-ink-400",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
}: Props) {
  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus;

  return (
    <div className="group bg-white rounded-2xl border border-line/80 shadow-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-500 tracking-[-0.01em]">
            {label}
          </p>
          <p className="mt-2.5 text-[30px] leading-9 font-bold text-ink-900 font-mono tabular-nums tracking-[-0.02em]">
            {value}
          </p>
          {hint && (
            <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
          )}
        </div>
        {icon && (
          <div className="text-ink-300 group-hover:text-ink-400 transition-colors shrink-0 mt-0.5">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div
          className={`mt-3.5 flex items-center gap-1.5 text-xs font-semibold ${trendColor[trend?.direction ?? "flat"]}`}
        >
          <TrendIcon size={13} strokeWidth={2.5} />
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}
