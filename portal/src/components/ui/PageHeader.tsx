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
    <div className="page-enter mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {backTo && (
          <Link href={backTo} className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-indigo-400">
            <ChevronLeft className="h-3.5 w-3.5" /> {backLabel}
          </Link>
        )}
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">{kicker}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-white">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-xs text-gray-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
