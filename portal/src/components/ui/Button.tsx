'use client';

import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600',
  secondary:
    'bg-white/5 border border-white/10 text-white hover:bg-white/10',
  danger:
    'bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 shadow-lg shadow-red-600/10',
  ghost: 'text-gray-300 hover:bg-white/5 hover:text-white',
};

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  );
}
