'use client';

import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import type { ToastItem } from '@/hooks/useToast';

interface ToastsProps {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
}

/** Fixed-position toast stack used across dashboard pages. */
export function Toasts({ toasts, dismiss }: ToastsProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2" role="status" aria-live="polite">
      {toasts.map((t) => {
        const tone =
          t.variant === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : t.variant === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-white/10 bg-white/[0.06] text-hi';
        const Icon = t.variant === 'success' ? CheckCircle : t.variant === 'error' ? XCircle : Info;
        return (
          <div
            key={t.id}
            className={`flex items-start gap-2 rounded-[16px] border px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-xl ${tone}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>{t.title}</p>
              {t.body && <p className="mt-0.5 text-[11px] font-normal opacity-80">{t.body}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 text-faint transition-colors hover:text-white"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}