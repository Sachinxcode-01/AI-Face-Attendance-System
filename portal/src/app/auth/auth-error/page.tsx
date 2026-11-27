'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { Button } from '@/components/ui/Button';

const ERROR_MESSAGES: Record<string, string> = {
  oauth_cancelled: 'Sign-in was cancelled at the identity provider.',
  invalid_oauth_state: 'Security check failed: invalid or expired OAuth state. Please try again.',
  oauth_unconfigured: 'This identity provider is not configured on the server yet.',
  unverified_email: 'Your identity provider account does not have a verified email address.',
  account_inactive: 'Your account is currently suspended or inactive. Contact your institution administrator.',
  oauth_failed: 'Unable to complete single sign-on. Please try again.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('error') || 'oauth_failed';
  const message = ERROR_MESSAGES[code] || 'An authentication error occurred. Please sign in again.';

  return (
    <AuthScreenLayout title="Authentication error" subtitle="We could not complete your sign-in request.">
      <div className="space-y-4 text-center py-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <p className="text-xs text-red-300 font-mono leading-relaxed">{message}</p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/auth/login">
            <Button>Return to Sign In</Button>
          </Link>
        </div>
      </div>
    </AuthScreenLayout>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050507]" />}>
      <AuthErrorContent />
    </Suspense>
  );
}
