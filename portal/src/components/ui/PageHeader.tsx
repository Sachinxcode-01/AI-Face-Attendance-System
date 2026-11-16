'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  kicker: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}

export function PageHeader({ kicker, title, subtitle, actions, backTo, backLabel = 'Back' }: PageHeaderProps) {
  return (
      <div className="page-enter mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {backTo && (
              <Link href={backTo} className="mb-2.5 inline-flex items-center gap-1 font-mono text-xs text-faint hover:text-accent transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" /> {backLabel}
              </Link>
        )}
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">{kicker}</p>
              <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-hi">{title}</h1>
              {subtitle && <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-mid">{subtitle}</p>}
            </div>
          {actions && <div className="flex items-center gap-2.5">{actions}</div>}
        </div>
        );
}
