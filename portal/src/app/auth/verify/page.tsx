'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams?.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithToken } = useAuth();

  const verifyCode = async (otpCode: string) => {
    if (!email) {
      setError('Please provide the account email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.verifyOtp(email, otpCode);
      if (res && res.access_token) {
        loginWithToken({
          access_token: res.access_token,
          role: res.role,
          full_name: res.full_name,
          email: res.email || email,
          user_id: res.user_id,
          profilePhotoUrl: res.profilePhotoUrl,
        });
      } else {
        setDone(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the passcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Enter your account email first to resend code.');
      return;
    }
    setError('');
    setResendMsg('');
    try {
      await api.auth.requestOtp(email.trim());
      setResendMsg('A new verification code has been dispatched to your email.');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code. Please try again.');
    }
  };

  const update = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
    if (next.every((d) => d)) {
      verifyCode(next.join(''));
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
        <div className="space-y-4">
          {!initialEmail && (
            <div>
              <label className="block text-xs font-semibold text-mid mb-1">Account Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@smartface.pro"
                className="w-full rounded-[14px] border border-[var(--hairline)] bg-surface px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
              />
            </div>
          )}

          <div className="flex justify-center gap-2.5 py-3">
            {digits.map((d, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                inputMode="numeric"
                maxLength={1}
                value={d}
                disabled={loading}
                onChange={(e) => update(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !d && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
                }}
                className="h-12 w-11 rounded-[14px] border border-[var(--hairline)] bg-surface text-center font-mono text-base font-bold text-hi focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            ))}
          </div>

          {error && <p className="text-center rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
          {resendMsg && <p className="text-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{resendMsg}</p>}
        </div>
      )}
      {!done && (
        <p className="mt-5 text-center font-mono text-[11px] text-faint">
          Didn&apos;t receive it?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="font-semibold text-accent hover:text-accent2 transition-colors cursor-pointer disabled:opacity-50"
          >
            Resend code
          </button>
        </p>
      )}
    </AuthScreenLayout>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050507]" />}>
      <VerifyContent />
    </Suspense>
  );
}
