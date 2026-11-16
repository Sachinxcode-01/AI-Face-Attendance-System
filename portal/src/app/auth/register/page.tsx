'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Users, ShieldCheck, HeartHandshake, UserRound } from 'lucide-react';
import { AuthScreenLayout, AuthInput } from '@/components/auth/AuthScreenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/lib/types';

const ROLES: { value: UserRole; label: string; icon: React.ElementType }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap },
  { value: 'teacher', label: 'Teacher', icon: Users },
  { value: 'admin', label: 'Admin', icon: ShieldCheck },
  { value: 'parent', label: 'Parent', icon: HeartHandshake },
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    // Demo: simulate registration then auto-login as the chosen role.
    setTimeout(() => {
      login(role);
    }, 800);
  };

  return (
    <AuthScreenLayout
      title="Create your account"
      subtitle="Enroll your identity to start biometric attendance tracking."
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
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">Role</label>
          <div className="grid grid-cols-4 gap-2">
            {ROLES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`flex flex-col items-center gap-1.5 rounded-[14px] border p-2.5 text-[10.5px] font-semibold transition-all cursor-pointer ${
                  role === value
                    ? 'border-accent bg-accent/15 text-white shadow-[0_0_12px_rgba(143,139,255,0.2)]'
                    : 'border-white/[0.08] bg-surface text-mid hover:border-white/20'
                }`}
              >
                <Icon className={`h-4 w-4 ${role === value ? 'text-accent' : 'text-faint'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" autoComplete="new-password" />

        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono">{error}</p>}

        <Button type="submit" loading={busy} className="w-full py-3">
          <UserRound className="h-4 w-4" /> Create Account
        </Button>
      </form>
    </AuthScreenLayout>
  );
}
