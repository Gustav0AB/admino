import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastOptions = {
  duration?: number;
};

type ToastContextValue = {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const config: Record<ToastType, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  warning: "bg-amber-600",
  info: "bg-blue-600",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current.slice(-3), { id, type, message }]);
    window.setTimeout(() => dismiss(id), options?.duration ?? 3500);
  }, [dismiss]);

  const value: ToastContextValue = {
    success: (message, options) => add("success", message, options),
    error: (message, options) => add("error", message, options),
    warning: (message, options) => add("warning", message, options),
    info: (message, options) => add("info", message, options),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-auto max-w-sm flex-col gap-2">
          {toasts.map((toast) => (
            <button
              key={toast.id}
              type="button"
              className={`pointer-events-auto rounded-lg px-4 py-3 text-left text-sm font-medium text-white shadow-lg ${config[toast.type]}`}
              onClick={() => dismiss(toast.id)}
            >
              {toast.message}
            </button>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
