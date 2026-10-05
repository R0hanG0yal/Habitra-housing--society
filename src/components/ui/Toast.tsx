import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };
type ToastContextValue = {
  notify: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = ++counter;
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastBubble key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBubble({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  const Icon =
    item.kind === "success"
      ? CheckCircle2
      : item.kind === "error"
        ? AlertCircle
        : Info;
  const color =
    item.kind === "success"
      ? "text-success-300"
      : item.kind === "error"
        ? "text-danger-200"
        : "text-info-500";

  return (
    <div className="flex items-start gap-3 bg-ink-950/95 backdrop-blur-xl text-white text-[13px] px-4 py-3 rounded-2xl shadow-pop animate-slide-up min-w-[280px] ring-1 ring-white/10">
      <Icon size={18} className={`${color} shrink-0 mt-0.5`} />
      <span className="flex-1">{item.message}</span>
      <button
        onClick={onClose}
        className="text-ink-400 hover:text-white shrink-0 transition"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
