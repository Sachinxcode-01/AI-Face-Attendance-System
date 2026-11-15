'use client';

import React from 'react';

type Tone = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'purple';

const tones: Record<Tone, string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-white/5 text-gray-400 border-white/10',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function Badge({ tone = 'neutral', children, pulse = false, className = '' }: { tone?: Tone; children: React.ReactNode; pulse?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {pulse && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case 'present':
    case 'approved':
    case 'verified_face':
    case 'verified_qr':
    case 'live':
    case 'operational':
    case 'enrolled':
    case 'active':
    case 'on_campus':
      return 'success';
    case 'absent':
    case 'rejected':
    case 'critical':
    case 'down':
    case 'failed':
    case 'suspended':
      return 'danger';
    case 'late':
    case 'pending':
    case 'warning':
    case 'degraded':
    case 'investigating':
    case 'in_transit':
      return 'warning';
    case 'scheduled':
    case 'info':
    case 'resolved':
      return 'info';
    default:
      return 'neutral';
  }
}
