'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ScanFace } from 'lucide-react';
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
    <div className="flex min-h-screen flex-col bg-[#070A14] text-[#C8CCDF]">
      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] left-[15%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[10%] h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[140px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-4 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/30">
            <ScanFace className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-display text-base font-bold text-white">SmartFace</span>
            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Portal Suite</span>
          </div>
        </Link>
        <Link href="/" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
          ← Back to Gateway
        </Link>
      </header>

      <main ref={ref} className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="auth-hero-item mb-6 text-center">
            <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
          </div>

          <div className="auth-card rounded-3xl border border-white/10 bg-[#0E1428] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
            {children}
            {footer && <div className="mt-5 border-t border-white/5 pt-4 text-center text-xs text-gray-500">{footer}</div>}
          </div>
        </div>
      </main>
    </div >
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
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-gray-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
    </div>
  );
}