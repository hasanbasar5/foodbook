"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (input: { title: string; description?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const PENDING_TOAST_KEY = "foodbook.toast.pending";

const toneStyles: Record<ToastTone, string> = {
  success:
    "border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#d1fae5_100%)] text-emerald-900",
  error:
    "border-rose-200 bg-[linear-gradient(135deg,#fff1f2_0%,#ffe4e6_100%)] text-rose-900",
  info:
    "border-brand-200 bg-[linear-gradient(135deg,#f0f9ff_0%,#dff4ff_100%)] text-brand-900",
};

const toneIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast: ToastContextValue["showToast"] = ({ title, description, tone = "info" }) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, title, description, tone }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  };

  const value = useMemo(() => ({ showToast }), []);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(PENDING_TOAST_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { title: string; description?: string; tone?: ToastTone };
      showToast(parsed);
    } catch {
      // Ignore malformed pending toast payloads.
    } finally {
      window.sessionStorage.removeItem(PENDING_TOAST_KEY);
    }
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] mx-auto flex w-full max-w-md flex-col gap-3 px-4">
        {toasts.map((toast) => {
          const Icon = toneIcons[toast.tone];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-[24px] border px-4 py-3 shadow-soft animate-[toastIn_220ms_ease-out] ${toneStyles[toast.tone]}`}
              style={{ animation: "toastIn 220ms ease-out, toastGlow 1.4s ease-in-out 1" }}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-xs leading-5 opacity-85">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="rounded-full p-1 opacity-70 transition hover:opacity-100"
                aria-label="Dismiss toast"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export const queuePendingToast = (input: { title: string; description?: string; tone?: ToastTone }) => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify(input));
};
