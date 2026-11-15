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
    <div className={`inline-flex rounded-xl bg-white/[0.04] p-1 border border-white/5 ${className}`}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            active === t.value ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
