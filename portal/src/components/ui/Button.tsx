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
  'btn-pill-accent text-[#050507] font-semibold',
  secondary:
  'btn-pill-glass text-white',
  danger:
  'inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 px-4 py-2',
  ghost: 'text-gray-400 hover:text-white hover:bg-white/5 rounded-full px-4 py-2',
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
