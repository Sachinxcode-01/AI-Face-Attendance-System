'use client';

import React, { useMemo } from 'react';
import { Check, Circle } from 'lucide-react';

export function evaluatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  checks: { label: string; met: boolean }[];
} {
  const isPassphrase = password.length >= 12;
  const checks = [
    { label: 'At least 8 characters (12+ for passphrase)', met: password.length >= 8 },
    { label: 'Uppercase & lowercase letters', met: isPassphrase || (/[A-Z]/.test(password) && /[a-z]/.test(password)) },
    { label: 'Number & special character (or 12+ chars)', met: isPassphrase || (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) },
  ];

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  const levels = [
    { label: 'Too short', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-amber-500' },
    { label: 'Fair', color: 'bg-yellow-400' },
    { label: 'Strong', color: 'bg-emerald-400' },
    { label: 'Very strong', color: 'bg-emerald-500' },
  ];

  const idx = password.length === 0 ? 0 : Math.min(4, Math.max(1, score));
  return { score: password.length === 0 ? 0 : score, label: levels[idx].label, color: levels[idx].color, checks };
}

export function PasswordStrength({ password }: { password: string }) {
  const result = useMemo(() => evaluatePasswordStrength(password), [password]);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-faint">Password strength</span>
        <span className="text-mid font-semibold">{result.label}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5" role="progressbar" aria-valuenow={result.score} aria-valuemin={0} aria-valuemax={4}>
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-colors ${result.score >= step ? result.color : 'bg-white/10'}`}
          />
        ))}
      </div>
      <ul className="space-y-1 pt-0.5">
        {result.checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1.5 text-[11px] ${c.met ? 'text-emerald-400' : 'text-faint'}`}>
            {c.met ? <Check className="h-3 w-3 shrink-0" /> : <Circle className="h-3 w-3 shrink-0" />}
            <span>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
