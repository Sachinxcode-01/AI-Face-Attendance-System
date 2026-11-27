'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ScanFace } from 'lucide-react';
import gsap from 'gsap';

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.auth-hero-item', { y: 20, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' });
      gsap.from('.auth-card', { y: 30, opacity: 0, duration: 0.8, delay: 0.25, ease: 'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#050507] text-[#B6B6C2]">
      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] left-[15%] h-[500px] w-[500px] rounded-full card-glow-bg opacity-60 blur-[140px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-4 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[#050507] shadow-lg shadow-accent/25">
            <ScanFace className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div>
            <span className="font-display text-base font-bold text-white">SmartFace</span>
            <span className="ml-1.5 text-[9px] font-mono uppercase tracking-[0.2em] text-accent">Portal Suite</span>
          </div>
        </Link>
        <Link href="/" className="text-xs font-medium text-faint hover:text-white transition-colors">
          ← Back to Gateway
        </Link>
      </header>

      <main ref={ref} className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="auth-hero-item mb-6 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-mid">{subtitle}</p>
          </div>

          <div className="auth-card rounded-[22px] card-bytune p-6 shadow-2xl sm:p-8">
            {children}
            {footer && <div className="mt-5 border-t border-white/5 pt-4 text-center text-xs text-faint">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = true,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-xs text-hi placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 ${isPassword ? 'pr-10' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-hi transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}