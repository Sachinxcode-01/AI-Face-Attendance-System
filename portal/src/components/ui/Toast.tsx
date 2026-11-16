'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastItem } from '@/hooks/useToast';

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  error: <AlertTriangle className="h-4 w-4 text-red-400" />,
  info: <Info className="h-4 w-4 text-accent" />,
};

const borders = {
  success: 'border-emerald-500/30',
  error: 'border-red-500/30',
  info: 'border-accent/30',
};

export function ToastContainer({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-[18px] border bg-[#101016]/95 p-4 shadow-2xl shadow-black/70 backdrop-blur-xl ${borders[t.variant]}`}
        >
          <div className="mt-0.5 shrink-0">{icons[t.variant]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white">{t.title}</p>
            {t.body && <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400">{t.body}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="shrink-0 text-gray-500 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
