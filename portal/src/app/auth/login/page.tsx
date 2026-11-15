'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Chrome, Github, GraduationCap, Users, ShieldCheck, HeartHandshake } from 'lucide-react';
import { AuthScreenLayout, AuthInput } from '@/components/auth/AuthScreenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/lib/types';
import { DEMO_ACCOUNTS } from '@/lib/auth';

const ROLE_BUTTONS: { role: UserRole; label: string; icon: React.ElementType; hint: string }[] = [
  { role: 'student', label: 'Student', icon: GraduationCap, hint: 'alice@smartface.pro' },
  { role: 'teacher', label: 'Teacher', icon: Users, hint: 'marcus.vance@smartface.pro' },
  { role: 'admin', label: 'Admin', icon: ShieldCheck, hint: 'evelyn.cross@smartface.pro' },
  { role: 'parent', label: 'Parent', icon: HeartHandshake, hint: 'sarah.smith@parent.net' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithCredentials } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    setTimeout(() => {
      const ok = loginWithCredentials(email, password);
      setBusy(false);
      if (!ok) setError('Invalid credentials. Try a demo account below or check your email/password.');
    }, 700);
  };

  const demoLogin = (role: UserRole) => {
    login(role);
  };

  return (
    <AuthScreenLayout
      title="Sign in to SmartFace"
      subtitle="Biometric attendance access for students, faculty, admins, and parents."
      footer={
        <>
          New here?{' '}
          <Link href="/auth/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@smartface.pro" autoComplete="email" />
        <div>
          <AuthInput label="Password" type={showPw ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="mt-1.5 text-[11px] text-gray-500 hover:text-gray-300"
          >
            {showPw ? 'Hide' : 'Show'} password
          </button>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
        )}

        <Button type="submit" loading={busy} className="w-full py-3">
          <Mail className="h-4 w-4" /> Sign In Securely
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-gray-500">
        <span className="h-px flex-1 bg-white/10" /> or continue with <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
          <Chrome className="h-4 w-4" /> Google
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
          <Github className="h-4 w-4" /> GitHub
        </button>
      </div>

      <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-gray-500">
        <span className="h-px flex-1 bg-white/10" /> demo access <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {ROLE_BUTTONS.map(({ role, label, icon: Icon, hint }) => (
          <button
            key={role}
            onClick={() => demoLogin(role)}
            className="group flex flex-col items-start gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10"
          >
            <Icon className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">{label}</span>
            <span className="truncate font-mono text-[9px] text-gray-500">{hint}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-[10px] text-gray-600">
        Demo password for all roles: <span className="font-mono text-gray-400">demo1234</span>
      </p>

      <div className="mt-4 flex items-center justify-between text-[11px]">
        <Link href="/auth/forgot-password" className="text-gray-500 hover:text-indigo-400">
          Forgot password?
        </Link>
        <Link href="/auth/verify" className="text-gray-500 hover:text-indigo-400">
          Verify email / OTP
        </Link>
      </div>
    </AuthScreenLayout>
  );
}
