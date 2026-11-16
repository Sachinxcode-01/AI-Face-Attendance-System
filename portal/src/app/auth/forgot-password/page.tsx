'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { AuthScreenLayout, AuthInput } from '@/components/auth/AuthScreenLayout';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent(true);
    }, 800);
  };

  return (
    <AuthScreenLayout
      title="Reset your password"
      subtitle="We will send a one-time passcode to your registered campus email."
      footer={
        <Link href="/auth/login" className="inline-flex items-center gap-1 font-semibold text-accent hover:text-accent2 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Mail className="h-6 w-6" />
          </div>
          <p className="font-display text-sm font-semibold text-hi">Passcode sent</p>
          <p className="mt-1.5 font-mono text-xs text-mid">
            Check <span className="text-accent">{email}</span> for your OTP. It expires in 10 minutes.
          </p>
          <Link href="/auth/reset-password" className="mt-5 inline-block">
            <Button>Continue to reset</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <AuthInput label="Registered email" type="email" value={email} onChange={setEmail} placeholder="you@smartface.pro" autoComplete="email" />
          <Button type="submit" loading={busy} className="w-full py-3">
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthScreenLayout>
  );
}
