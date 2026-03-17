"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "warning";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

type ToastPayload = Omit<Toast, "id">;

interface ToastContextValue {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const variantStyles: Record<ToastVariant, string> = {
  default: "border-border bg-card text-foreground",
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
};

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Listen for global toast events
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...detail, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    window.addEventListener("toast", handler as EventListener);
    return () => window.removeEventListener("toast", handler as EventListener);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-xl border p-4 shadow-lg animate-fade-in-up transition-all",
            variantStyles[t.variant ?? "default"]
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="text-xs mt-1 opacity-80">{t.description}</p>
              )}
            </div>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((toast) => toast.id !== t.id))
              }
              className="text-xs opacity-60 hover:opacity-100 mt-0.5"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Global toast function (usable outside React)
export function toast(options: Omit<Toast, "id">) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("toast", { detail: options }));
  }
}


