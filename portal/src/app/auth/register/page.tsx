'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, HeartHandshake, UserRound } from 'lucide-react';
import { AuthScreenLayout, AuthInput } from '@/components/auth/AuthScreenLayout';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/lib/types';
import { getRoleRedirectPath } from '@/lib/auth';

const PUBLIC_ROLES: { value: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap, desc: 'Institutional student access' },
  { value: 'parent', label: 'Parent / Guardian', icon: HeartHandshake, desc: 'Requires ward invitation' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
      if (password.length < 12) {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
          setError('Passwords under 12 characters must contain uppercase, lowercase, number, and special character.');
          return;
        }
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!acceptedTerms) {
        setError('Please acknowledge the Terms of Service and Privacy Policy.');
        return;
      }

      setBusy(true);
      try {
        const res = await register({
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          password,
        });
        setBusy(false);
        if (res.success) {
          if ((res as { hasToken?: boolean }).hasToken) {
            router.push(getRoleRedirectPath(role));
          } else {
            router.push(`/auth/verify?email=${encodeURIComponent(email.trim().toLowerCase())}&mode=email`);
          }
        } else {
          setError(res.error || 'Registration failed. Please try again.');
        }
      } catch {
        setBusy(false);
        setError('An unexpected error occurred. Please try again.');
      }
    };

    return (
      <AuthScreenLayout
        title="Create your account"
        subtitle="Register with your institutional email. Staff and admin accounts require an invitation."
        footer={
          <>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-accent hover:text-accent2 transition-colors">
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <AuthInput label="Full name" value={name} onChange={setName} placeholder="e.g. Alice Smith" autoComplete="name" />
          <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@smartface.pro" autoComplete="email" />

          <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">Account Type</label>
          <div className="grid grid-cols-2 gap-2.5">
            {PUBLIC_ROLES.map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`flex flex-col items-start gap-1 rounded-[14px] border p-3 text-left transition-all cursor-pointer ${
                  role === value
                    ? 'border-accent bg-accent/15 text-white shadow-[0_0_12px_rgba(143,139,255,0.2)]'
                    : 'border-white/[0.08] bg-surface text-mid hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Icon className={`h-4 w-4 ${role === value ? 'text-accent' : 'text-faint'}`} />
                  {label}
                </div>
                <span className="text-[10px] text-faint">{desc}</span>
              </button>
            ))}
          </div>
        </div>

            <div>
              <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 chars or 12+ passphrase" autoComplete="new-password" />
              <PasswordStrength password={password} />
            </div>

            <AuthInput label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat password" autoComplete="new-password" />

            <label className="flex items-start gap-2.5 text-xs text-mid cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-surface accent-accent"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            {error && (
              <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono">
                {error}
              </p>
            )}

            <Button type="submit" loading={busy} className="w-full py-3">
              <UserRound className="h-4 w-4" /> Create Account
            </Button>
        </form>
      </AuthScreenLayout>
    );
  }
