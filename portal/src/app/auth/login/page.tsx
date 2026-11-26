'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, HeartHandshake, ShieldCheck, Users } from 'lucide-react';
import LoginCardSection, { type LoginRoleOption } from '@/components/ui/login-signup';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleRedirectPath } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

const REMEMBER_EMAIL_KEY = 'sf_remember_login_email';

const ROLE_BUTTONS: LoginRoleOption[] = [
  { role: 'student', label: 'Student', icon: GraduationCap, hint: 'alice@smartface.pro' },
  { role: 'teacher', label: 'Teacher', icon: Users, hint: 'marcus.vance@smartface.pro' },
  { role: 'admin', label: 'Admin', icon: ShieldCheck, hint: 'evelyn.cross@smartface.pro' },
  { role: 'parent', label: 'Parent', icon: HeartHandshake, hint: 'sarah.smith@parent.net' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role: currentRole, login, loginWithCredentials } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch {
      // Ignore storage access restrictions
    }
    if (searchParams.get('registered') === '1') {
      setNotice('Account created. Sign in with your campus credentials.');
    }
  }, [searchParams]);

  const redirectAfterAuth = (userRole?: UserRole) => {
    const from = searchParams.get('from');
    if (from && from.startsWith('/')) {
      router.push(from);
    } else {
      router.push(getRoleRedirectPath(userRole || currentRole));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    try {
      try {
          if (rememberEmail && email.trim()) {
            window.localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
          } else {
            window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
          }
        } catch {
          // Ignore storage errors
        }

        const res = await loginWithCredentials(email, password);
        setBusy(false);
        if (res.success) {
          redirectAfterAuth((res as { role?: UserRole }).role);
        } else {
          setError(res.error || 'Invalid credentials. Try a demo account below or check your email/password.');
        }
      } catch {
        setBusy(false);
        setError('An unexpected error occurred. Please try again.');
      }
    };

        const demoLogin = async (role: UserRole) => {
          setError('');
          setNotice('');
          setSelectedRole(role);
          setBusy(true);
          try {
            await login(role);
            redirectAfterAuth(role);
          } catch {
            setError('Unable to start demo session right now.');
          } finally {
            setBusy(false);
          }
        };

        const handleSocialLogin = (provider: 'google' | 'github') => {
    setError('');
          setNotice(
            provider === 'google'
              ? 'Google SSO requires campus OAuth configuration; use your campus email or Demo Access below.'
              : 'GitHub SSO requires OAuth configuration; use your campus email or Demo Access below.',
    );
};

return (
  <LoginCardSection
    email={email}
    onEmailChange={setEmail}
    password={password}
    onPasswordChange={setPassword}
    rememberEmail={rememberEmail}
    onRememberEmailChange={setRememberEmail}
    onSubmit={submit}
    busy={busy}
    error={error}
    notice={notice}
    roleOptions={ROLE_BUTTONS}
    selectedRole={selectedRole}
    onRoleSelect={demoLogin}
    onSocialLogin={handleSocialLogin}
  />
);
}

export default function LoginPage() {
  return (
      <Suspense fallback={<div className="min-h-screen bg-[#070A14]" />}>
        <LoginForm />
      </Suspense>
      );
}
