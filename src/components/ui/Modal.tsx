import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeMap = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full ${sizeMap[size]} bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-pop animate-slide-up max-h-[92vh] flex flex-col text-ink-800`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between px-7 pt-6 pb-5">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink-900">
              {title}
            </h2>
            {description && (
              <p className="text-[13px] text-ink-500 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ink-300 hover:text-ink-700 hover:bg-surface-2 rounded-full p-2 -mr-1 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-7 pb-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-7 py-5 border-t border-line/80 bg-surface-2/40 rounded-b-3xl flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
