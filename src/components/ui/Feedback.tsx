import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function Spinner({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Loader2 size={size} className={`animate-spin text-ink-400 ${className}`} />
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-ink-500">
      <Spinner size={28} />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-canvas">
      <Spinner size={32} />
      <p className="mt-3 text-sm text-ink-500">Loading…</p>
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-danger-50 border border-danger-200/70 px-5 py-4 text-sm text-danger-700 flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-danger-600 font-semibold underline underline-offset-2 shrink-0 hover:text-danger-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-ink-950/95 backdrop-blur text-white text-sm px-5 py-3 rounded-full shadow-pop">
        {children}
      </div>
    </div>
  );
}
