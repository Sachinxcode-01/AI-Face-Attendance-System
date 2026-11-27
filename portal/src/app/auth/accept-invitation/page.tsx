'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserCheck } from 'lucide-react';
import { AuthScreenLayout, AuthInput } from '@/components/auth/AuthScreenLayout';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const { loginWithToken } = useAuth();

  const [token, setToken] = useState(initialToken);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token.trim()) return setError('Invitation token is required.');
    if (!fullName.trim()) return setError('Full name is required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setBusy(true);
    try {
      const res = await api.auth.acceptInvitation({
        token: token.trim(),
        full_name: fullName.trim(),
        password,
      });
      if (res?.access_token) {
        loginWithToken({
          access_token: res.access_token,
          role: res.role,
          full_name: res.full_name,
          email: res.email,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to accept invitation. The link may be expired or already used.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Accept institutional invitation"
      subtitle="Complete your profile and set a strong password to activate your invited role."
      footer={
        <Link href="/auth/login" className="font-semibold text-accent hover:text-accent2 transition-colors">
          Already activated? Sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {!initialToken && (
          <AuthInput label="Invitation token" value={token} onChange={setToken} placeholder="Paste invitation token" />
        )}
        <AuthInput label="Full name" value={fullName} onChange={setFullName} placeholder="Your full name" autoComplete="name" />
        <div>
          <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 chars or 12+ passphrase" autoComplete="new-password" />
          <PasswordStrength password={password} />
        </div>
        <AuthInput label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat password" autoComplete="new-password" />
        {error && (
          <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono">
            {error}
          </p>
        )}
        <Button type="submit" loading={busy} className="w-full py-3">
          <UserCheck className="h-4 w-4" /> Activate Account
        </Button>
      </form>
    </AuthScreenLayout>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050507]" />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
