'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Users,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Flame,
  QrCode,
  ShieldAlert,
  Bell,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';

interface RolePortalConfig {
  title: string;
  role: UserRole;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentGradient: string;
  badgeStyle: string;
  tagline: string;
  description: string;
  features: string[];
  demoUser: string;
  demoDetails: string;
  metric: { label: string; value: string; icon: React.ComponentType<{ className?: string }> };
}

const ROLE_PORTALS: RolePortalConfig[] = [
  {
    title: 'Student Portal',
    role: 'student',
    badge: 'STUDENT',
    icon: GraduationCap,
    accentGradient: 'from-[#8F8BFF] to-[#6FD8FF]',
    badgeStyle: 'bg-[#8F8BFF]/10 text-[#8F8BFF] border-[#8F8BFF]/30',
    tagline: 'Streaks, Analytics & Nexa AI',
    description: 'Track daily attendance streaks, view dynamic timetable slots, check subject-by-subject safety buffers, and consult Nexa AI Copilot.',
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
    accentGradient: 'from-emerald-500 to-teal-400',
    badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
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
    accentGradient: 'from-purple-500 to-[#8F8BFF]',
    badgeStyle: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
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
    accentGradient: 'from-amber-500 to-orange-400',
    badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
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

export function RoleGatewaySection() {
  const { login } = useAuth();
  const [navigatingRole, setNavigatingRole] = useState<string | null>(null);

  const handleLaunchRole = (role: UserRole) => {
    setNavigatingRole(role);
    login(role);
  };

  return (
    <section id="role-gateway" className="relative scroll-mt-24 border-t border-white/[0.08] py-20 sm:py-28 bg-[#070A14]">
      {/* Background radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 bottom-1/4 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-25 blur-[150px]"
        style={{ background: 'radial-gradient(circle, #8F8BFF 0%, #6FD8FF 50%, transparent 80%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs font-semibold text-[#8F8BFF] mb-4">
            <Sparkles className="h-3.5 w-3.5 text-[#8F8BFF]" />
            <span>UNIFIED STAKEHOLDER SUITE</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#F5F5F8]">
            Role-Based Command Portals
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[#B6B6C2] max-w-2xl mx-auto leading-relaxed">
            One biometric backbone tailored with dedicated interfaces for students, faculty, administrative leadership, and parents. Select a portal to enter the live demo.
          </p>
        </div>

        {/* 4 Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ROLE_PORTALS.map((portal) => {
            const IconComponent = portal.icon;
            const MetricIcon = portal.metric.icon;
            const isLoading = navigatingRole === portal.role;

            return (
              <div
                key={portal.role}
                className="bytune-glass-card group relative flex flex-col justify-between p-6 sm:p-7 transition-all duration-300"
              >
                <div>
                  {/* Top Role Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${portal.accentGradient} text-white shadow-lg shadow-black/40 group-hover:scale-105 transition-transform`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border ${portal.badgeStyle}`}>
                      {portal.badge}
                    </span>
                  </div>

                  {/* Card Title & Tagline */}
                  <h3 className="font-display text-lg font-bold text-white mb-1 group-hover:text-[#8F8BFF] transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-[11px] font-medium text-[#6FD8FF] mb-3">
                    {portal.tagline}
                  </p>
                  <p className="text-xs text-[#B6B6C2] leading-relaxed mb-5">
                    {portal.description}
                  </p>

                  {/* Live Metric Pill */}
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs">
                    <span className="text-[#8A8A97] text-[11px] flex items-center gap-1.5">
                      <MetricIcon className="h-3.5 w-3.5 text-[#8F8BFF]" />
                      {portal.metric.label}:
                    </span>
                    <span className="font-mono font-semibold text-white text-[11px]">
                      {portal.metric.value}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 border-t border-white/[0.06] pt-4 mb-6">
                    {portal.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#F5F5F8]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Launch Button & Demo Hint */}
                <div>
                  <div className="mb-3 rounded-xl bg-black/40 border border-white/[0.06] p-2.5 text-[11px] text-[#B6B6C2]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8A8A97]">Demo Profile:</span>
                      <span className="text-white font-semibold">{portal.demoUser}</span>
                    </div>
                    <div className="text-[10px] text-[#8A8A97] mt-0.5 truncate">{portal.demoDetails}</div>
                  </div>

                  <button
                    onClick={() => handleLaunchRole(portal.role)}
                    disabled={isLoading}
                    className="bytune-chip bytune-chip-active w-full py-2.5 px-4 text-xs font-bold justify-center shadow-lg transition-all"
                  >
                    <span>{isLoading ? 'Opening Session...' : 'Enter Dashboard'}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </button>

                  <div className="mt-2 text-center">
                    <Link
                      href={`/auth/login?role=${portal.role}`}
                      className="text-[11px] text-[#8A8A97] hover:text-[#F5F5F8] transition-colors"
                    >
                      Or sign in with password →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
