'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  Flame,
  QrCode,
  ShieldAlert,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';

interface RolePortalConfig {
  title: string;
  role: UserRole;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
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
    tagline: 'Streaks, Analytics & Nexa AI',
    description: 'Track daily attendance streaks, view dynamic timetable slots, check subject safety buffers, and consult Nexa AI Copilot.',
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
    title: 'Faculty Portal',
    role: 'teacher',
    badge: 'FACULTY',
    icon: Users,
    tagline: 'Dynamic Anti-Proxy Sessions',
    description: 'Launch 30-second rotating QR attendance sessions, operate kiosk scanning, and manage student leave requests.',
    features: [
      '30-Second Dynamic Rotating QR',
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
    tagline: 'Biometric Telemetry & Security',
    description: 'Campus-wide attendance feeds, ArcFace neural calibration, unauthorized visitor alarms, and immutable audit logs.',
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
    tagline: 'Instant Notifications & Safety',
    description: 'Receive instant biometric gate arrival pings, track monthly subject compliance, and submit verified medical leave.',
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
      <section id="role-gateway" className="relative scroll-mt-24 border-t border-white/[0.08] py-20 bg-[#050507]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Left-Aligned Section Header - No pill badges */}
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-mono uppercase tracking-wider text-[#8F8BFF] mb-2">
              Campus Ecosystem
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#F5F5F8]">
              Role-Based Command Portals
            </h2>
            <p className="mt-3 text-sm text-[#B6B6C2] leading-relaxed">
              One biometric database serving four dedicated web interfaces. Select a portal below to enter the demonstration dashboard.
            </p>
          </div>

          {/* 4 Role Cards Grid (The only icon-card grid on page) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {ROLE_PORTALS.map((portal) => {
              const IconComponent = portal.icon;
              const MetricIcon = portal.metric.icon;
              const isLoading = navigatingRole === portal.role;

              return (
                <div
                  key={portal.role}
                  className="portal-card p-5 sm:p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Top unboxed icon & plain role badge */}
                    <div className="flex items-center justify-between mb-4">
                      <IconComponent className="h-6 w-6 text-[#8F8BFF]" />
                      <span className="text-[10px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-[#B6B6C2]">
                        {portal.badge}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-semibold text-white mb-1">
                      {portal.title}
                    </h3>
                    <p className="text-[11px] font-medium text-[#8F8BFF] mb-2">
                      {portal.tagline}
                    </p>
                    <p className="text-xs text-[#B6B6C2] leading-relaxed mb-4">
                      {portal.description}
                    </p>

                    {/* Metric Pill */}
                    <div className="mb-4 flex items-center justify-between rounded bg-[#050507] border border-white/[0.06] px-3 py-2 text-xs">
                      <span className="text-[#8A8A97] text-[11px] flex items-center gap-1.5">
                        <MetricIcon className="h-3.5 w-3.5 text-[#8F8BFF]" />
                        {portal.metric.label}:
                      </span>
                      <span className="font-mono font-semibold text-white text-[11px]">
                        {portal.metric.value}
                      </span>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 border-t border-white/[0.06] pt-3.5 mb-5">
                      {portal.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#F5F5F8]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 rounded bg-[#050507] border border-white/[0.06] p-2.5 text-[11px] text-[#B6B6C2]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#8A8A97]">Demo Profile:</span>
                        <span className="text-white font-semibold">{portal.demoUser}</span>
                      </div>
                      <div className="text-[10px] text-[#8A8A97] mt-0.5 truncate">{portal.demoDetails}</div>
                    </div>

                    <button
                      onClick={() => handleLaunchRole(portal.role)}
                      disabled={isLoading}
                      className="portal-btn portal-btn-primary w-full py-2 px-3 text-xs justify-center"
                    >
                      <span>{isLoading ? 'Opening Session...' : 'Enter Dashboard'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <div className="mt-2 text-center">
                      <Link
                        href={`/auth/login?role=${portal.role}`}
                        className="text-[11px] text-[#8A8A97] hover:text-[#F5F5F8] transition-colors"
                      >
                        Sign in with password →
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
