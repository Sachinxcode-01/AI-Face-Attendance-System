'use client';

import React from 'react';

type Tone = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'purple';

const tones: Record<Tone, string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  danger: 'bg-red-500/10 text-red-400 border-red-500/25',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  info: 'bg-[#6FD8FF]/15 text-[#6FD8FF] border-[#6FD8FF]/25',
  neutral: 'bg-white/[0.04] text-mid border-white/[0.08]',
  purple: 'bg-accent/15 text-accent border-accent/25',
};

export function Badge({ tone = 'neutral', children, pulse = false, className = '' }: { tone?: Tone; children: React.ReactNode; pulse?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${tones[tone]} ${className}`}
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
