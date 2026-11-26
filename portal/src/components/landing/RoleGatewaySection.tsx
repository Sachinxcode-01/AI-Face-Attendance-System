"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  ShieldCheck,
  HeartHandshake,
  Crown,
  ArrowRight,
  CheckCircle2,
  Flame,
  QrCode,
  ShieldAlert,
  Bell,
  Building2,
  LogIn,
  UserPlus,
  KeyRound,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { SpotlightCard } from "@/components/ui/spotlight-card";

interface RolePortalConfig {
  title: string;
  role: UserRole;
  badge: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  description: string;
  features: string[];
  demoUser: string;
  demoDetails: string;
  spotlight: string;
  badgeStyle: string;
  metric: { label: string; value: string; icon: React.ComponentType<{ className?: string }> };
}

const ROLE_PORTALS: RolePortalConfig[] = [
  {
    title: "Student Portal",
    role: "student",
    badge: "STUDENT",
    path: "/student",
    icon: GraduationCap,
    tagline: "Streaks, Analytics & Nexa AI",
    description:
      "Track daily attendance streaks, view dynamic timetable slots, check subject safety buffers, and consult Nexa AI Copilot.",
    features: [
      "Golden Blaze 14-Day Streak",
      "Mon–Sat Class Schedule & Rooms",
      "Nexa AI Safe-Bunk Calculator",
      "Fast Biometric & QR Check-in",
    ],
    demoUser: "Bob Dylan",
    demoDetails: "bob@smartface.pro • 88.6% Att.",
    spotlight: "rgba(143, 139, 255, 0.24)",
    badgeStyle: "border-accent/30 bg-accent/10 text-accent",
    metric: { label: "Active Streak", value: "14 Days (Golden)", icon: Flame },
  },
  {
    title: "Faculty Portal",
    role: "teacher",
    badge: "FACULTY",
    path: "/teacher",
    icon: Users,
    tagline: "Dynamic Anti-Proxy Sessions",
    description:
    "Launch 20-second rotating QR attendance sessions, operate kiosk scanning, override rosters, and manage leave requests.",
    features: [
      "20-Second Dynamic Rotating QR",
      "Live Biometric Check-in Roster",
      "One-Click Leave Approval Inbox",
      "Lecture Attendance Analytics",
    ],
    demoUser: "Prof. Marcus Vance",
    demoDetails: "teacher@smartface.pro • Session Host",
    spotlight: "rgba(30, 215, 96, 0.22)",
    badgeStyle: "border-spotify/30 bg-spotify/10 text-[#9fe0b6]",
    metric: { label: "Active Session", value: "CS-401 (Live QR)", icon: QrCode },
  },
  {
    title: "Admin Sentinel Console",
    role: "admin",
    badge: "ADMIN SENTINEL",
    path: "/admin",
    icon: ShieldCheck,
    tagline: "Biometric Telemetry & Security",
    description:
      "Campus-wide attendance feeds, ArcFace neural calibration, unauthorized visitor alarms, and immutable audit logs.",
    features: [
      "Real-Time Intruder Face Sentinel",
      "ArcFace 512-dim Verification Tuner",
      "Campus Attendance Live Stream",
      "Automated Disciplinary Reports",
    ],
    demoUser: "System Administrator",
    demoDetails: "admin@smartface.pro • Security Ops",
    spotlight: "rgba(243, 198, 79, 0.22)",
    badgeStyle: "border-amber/30 bg-amber/10 text-amber",
    metric: { label: "Sentinel Status", value: "Active (0 Intruders)", icon: ShieldAlert },
  },
  {
    title: "Parent Observer Portal",
    role: "parent",
    badge: "PARENT",
    path: "/parent",
    icon: HeartHandshake,
    tagline: "Instant Notifications & Safety",
    description:
      "Receive instant biometric gate arrival pings, track monthly subject compliance, and submit verified medical leave.",
    features: [
      "Instant Campus Arrival / Gate SMS",
      "Subject Absence Risk Alert Radar",
      "Digital Leave Request Upload",
      "Direct Faculty Communication",
    ],
    demoUser: "Robert Cooper",
    demoDetails: "parent@smartface.pro • Guardian",
    spotlight: "rgba(111, 216, 255, 0.22)",
    badgeStyle: "border-accent2/30 bg-accent2/10 text-accent2",
    metric: { label: "Latest Ping", value: "Gate A @ 08:42 AM", icon: Bell },
  },
  {
    title: "Super Admin Governance",
    role: "super_admin",
    badge: "SUPER ADMIN",
    path: "/admin/super-admin",
    icon: Crown,
    tagline: "Institution & Policy Control",
    description:
      "Multi-campus governance, global role provisioning, cryptographic key rotation policies, and compliance oversight.",
    features: [
      "Multi-Campus Tenant Governance",
      "Role & Permission Matrix Control",
      "Global Audit & Compliance Export",
      "System-Wide Edge Fleet Health",
    ],
    demoUser: "Dr. Evelyn Cross",
    demoDetails: "superadmin@smartface.pro • Root Ops",
    spotlight: "rgba(143, 139, 255, 0.26)",
    badgeStyle: "border-accent/40 bg-accent/15 text-hi",
    metric: { label: "Governance", value: "RBAC & Audit", icon: Building2 },
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
    <section
      id="role-gateway"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[var(--wide)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Unified Portal Access"
          title="One campus. Five role-based portals."
          description="Every stakeholder signs into the same unified portal on its own dedicated route. Launch a live role session instantly or sign in with your institutional credentials."
        />

        {/* 5 Role Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {ROLE_PORTALS.map((portal, index) => {
            const IconComponent = portal.icon;
            const MetricIcon = portal.metric.icon;
            const isLoading = navigatingRole === portal.role;

            return (
              <Reveal key={portal.role} delay={index * 0.06} direction="up" distance={24} className="h-full">
                <SpotlightCard
                  spotlightColor={portal.spotlight}
                  enableTilt
                  className="p-5 sm:p-6 flex h-full flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <motion.span
                        whileHover={{ scale: 1.12, rotate: 5 }}
                        className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent"
                      >
                        <IconComponent className="h-5 w-5" />
                      </motion.span>
                      <span
                        className={`chip-bytune h-6 text-[10px] font-mono font-semibold uppercase tracking-wider ${portal.badgeStyle}`}
                      >
                        {portal.badge}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-medium tracking-tight text-hi mb-1">
                      {portal.title}
                    </h3>
                    <p className="text-[11px] font-mono font-medium text-accent mb-2.5">
                      {portal.tagline}
                    </p>
                    <p className="text-xs text-mid leading-relaxed mb-4">
                      {portal.description}
                    </p>

                    {/* Live Metric Pill */}
                    <div className="mb-4 flex items-center justify-between rounded-xl bg-[#050507]/80 border border-white/[0.07] px-3 py-2 text-xs">
                      <span className="text-faint text-[11px] flex items-center gap-1.5">
                        <MetricIcon className="h-3.5 w-3.5 text-accent" />
                        {portal.metric.label}:
                      </span>
                      <span className="font-mono font-semibold text-hi text-[11px]">
                        {portal.metric.value}
                      </span>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 border-t border-white/[0.06] pt-3.5 mb-5">
                      {portal.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-hi/90">
                          <CheckCircle2 className="h-3.5 w-3.5 text-spotify shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 rounded-xl bg-[#050507]/80 border border-white/[0.07] p-2.5 text-[11px] text-mid">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-faint">Demo Profile:</span>
                        <span className="text-hi font-semibold truncate">{portal.demoUser}</span>
                      </div>
                      <div className="text-[10px] font-mono text-faint mt-0.5 truncate">
                        {portal.demoDetails}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLaunchRole(portal.role)}
                      disabled={isLoading}
                      className="btn-pill-accent w-full h-10 px-3 text-xs font-semibold justify-center gap-1.5"
                    >
                      <span>{isLoading ? "Opening Session..." : "Enter Dashboard"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <div className="mt-2.5 flex items-center justify-between px-1 text-[11px]">
                      <Link
                        href={`/auth/login?role=${portal.role}`}
                        className="text-mid hover:text-hi transition-colors"
                      >
                        Sign in →
                      </Link>
                      <Link
                        href={`/auth/register?role=${portal.role}`}
                        className="text-accent hover:text-accent2 transition-colors"
                      >
                        Sign up →
                      </Link>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>

        {/* Dedicated Portal Authentication & Account Flows */}
        <Reveal delay={0.15} direction="up">
          <div className="mt-10 card-bytune p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-accent mb-1.5">
                Authentication & Account Security
              </p>
              <h3 className="font-display text-xl font-medium text-hi">
                Role-Scoped Sign In, Registration & Verification
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-mid max-w-2xl">
                Access your institutional account with email/password, enroll a new campus profile, verify your identity token, or recover access.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href="/auth/login"
                className="btn-pill-accent h-10 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/auth/register"
                className="btn-pill-glass h-10 px-4 text-xs font-medium inline-flex items-center gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5 text-accent" />
                <span>Create Account</span>
              </Link>
              <Link
                href="/auth/verify"
                className="btn-pill-outline h-10 px-4 text-xs font-medium inline-flex items-center gap-1.5"
              >
                <BadgeCheck className="h-3.5 w-3.5 text-spotify" />
                <span>Verify Account</span>
              </Link>
              <Link
                href="/auth/forgot-password"
                className="btn-pill-outline h-10 px-4 text-xs font-medium inline-flex items-center gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5 text-mid" />
                <span>Reset Password</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
