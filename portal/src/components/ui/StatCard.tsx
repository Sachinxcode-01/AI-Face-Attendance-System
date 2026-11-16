'use client';

import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  icon: React.ReactNode;
  accent?: string;
  footnote?: string;
}

  export function StatCard({
    label,
    value,
    delta,
    deltaUp = true,
    icon,
    accent = 'text-accent',
    footnote,
  }: StatCardProps) {
    return (
        <Card className="relative overflow-hidden group hover:border-[var(--hairline-strong)] transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
              {label}
            </span>
            <span className={`${accent} transition-transform group-hover:scale-105`}>
              {icon}
            </span>
          </div>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-hi">
                {value}
              </span>
              {delta && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10.5px] font-medium border ${deltaUp
                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                        : 'border-red-500/25 bg-red-500/10 text-red-400'
                      }`}
                  >
                    {delta}
                  </span>
        )}
                </div>
              {footnote && <p className="mt-2.5 font-mono text-[11px] text-faint">{footnote}</p>}
            </Card>
            );
}
