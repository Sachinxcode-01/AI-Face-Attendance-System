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

export function StatCard({ label, value, delta, deltaUp = true, icon, accent = 'text-indigo-400', footnote }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold text-white">{value}</span>
        {delta && (
          <span className={`text-xs font-medium ${deltaUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {delta}
          </span>
        )}
      </div>
      {footnote && <p className="mt-2 text-xs text-gray-500">{footnote}</p>}
    </Card>
  );
}
