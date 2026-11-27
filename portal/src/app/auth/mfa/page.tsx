'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { AuthScreenLayout, AuthInput } from '@/components/auth/AuthScreenLayout';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function MfaChallengePage() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [mfaToken, setMfaToken] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const tok = window.sessionStorage.getItem('sf_mfa_token') || '';
      if (!tok) {
        router.replace('/auth/login');
      } else {
        setMfaToken(tok);
      }
    } catch {
      router.replace('/auth/login');
    }
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !mfaToken) return;
    setError('');
    setBusy(true);
    try {
      const res = await api.auth.mfaChallenge(mfaToken, code.trim());
      try {
        window.sessionStorage.removeItem('sf_mfa_token');
      } catch {}
      loginWithToken({
        access_token: res.access_token,
        role: res.role,
        full_name: res.full_name,
        email: res.email,
        profilePhotoUrl: res.profilePhotoUrl,
      });
    } catch (err: any) {
      setError(err?.message || 'Invalid authenticator or recovery code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app or a backup recovery code."
      footer={
        <Link href="/auth/login" className="inline-flex items-center gap-1 font-semibold text-accent hover:text-accent2 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthInput
          label="Authenticator or recovery code"
          value={code}
          onChange={setCode}
          placeholder="123456 or XXXX-XXXX"
          autoComplete="one-time-code"
        />
        {error && (
          <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono">
            {error}
          </p>
        )}
        <Button type="submit" loading={busy} className="w-full py-3">
          <ShieldCheck className="h-4 w-4" /> Verify & Sign In
        </Button>
      </form>
    </AuthScreenLayout>
  );
}
