'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider') || 'SSO';
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function finalize() {
      try {
        const refreshed = await api.auth.refreshSession();
        if (!refreshed?.access_token) {
          throw new Error('Unable to establish session.');
        }
        // Temporarily store token so profile() attaches Bearer header
        localStorage.setItem('sf_token', refreshed.access_token);
        const profile = await api.auth.profile();
        if (cancelled) return;
        loginWithToken({
          access_token: refreshed.access_token,
          role: profile?.role || 'student',
          full_name: profile?.full_name || profile?.name,
          email: profile?.email,
          user_id: profile?.id || profile?._id,
          profilePhotoUrl: profile?.profilePhotoUrl || profile?.avatar_url,
        });
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || `Failed to complete ${provider} sign in.`);
        }
      }
    }
    finalize();
    return () => {
      cancelled = true;
    };
  }, [loginWithToken, provider]);

  return (
    <AuthScreenLayout
      title={error ? 'Authentication failed' : 'Completing sign in'}
      subtitle={error ? `We could not finish signing in with ${provider}.` : `Verifying your ${provider} session securely...`}
    >
      {error ? (
        <div className="space-y-4 text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="text-xs text-red-300 font-mono">{error}</p>
          <Link href="/auth/login" className="inline-block">
            <Button>Return to Sign In</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-xs font-mono text-mid">Establishing encrypted session...</p>
        </div>
      )}
    </AuthScreenLayout>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050507]" />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
