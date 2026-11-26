"use client";

import * as React from "react";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui/auth-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Chrome,
  Eye,
  EyeOff,
  Github,
  Loader2,
  Lock,
  Mail,
  ScanFace,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface LoginRoleOption {
  role: UserRole;
  label: string;
  hint: string;
  icon: React.ElementType;
}

export interface LoginCardSectionProps {
  email?: string;
  onEmailChange?: (value: string) => void;
  password?: string;
  onPasswordChange?: (value: string) => void;
  rememberEmail?: boolean;
  onRememberEmailChange?: (checked: boolean) => void;
  onSubmit?: (e: React.FormEvent) => void;
  busy?: boolean;
  error?: string;
  notice?: string;
  roleOptions?: LoginRoleOption[];
  selectedRole?: UserRole | null;
  onRoleSelect?: (role: UserRole) => void;
  onSocialLogin?: (provider: "google" | "github") => void;
}

export default function LoginCardSection({
  email = "",
  onEmailChange,
  password = "",
  onPasswordChange,
  rememberEmail = true,
  onRememberEmailChange,
  onSubmit,
  busy = false,
  error = "",
  notice = "",
  roleOptions = [],
  selectedRole = null,
  onRoleSelect,
  onSocialLogin,
}: LoginCardSectionProps) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type Particle = { x: number; y: number; v: number; o: number };
    let particles: Particle[] = [];
    let raf = 0;

    const make = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.25 + 0.05,
      o: Math.random() * 0.35 + 0.15,
    });

    const init = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < count; i++) particles.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 40;
          p.v = Math.random() * 0.25 + 0.05;
          p.o = Math.random() * 0.35 + 0.15;
        }
        // Tinted with DESIGN.md orbLight (#9AA4EC)
        ctx.fillStyle = `rgba(154,164,236,${p.o})`;
        ctx.fillRect(p.x, p.y, 0.8, 2.2);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#070A14] font-[family-name:var(--font-inter)] text-[#F1F3F9]">
      <style>{`
        .accent-lines{position:fixed;inset:0;pointer-events:none;opacity:.75}
        .hline,.vline{position:absolute;background:#1F2942;will-change:transform,opacity}
        .hline{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:drawX .8s cubic-bezier(.22,.61,.36,1) forwards}
        .vline{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:drawY .9s cubic-bezier(.22,.61,.36,1) forwards}
        .hline:nth-child(1){top:18%;animation-delay:.12s}
        .hline:nth-child(2){top:50%;animation-delay:.22s}
        .hline:nth-child(3){top:82%;animation-delay:.32s}
        .vline:nth-child(4){left:22%;animation-delay:.42s}
        .vline:nth-child(5){left:50%;animation-delay:.54s}
        .vline:nth-child(6){left:78%;animation-delay:.66s}
        .hline::after,.vline::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(129,140,248,.35),transparent);opacity:0;animation:shimmer .9s ease-out forwards}
        .hline:nth-child(1)::after{animation-delay:.12s}
        .hline:nth-child(2)::after{animation-delay:.22s}
        .hline:nth-child(3)::after{animation-delay:.32s}
        .vline:nth-child(4)::after{animation-delay:.42s}
        .vline:nth-child(5)::after{animation-delay:.54s}
        .vline:nth-child(6)::after{animation-delay:.66s}
        @keyframes drawX{0%{transform:scaleX(0);opacity:0}60%{opacity:.95}100%{transform:scaleX(1);opacity:.75}}
        @keyframes drawY{0%{transform:scaleY(0);opacity:0}60%{opacity:.95}100%{transform:scaleY(1);opacity:.75}}
        @keyframes shimmer{0%{opacity:0}35%{opacity:.3}100%{opacity:0}}

        .card-animate {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.8s cubic-bezier(.22,.61,.36,1) 0.2s forwards;
        }
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* DESIGN.md Hero Orb Radial Vignette (#9AA4EC -> #4D58C0) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(65% 50% at 50% 20%, rgba(154, 164, 236, 0.16), rgba(77, 88, 192, 0.08) 45%, transparent 72%)",
        }}
      />

      {/* Animated accent lines */}
      <div aria-hidden="true" className="accent-lines">
        <div className="hline" />
        <div className="hline" />
        <div className="hline" />
        <div className="vline" />
        <div className="vline" />
        <div className="vline" />
      </div>

      {/* Particles */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full opacity-55 mix-blend-screen"
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#252E4A] bg-[#070A14]/70 px-6 py-4 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              boxShadow: "0 6px 16px rgba(79, 70, 229, 0.28)",
            }}
          >
            <ScanFace className="h-4 w-4" strokeWidth={2.3} />
          </span>
          <span className="font-[family-name:var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.16em] text-[#C8CCDF]">
            SmartFace Portal
          </span>
        </Link>

        <Button asChild variant="outline" className="h-9 rounded-[10px]">
          <Link href="/">
            <span className="mr-2">Gateway</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      {/* Centered Login Card */}
      <div className="relative z-10 grid flex-1 place-items-center px-4 py-10">
        <Card className="card-animate w-full max-w-md border-[#252E4A] bg-[#141D38]/85 backdrop-blur-xl">
          <CardHeader className="space-y-1.5">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to the SmartFace console to manage attendance, schedules,
              and verification logs.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5">
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor={`${id}-email`}
                  className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#7C82A0]"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C82A0]" />
                  <Input
                    id={`${id}-email`}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => onEmailChange?.(e.target.value)}
                    placeholder="you@smartface.pro"
                    autoComplete="email"
                    className="h-[48px] pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={`${id}-password`}
                    className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#7C82A0]"
                  >
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="font-[family-name:var(--font-poppins)] text-xs font-semibold text-[#818CF8] transition-colors hover:text-[#A5B4FC]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C82A0]" />
                  <Input
                    id={`${id}-password`}
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => onPasswordChange?.(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-[48px] pl-10 pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#7C82A0] transition-colors hover:text-[#F1F3F9]"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${id}-remember`}
                    checked={rememberEmail}
                    onCheckedChange={(checked: boolean | "indeterminate") =>
                      onRememberEmailChange?.(checked === true)
                    }
                  />
                  <Label
                    htmlFor={`${id}-remember`}
                    className="cursor-pointer text-xs text-[#C8CCDF]"
                  >
                    Remember email
                  </Label>
                </div>

                <Link
                  href="/auth/verify"
                  className="text-xs font-medium text-[#7C82A0] transition-colors hover:text-[#818CF8]"
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

              <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={
                  notice && !error
                    ? "rounded-[12px] border border-[#6366F1]/35 bg-[#1A2340] px-3.5 py-2.5 text-xs text-[#A5B4FC]"
                    : "sr-only"
                }
              >
                {!error ? notice || "" : ""}
              </p>

              <Button
                type="submit"
                size="lg"
                disabled={busy}
                className="w-full font-[family-name:var(--font-poppins)]"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {busy ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#141D38] px-2.5 text-[10.5px] font-medium uppercase tracking-widest text-[#7C82A0]">
                or
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => onSocialLogin?.("github")}
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => onSocialLogin?.("google")}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>

            {roleOptions.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[1.2px] text-[#7C82A0]">
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
                        onClick={() => onRoleSelect?.(role)}
                        className={`flex flex-col items-start gap-1 rounded-[16px] p-3 text-left transition-all active:scale-[0.96] disabled:opacity-60 ${
                          active
                            ? "border-2 border-[#6366F1] bg-[#1A2340] shadow-[0_4px_10px_rgba(99,102,241,0.16)]"
                            : "border border-[#252E4A] bg-[#131A33] hover:border-[#6366F1]/70 hover:bg-[#1A2340]/70"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            active ? "text-[#6366F1]" : "text-[#7C82A0]"
                          }`}
                        />
                        <span className="text-xs font-semibold text-[#F1F3F9]">
                          {label}
                        </span>
                        <span className="w-full truncate font-mono text-[9.5px] text-[#7C82A0]">
                          {hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-2 border-t border-[#1F2942] pt-4 text-xs text-[#7C82A0]">
            <div>
              New to SmartFace?
              <Link
                href="/auth/register"
                className="ml-1.5 font-[family-name:var(--font-poppins)] font-bold text-[#818CF8] transition-colors hover:text-[#A5B4FC]"
              >
                Create an account
              </Link>
            </div>
            <span className="font-mono text-[10px] tracking-wide text-[#4B5170]">
              ArcFace 512-D · Multi-Tenant RBAC
            </span>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
