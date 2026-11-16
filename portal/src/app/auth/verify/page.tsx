'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { Button } from '@/components/ui/Button';

export default function VerifyPage() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [done, setDone] = useState(false);

  const update = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
    if (next.every((d) => d)) {
      setTimeout(() => setDone(true), 500);
    }
  };

  return (
    <AuthScreenLayout title="Verify your identity" subtitle="Enter the 6-digit confirmation code sent to your email.">
      {done ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="font-display text-sm font-semibold text-hi">Identity verified</p>
          <p className="mt-1 font-mono text-xs text-mid">Your account is fully activated with ArcFace credentials.</p>
          <Link href="/auth/login" className="mt-5 inline-block">
            <Button>Go to sign in</Button>
          </Link>
        </div>
      ) : (
        <div className="flex justify-center gap-2.5 py-3">
          {digits.map((d, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !d && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
              }}
              className="h-12 w-11 rounded-[14px] border border-[var(--hairline)] bg-surface text-center font-mono text-base font-bold text-hi focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          ))}
        </div>
      )}
      {!done && (
        <p className="mt-5 text-center font-mono text-[11px] text-faint">
          Didn&apos;t receive it?{' '}
          <button className="font-semibold text-accent hover:text-accent2 transition-colors">Resend code</button>
        </p>
      )}
    </AuthScreenLayout>
  );
}
