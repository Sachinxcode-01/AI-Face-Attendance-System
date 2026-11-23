'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { AuthScreenLayout, AuthInput } from '@/components/auth/AuthScreenLayout';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Enter your registered email address.');
    if (otp.length < 6) return setError('Enter the 6-digit passcode.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await api.auth.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        new_password: password,
      });
      router.push('/auth/login?reset=success');
    } catch (err: any) {
      setError(err?.message || 'Password reset failed. Invalid or expired OTP.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Set new password"
      subtitle="Enter the passcode from your email and choose a new password."
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthInput label="Registered email" type="email" value={email} onChange={setEmail} placeholder="you@smartface.pro" autoComplete="email" />
        <AuthInput label="6-digit passcode" value={otp} onChange={setOtp} placeholder="000000" />
        <AuthInput label="New password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" autoComplete="new-password" />
        <AuthInput label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat new password" autoComplete="new-password" />
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
        <Button type="submit" loading={busy} className="w-full py-3">
          <KeyRound className="h-4 w-4" /> Reset Password
        </Button>
      </form>
    </AuthScreenLayout>
  );
}
