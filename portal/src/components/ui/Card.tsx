'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  children: React.ReactNode;
}

export function Card({ elevated = false, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-[22px] border border-[rgba(255,255,255,0.08)] p-6 transition-all ${elevated ? 'card-bytune' : 'card-surface'
        } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && <div className="text-indigo-400">{icon}</div>}
        <div>
          <h3 className="font-display text-base font-bold text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}
