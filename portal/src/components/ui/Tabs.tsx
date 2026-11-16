'use client';

import React from 'react';

interface TabsProps<T extends string> {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ tabs, active, onChange, className = '' }: TabsProps<T>) {
  return (
      <div className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] p-1 border border-white/[0.08] ${className}`}>
        {tabs.map((t) => {
          const isSelected = active === t.value;
          return (
            <button
              key={t.value}
              onClick={() => onChange(t.value)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${isSelected
                  ? 'bg-white text-[#050507] font-bold shadow-sm'
                  : 'text-mid hover:text-white hover:bg-white/[0.05]'
                }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      );
}
