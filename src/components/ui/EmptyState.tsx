import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center text-ink-300 mb-5">
        {icon ?? <Inbox size={24} strokeWidth={1.75} />}
      </div>
      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900">{title}</h3>
      {description && (
        <p className="text-[13px] text-ink-400 mt-1.5 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
