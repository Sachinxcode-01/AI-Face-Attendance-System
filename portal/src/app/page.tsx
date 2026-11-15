'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ScanFace,
  GraduationCap,
  Users,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Lock,
  Activity,
  Radio,
  Flame,
  QrCode,
  ShieldAlert,
  Bell
} from 'lucide-react';
import gsap from 'gsap';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';

interface PortalCardConfig {
  title: string;
  role: UserRole;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeStyle: string;
  borderHover: string;
  tagline: string;
  description: string;
  features: string[];
  demoUser: string;
  demoDetails: string;
  metric: { label: string; value: string; icon: React.ComponentType<{ className?: string }> };
}

const PORTALS: PortalCardConfig[] = [
  {
    title: 'Student Portal',
    role: 'student',
    badge: 'STUDENT',
    icon: GraduationCap,
    accentColor: 'from-blue-600 to-indigo-600',
    badgeStyle: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    borderHover: 'hover:border-indigo-500/50 hover:shadow-indigo-500/20',
    tagline: 'Streaks, Analytics & Nexa AI',
    description: 'Monitor daily attendance streaks, view dynamic timetable slots, check subject-by-subject safety buffers, and consult Nexa Copilot.',
    features: [
      'Golden Blaze 14-Day Streak',
      'Mon–Sat Class Schedule & Rooms',
      'Nexa AI Safe-Bunk Calculator',
      'Fast Biometric & QR Check-in',
    ],
    demoUser: 'Alice Smith',
    demoDetails: 'Roll #CS-2024-042 • 88.6% Att.',
    metric: { label: 'Active Streak', value: '14 Days (Golden)', icon: Flame },
  },
  {
    title: 'Faculty & Teacher Portal',
    role: 'teacher',
    badge: 'FACULTY',
    icon: Users,
    accentColor: 'from-emerald-600 to-teal-600',
    badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    borderHover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/20',
    tagline: 'Dynamic Anti-Proxy Sessions',
    description: 'Launch dynamic 15-second rotating QR attendance sessions, operate kiosk biometric scanning, and manage student leave requests in real time.',
    features: [
      '15-Second Dynamic Rotating QR',
      'Live Biometric Check-in Roster',
      'One-Click Leave Approval Inbox',
      'Lecture Attendance Analytics',
    ],
    demoUser: 'Prof. Marcus Vance',
    demoDetails: 'AI & Robotics Dept • Session Host',
    metric: { label: 'Active Session', value: 'CS-401 (Live QR)', icon: QrCode },
  },
  {
    title: 'Admin Sentinel Console',
    role: 'admin',
    badge: 'ADMIN SENTINEL',
    icon: ShieldCheck,
    accentColor: 'from-purple-600 to-fuchsia-600',
    badgeStyle: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    borderHover: 'hover:border-purple-500/50 hover:shadow-purple-500/20',
    tagline: 'Biometric Telemetry & Security',
    description: 'Campus-wide attendance feeds, ArcFace 512-dim neural calibration, unauthorized visitor alarms, and immutable audit logs.',
    features: [
      'Real-Time Intruder Face Sentinel',
      'ArcFace 512-dim Verification Tuner',
      'Campus Attendance Live Stream',
      'Automated Disciplinary Reports',
    ],
    demoUser: 'Dr. Evelyn Cross',
    demoDetails: 'Campus Dean & Security Ops',
    metric: { label: 'Sentinel Status', value: 'Active (0 Intruders)', icon: ShieldAlert },
  },
  {
    title: 'Parent Observer Portal',
    role: 'parent',
    badge: 'PARENT',
    icon: HeartHandshake,
    accentColor: 'from-amber-600 to-orange-600',
    badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    borderHover: 'hover:border-amber-500/50 hover:shadow-amber-500/20',
    tagline: 'Instant Notifications & Safety',
    description: 'Receive instantaneous biometric entry/exit pings, track monthly subject compliance, and submit verified medical leave documentation.',
    features: [
      'Instant Campus Arrival / Gate SMS',
      'Subject Absence Risk Alert Radar',
      'Digital Leave Request Upload',
      'Direct Faculty Communication',
    ],
    demoUser: 'Sarah & David Smith',
    demoDetails: 'Guardian of Alice Smith (CS-042)',
    metric: { label: 'Latest Ping', value: 'Gate A @ 08:42 AM', icon: Bell },
  },
];

export default function PortalGatewayPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const router = useRouter();
  const [navigatingRole, setNavigatingRole] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-hero-item',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out', clearProps: 'all' }
      );

    gsap.fromTo(
      '.gsap-portal-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power2.out', clearProps: 'all', delay: 0.15 }
    );
  }, containerRef);

  return () => ctx.revert();
}, []);

const handleLaunchRole = (role: UserRole) => {
  setNavigatingRole(role);
  login(role);
};

return (
    <div ref={containerRef} className="min-h-screen bg-[#070A14] text-[#C8CCDF] flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background radial gradient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[20%] w-[640px] h-[640px] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[10%] w-[640px] h-[640px] bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[30%] w-[480px] h-[480px] bg-purple-600/10 rounded-full blur-[130px]" />
      </div>

        {/* Top Header Navigation */}
        <header className="relative z-10 w-full border-b border-white/10 bg-[#070A14]/80 backdrop-blur-md py-4 px-6 sm:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                <ScanFace className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white tracking-tight text-lg">SmartFace</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                    Role Suite
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">Touchless AI Biometrics & Telemetry</p>
              </div>
            </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ArcFace Core: Online</span>
                </div>
                <Link
                  href="/auth/login"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/[0.08] hover:border-white/20"
                >
                  Custom Sign In
                </Link>
              </div>
            </header>

            {/* Main Content Area */}
              <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1 flex flex-col justify-center">

                {/* Header Block */}
                    <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
                      <div className="gsap-hero-item inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-4 shadow-sm shadow-indigo-500/20">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Unified Multi-Role Campus Architecture</span>
                      </div>

                        <h1 className="gsap-hero-item font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                          Select Your Role to Access <br className="hidden sm:inline" />
                          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
                            SmartFace Attendance Hub
                          </span>
                        </h1>

                          <p className="gsap-hero-item mt-4 text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            Role-based attendance intelligence powered by ArcFace deep embeddings, anti-proxy rotating QR tokens, and automated stakeholder notifications.
                          </p>

                          {/* Quick Metrics Banner */}
                          <div className="gsap-hero-item mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-400 font-mono">
                            <span className="flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-indigo-400" />
                              &lt;120ms ArcFace Latency
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="flex items-center gap-1.5">
                              <Activity className="h-3.5 w-3.5 text-emerald-400" />
                              94.2% Campus Compliance
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5 text-purple-400" />
                              AES-256 Token Protection
                            </span>
                          </div>
                        </div>

                        {/* 4 Role Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {PORTALS.map((portal) => {
                                const IconComponent = portal.icon;
                                const MetricIcon = portal.metric.icon;
                                const isLoading = navigatingRole === portal.role;

                                return (
                                  <div
                                    key={portal.role}
                                    className={`gsap-portal-card group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0E1428] p-6 shadow-xl shadow-black/40 backdrop-blur-xl transition-all duration-300 ${portal.borderHover} hover:shadow-2xl hover:-translate-y-1`}
                                  >
                                    <div>
                                      {/* Top Role Badge & Icon */}
                                      <div className="flex items-center justify-between mb-4">
                                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${portal.accentColor} text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform`}>
                                            <IconComponent className="h-6 w-6 text-white" />
                                          </div>
                                            <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border ${portal.badgeStyle}`}>
                                              {portal.badge}
                                            </span>
                                        </div>

                                          {/* Card Title & Tagline */}
                                          <h3 className="font-display text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                                            {portal.title}
                                          </h3>
                                            <p className="text-[11px] font-medium text-indigo-400/90 mb-3">
                                              {portal.tagline}
                                            </p>
                                            <p className="text-xs text-gray-400 leading-relaxed mb-5">
                                              {portal.description}
                                            </p>

                                            {/* Live Metric Pill */}
                                            <div className="mb-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs">
                                              <span className="text-gray-400 text-[11px] flex items-center gap-1.5">
                                                <MetricIcon className="h-3.5 w-3.5 text-indigo-400" />
                                                {portal.metric.label}:
                                              </span>
                                              <span className="font-mono font-semibold text-white text-[11px]">
                                                {portal.metric.value}
                                              </span>
                                            </div>

                                            {/* Features List */}
                                              <div className="space-y-2 border-t border-white/5 pt-4 mb-6">
                                                {portal.features.map((feat, idx) => (
                                                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                                    <span className="truncate">{feat}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>

                                            {/* Bottom Launch Button & Demo Hint */}
                                            <div>
                                                <div className="mb-3 rounded-lg bg-white/[0.02] border border-white/5 p-2 text-[11px] text-gray-400">
                                                  <div className="flex items-center justify-between">
                                                    <span className="text-gray-500">Demo User:</span>
                                                    <span className="text-white font-semibold">{portal.demoUser}</span>
                                                  </div>
                                                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">{portal.demoDetails}</div>
                                                </div>

                  <button
                                                  onClick={() => handleLaunchRole(portal.role)}
                                                  disabled={isLoading}
                                                  className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${portal.accentColor} py-2.5 px-4 text-xs font-bold text-white shadow-lg transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50`}
                                                >
                                                  <span>{isLoading ? 'Opening Session...' : 'Enter Dashboard'}</span>
                                                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                              </button>

                                              <div className="mt-2 text-center">
                                                <Link
                                                  href={`/auth/login?role=${portal.role}`}
                                                  className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                                                >
                                                  Or login with password →
                                                </Link>
                                              </div>
                                            </div>
                                          </div>
                                          );
          })}
                                      </div>

                                    </main>

                                    {/* Footer */}
                                      <footer className="relative z-10 border-t border-white/10 bg-[#070A14]/90 py-6 px-6 text-center text-xs text-gray-500">
                                        <p>
                                          SmartFace Attendance Suite • Multi-Role Secure Ecosystem • Protected by ArcFace Biometrics & Anti-Proxy Dynamic Tokens
                                        </p>
                                      </footer>
                                  </div>
                                );
                              }
