'use client';

import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionText?: string;
  onActionClick?: () => void;
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  actionText,
  onActionClick
}: EmptyStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01] backdrop-blur-sm relative overflow-hidden font-sans my-4 py-12">
      
      {/* Background soft glow decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Illustration Circle */}
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-4 shadow-inner relative">
        <Icon className="w-5 h-5" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-white uppercase font-sans tracking-wide">
          {title}
        </h4>
        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && onActionClick && (
        <button
          onClick={onActionClick}
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-white border border-primary/20 hover:bg-blue-600 transition duration-200 cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(37,99,235,0.25)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionText}</span>
        </button>
      )}

    </div>
  );
}
