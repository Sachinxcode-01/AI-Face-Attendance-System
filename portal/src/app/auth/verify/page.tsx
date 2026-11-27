'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { OtpInput } from '@/components/auth/OtpInput';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams?.get('email') || '';
  const mode = searchParams?.get('mode') === 'email' ? 'email' : 'login';
  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { loginWithToken } = useAuth();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verifyCode = async (otpCode: string) => {
    if (resending || loading) return;
      if (!email.trim()) {
        setError('Please provide the account email address.');
        return;
      }
      setError('');
      setLoading(true);
      try {
          if (mode === 'email') {
            const res = await api.auth.verifyEmail(email.trim().toLowerCase(), otpCode);
            if (res && res.email_verified) {
              setDone(true);
            } else {
              setError(res?.message || 'Verification failed. Please check the code.');
            }
          } else {
            const res = await api.auth.verifyOtp(email.trim().toLowerCase(), otpCode);
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
          }
        } catch (err: any) {
          setError(err?.message || 'Verification failed. Please check the passcode.');
        } finally {
          setLoading(false);
        }
      };

      const handleResend = async () => {
        if (resending || cooldown > 0) return;
        if (!email.trim()) {
          setError('Enter your account email first to resend code.');
          return;
        }
        setError('');
        setResendMsg('');
        setResending(true);
        try {
            const normalized = email.trim().toLowerCase();
            const res = mode === 'email'
              ? await api.auth.sendVerification(normalized)
              : await api.auth.requestOtp(normalized);
            if (res && (res as any).success === false) {
              setError(res.message || 'Failed to resend code. Please try again.');
            } else {
              setResendMsg(res?.message || 'A new verification code has been dispatched to your email.');
              setCooldown(60);
            }
          } catch (err: any) {
            setError(err?.message || 'Failed to resend code. Please try again.');
          } finally {
            setResending(false);
          }
        };

        return (
            <AuthScreenLayout
              title={mode === 'email' ? 'Verify your email' : 'Verify your identity'}
              subtitle="Enter the 6-digit confirmation code sent to your email."
            >
              {done ? (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <p className="font-display text-sm font-semibold text-hi">Email verified</p>
                  <p className="mt-1 font-mono text-xs text-mid">Your account email is now verified. You can sign in securely.</p>
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

                  <OtpInput value={digits} onChange={setDigits} onComplete={verifyCode} disabled={loading || resending} />

                  <Button
                    type="button"
                    loading={loading}
                    disabled={digits.some((d) => !d) || loading || resending}
                    onClick={() => verifyCode(digits.join(''))}
                    className="w-full py-2.5"
                  >
                    Verify Code
                  </Button>

                  {error && (
                    <p role="alert" className="text-center rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {error}
                    </p>
                  )}
                  {resendMsg && (
                    <p role="status" className="text-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                      {resendMsg}
                    </p>
                  )}
                </div>
              )}
              {!done && (
                <p className="mt-5 text-center font-mono text-[11px] text-faint">
                  Didn&apos;t receive it?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading || resending || cooldown > 0}
                    className="font-semibold text-accent hover:text-accent2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resending ? 'Sending code...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
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
