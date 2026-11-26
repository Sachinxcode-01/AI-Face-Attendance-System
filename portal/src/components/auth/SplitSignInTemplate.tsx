'use client';

import React, { useId, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  QrCode,
  ScanFace,
  ShieldCheck,
  Star,
  UserCheck,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

export interface LoginRoleOption {
  role: UserRole;
  label: string;
  hint: string;
  icon: React.ElementType;
}

export interface SplitSignInTemplateProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  rememberMe: boolean;
  onRememberMeChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
  error?: string;
  notice?: string;
  roleOptions: LoginRoleOption[];
  selectedRole: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
  onSocialLogin?: (provider: 'google' | 'github') => void;
}

/**
 * Split Sign-In Template sourced from 21st.dev (`sign-in-3` Split Sign In Form)
 * and styled with the SmartFace `DESIGN.md` color palette, orbs, typography, and radii.
 */
export function SplitSignInTemplate({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  rememberMe,
  onRememberMeChange,
  onSubmit,
  busy,
  error,
  notice,
  roleOptions,
  selectedRole,
  onRoleSelect,
  onSocialLogin,
}: SplitSignInTemplateProps) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main
      aria-label="Sign in"
      className="grid min-h-svh w-full grid-cols-1 bg-[#070A14] text-[#C8CCDF] font-[family-name:var(--font-inter)] lg:grid-cols-2 lg:p-3"
    >
      {/* Left Column: Authentication Form */}
      <section className="relative flex flex-col justify-between px-5 py-6 sm:px-10 lg:px-12">
        {/* Top Gateway Bar */}
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)',
              }}
            >
              <ScanFace className="h-4.5 w-4.5" strokeWidth={2.3} />
            </div>
            <div>
              <span className="font-[family-name:var(--font-poppins)] text-base font-bold tracking-tight text-[#F1F3F9]">
                SmartFace
              </span>
              <span className="ml-2 rounded-full border border-[#252E4A] bg-[#141D38] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A5B4FC]">
                Portal
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C82A0] transition-colors hover:text-[#F1F3F9]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Gateway
          </Link>
        </div>

        {/* Centered Auth Card Container */}
        <div className="mx-auto my-8 flex w-full max-w-[420px] flex-col gap-6 rounded-[28px] border border-[#252E4A] bg-[#141D38]/90 p-6 shadow-[0_-5px_30px_rgba(7,10,20,0.65)] backdrop-blur-xl sm:p-8">
          {/* Header Avatar + Title (21st sign-in-3 medallion adapted to DESIGN.md) */}
          <div className="flex flex-col items-center gap-3.5 text-center">
            <div className="relative flex size-14 items-center justify-center">
              <div
                className="absolute inset-0 scale-125 rounded-full opacity-55 blur-md"
                style={{
                  background: 'radial-gradient(circle, #9AA4EC 0%, #4D58C0 65%, transparent 100%)',
                }}
              />
              <div className="relative z-10 flex size-14 items-center justify-center rounded-full border border-[#6366F1]/40 bg-[#131A33] shadow-inner">
                <UserCheck aria-hidden="true" className="size-6 text-[#818CF8]" />
              </div>
            </div>

            <div>
              <h1 className="font-[family-name:var(--font-poppins)] text-[22px] font-bold tracking-[-0.2px] text-[#F1F3F9] sm:text-2xl">
                Welcome back
              </h1>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[#7C82A0]">
                Sign in to access biometric attendance, schedules, and analytics.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor={`${id}-email`}
                className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[1.2px] text-[#7C82A0]"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7C82A0]"
                />
                <input
                  id={`${id}-email`}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="you@smartface.pro"
                  autoComplete="email"
                  className="h-[50px] w-full rounded-[12px] border border-[#252E4A] bg-[#131A33] pl-11 pr-4 text-[14px] text-[#F1F3F9] placeholder:text-[#4B5170] transition-all focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor={`${id}-password`}
                  className="block text-[10.5px] font-semibold uppercase tracking-[1.2px] text-[#7C82A0]"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="font-[family-name:var(--font-poppins)] text-[11px] font-bold text-[#818CF8] transition-colors hover:text-[#A5B4FC]"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <Lock
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7C82A0]"
                />
                <input
                  id={`${id}-password`}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="h-[50px] w-full rounded-[12px] border border-[#252E4A] bg-[#131A33] pl-11 pr-11 text-[14px] text-[#F1F3F9] placeholder:text-[#4B5170] transition-all focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#7C82A0] transition-colors hover:bg-[#1A2340] hover:text-[#F1F3F9]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Keep Me Logged In + Verify OTP */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => onRememberMeChange(!rememberMe)}
                className="flex items-center gap-2 text-left text-xs text-[#C8CCDF]"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-[4px] border transition-colors ${
                    rememberMe
                      ? 'border-[#6366F1] bg-[#3D4AB8] text-white'
                      : 'border-[#252E4A] bg-[#131A33] text-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                Keep me logged in
              </button>

              <Link
                href="/auth/verify"
                className="text-[11px] font-medium text-[#7C82A0] transition-colors hover:text-[#818CF8]"
              >
                Verify email / OTP
              </Link>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-[12px] border border-[#EF4444]/35 bg-[#EF4444]/10 px-3.5 py-2.5 text-xs text-[#FCA5A5]"
              >
                {error}
              </p>
            )}

            {notice && !error && (
              <p className="rounded-[12px] border border-[#6366F1]/35 bg-[#1A2340] px-3.5 py-2.5 text-xs text-[#A5B4FC]">
                {notice}
              </p>
            )}

            {/* Primary CTA Button (DESIGN.md Section 5.2) */}
            <button
              type="submit"
              disabled={busy}
              className="mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] font-[family-name:var(--font-poppins)] text-[15px] font-semibold tracking-[0.6px] text-white transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)',
                boxShadow: '0 8px 18px rgba(79, 70, 229, 0.28)',
              }}
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider (DESIGN.md Section 5.5) */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[#1F2942]" />
            <span className="font-[family-name:var(--font-poppins)] text-[11px] font-medium text-[#7C82A0]">
              Sign in with
            </span>
            <span className="h-px flex-1 bg-[#1F2942]" />
          </div>

          {/* Social Auth Row */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSocialLogin?.('google')}
              className="flex h-[50px] items-center justify-center gap-2.5 rounded-[12px] border-[1.5px] border-[#252E4A] bg-[#141D38] text-[13px] font-semibold text-[#F1F3F9] shadow-[0_3px_6px_rgba(0,0,0,0.2)] transition-colors hover:border-[#6366F1] hover:bg-[#1A2340]"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.24 1.25-.96 2.31-2.04 3.02l3.3 2.56c1.92-1.77 3.04-4.38 3.04-7.48 0-.72-.06-1.41-.19-2.08H12z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.3-2.56c-.91.61-2.07.98-3.32.98-2.55 0-4.71-1.72-5.48-4.04H3.11v2.64A10 10 0 0 0 12 22z"
                />
                <path
                  fill="#4A90E2"
                  d="M6.52 13.96A5.99 5.99 0 0 1 6.2 12c0-.68.12-1.34.32-1.96V7.4H3.11A10 10 0 0 0 2 12c0 1.61.39 3.14 1.11 4.6l3.41-2.64z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 6c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.99 14.7 2 12 2a10 10 0 0 0-8.89 5.4l3.41 2.64C7.29 7.72 9.45 6 12 6z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={() => onSocialLogin?.('github')}
              className="flex h-[50px] items-center justify-center gap-2.5 rounded-[12px] border-[1.5px] border-[#252E4A] bg-[#141D38] text-[13px] font-semibold text-[#F1F3F9] shadow-[0_3px_6px_rgba(0,0,0,0.2)] transition-colors hover:border-[#6366F1] hover:bg-[#1A2340]"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Instant Demo Role Cards (DESIGN.md Section 5.3) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#7C82A0]">
                Instant Demo Access
              </span>
              <span className="font-mono text-[10px] text-[#7C82A0]">
                pw: <span className="text-[#A5B4FC]">demo1234</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {roleOptions.map(({ role, label, hint, icon: Icon }) => {
                const active = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={busy}
                    onClick={() => onRoleSelect(role)}
                    className={`flex flex-col items-start gap-1 rounded-[20px] p-3 text-left transition-all active:scale-[0.96] disabled:opacity-60 ${
                      active
                        ? 'border-2 border-[#6366F1] bg-[#1A2340] shadow-[0_4px_10px_rgba(99,102,241,0.16)]'
                        : 'border border-[#252E4A] bg-[#131A33] hover:border-[#6366F1]/70 hover:bg-[#1A2340]/70'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-[#6366F1]' : 'text-[#7C82A0]'}`}
                    />
                    <span className="text-xs font-semibold text-[#F1F3F9]">{label}</span>
                    <span className="w-full truncate font-mono text-[9.5px] text-[#7C82A0]">
                      {hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Link (DESIGN.md Section 4) */}
          <div className="border-t border-[#1F2942] pt-4 text-center text-xs text-[#7C82A0]">
            Not enrolled yet?{' '}
            <Link
              href="/auth/register"
              className="font-[family-name:var(--font-poppins)] font-bold text-[#818CF8] transition-colors hover:text-[#A5B4FC]"
            >
              Create an account
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#4B5170]">
          End-to-end session isolation · ArcFace 512-D verification
        </p>
      </section>

      {/* Right Column: Hero Orb Showcase & Institutional Testimonial (21st sign-in-3 + DESIGN.md Section 2.1-2.2) */}
      <aside
        className="relative flex flex-col justify-between overflow-hidden rounded-[28px] p-10 max-lg:hidden xl:p-12"
        style={{
          background: 'linear-gradient(155deg, #3D4AB8 0%, #3730A3 42%, #141D38 100%)',
        }}
      >
        {/* Ethereal Hero Orbs (DESIGN.md Section 2.2) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full opacity-75 blur-[2px]"
          style={{
            background: 'radial-gradient(circle, #9AA4EC 0%, #6670D0 45%, #4D58C0 75%, transparent 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-20 top-44 h-36 w-36 rounded-full opacity-55"
          style={{
            background: 'radial-gradient(circle, #9AA4EC 0%, #4D58C0 75%, transparent 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 bottom-36 h-44 w-44 rounded-full opacity-45"
          style={{
            background: 'radial-gradient(circle, #9AA4EC 0%, #6670D0 50%, #4D58C0 80%, transparent 100%)',
          }}
        />

        {/* Top System Pill & Capabilities */}
        <div className="relative z-10 flex flex-col gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-[#141D38]/40 px-3.5 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            <span className="font-mono text-[11px] font-medium tracking-wide text-[#F1F3F9]">
              Authoritative Verification Active
            </span>
          </div>

          <div className="max-w-lg space-y-3">
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl font-bold leading-tight tracking-tight text-[#F1F3F9]">
              Zero-proxy campus attendance with deterministic eligibility.
            </h2>
            <p className="text-sm leading-relaxed text-[#C8CCDF]">
              Every check-in is server-verified through encrypted rotating QR tokens, ArcFace 512-D embeddings, and strict tenant RBAC isolation.
            </p>
          </div>

          <div className="grid max-w-lg grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
            <div className="rounded-[16px] border border-white/15 bg-[#141D38]/50 p-3.5 backdrop-blur-md">
              <QrCode className="mb-2 h-4 w-4 text-[#A5B4FC]" />
              <p className="font-[family-name:var(--font-poppins)] text-xs font-semibold text-[#F1F3F9]">
                15s QR Rotation
              </p>
              <p className="mt-0.5 text-[11px] text-[#C8CCDF]">Replay-resistant session tokens</p>
            </div>
            <div className="rounded-[16px] border border-white/15 bg-[#141D38]/50 p-3.5 backdrop-blur-md">
              <ScanFace className="mb-2 h-4 w-4 text-[#A5B4FC]" />
              <p className="font-[family-name:var(--font-poppins)] text-xs font-semibold text-[#F1F3F9]">
                512-D Biometrics
              </p>
              <p className="mt-0.5 text-[11px] text-[#C8CCDF]">Non-invertible vector matching</p>
            </div>
            <div className="rounded-[16px] border border-white/15 bg-[#141D38]/50 p-3.5 backdrop-blur-md">
              <ShieldCheck className="mb-2 h-4 w-4 text-[#A5B4FC]" />
              <p className="font-[family-name:var(--font-poppins)] text-xs font-semibold text-[#F1F3F9]">
                Strict RBAC
              </p>
              <p className="mt-0.5 text-[11px] text-[#C8CCDF]">Isolated student & college caches</p>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial Panel (21st sign-in-3 pattern) */}
        <div className="relative z-10 mt-10 rounded-[22px] border border-white/15 bg-[#141D38]/75 p-6 backdrop-blur-xl">
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                aria-hidden="true"
                className="h-4 w-4 fill-[#818CF8] text-[#818CF8]"
              />
            ))}
          </div>
          <p className="text-[15px] leading-relaxed text-[#F1F3F9]">
            &ldquo;Moving morning roll calls onto SmartFace cut proxy check-ins to zero and gave our faculty{' '}
            <span className="font-semibold text-[#A5B4FC]">real-time eligibility clarity</span> across every department.&rdquo;
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#6366F1]/50 bg-[#1A2340] font-[family-name:var(--font-poppins)] text-sm font-bold text-[#A5B4FC]">
              MV
            </div>
            <div>
              <p className="font-[family-name:var(--font-poppins)] text-sm font-semibold text-[#F1F3F9]">
                Dr. Marcus Vance
              </p>
              <p className="text-xs text-[#C8CCDF]">Dean of Academic Operations</p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
