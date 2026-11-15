'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
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
  Lock
} from 'lucide-react';
import gsap from 'gsap';

export default function PortalGatewayPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.gsap-hero-item', {
        y: 25,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });

      gsap.from('.gsap-portal-card', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.3,
      });
    });

    return () => ctx.revert();
  }, []);

  const portals = [
    {
      title: 'Student Portal',
      role: 'student',
      href: '/student',
      icon: GraduationCap,
      color: 'from-blue-600/20 to-indigo-600/20',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      description: 'Check attendance streaks, explore weekly timetables, view percentage gauges, and chat with Nexa AI.',
      features: ['Attendance Streaks (Flame Tiers)', 'Monday-Saturday Timetable', 'Nexa AI Attendance Copilot', 'Leave Requests & Approvals'],
      demoUser: 'Alice Smith (CS-2024-042)',
    },
    {
      title: 'Teacher & Faculty Portal',
      role: 'teacher',
      href: '/teacher',
      icon: Users,
      color: 'from-emerald-600/20 to-teal-600/20',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Initiate attendance sessions, project dynamic 15-second rotating QR codes, and review roster check-ins.',
      features: ['Dynamic Anti-Proxy QR Projector', 'Biometric Kiosk Scanner Mode', 'Live Student Attendance Roster', 'Leave Approval Inbox'],
      demoUser: 'Prof. Marcus Vance (AI Dept)',
    },
    {
      title: 'Admin Sentinel Console',
      role: 'admin',
      href: '/admin',
      icon: ShieldCheck,
      color: 'from-purple-600/20 to-pink-600/20',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      description: 'Campus-wide biometric telemetry, real-time intruder surveillance alerts, and ArcFace ONNX calibration.',
      features: ['Intruder Face Detection Sentinel', 'ArcFace 512-dim Calibration', 'Campus Attendance Telemetry', 'Comprehensive Audit Logs'],
      demoUser: 'Dr. Evelyn Cross (Security)',
    },
    {
      title: 'Parent Portal',
      role: 'parent',
      href: '/parent',
      icon: HeartHandshake,
      color: 'from-amber-600/20 to-orange-600/20',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      description: 'Real-time arrival alerts, monthly subject attendance reports, and direct communication with institution faculty.',
      features: ['Instant Campus Arrival Alerts', 'Subject Absence Risk Radar', 'Medical Leave Submissions', 'Official Attendance Reports'],
      demoUser: 'Sarah & David Smith',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A14] text-[#C8CCDF] flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background radial gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Simple Header */}
      <header className="relative z-10 w-full border-b border-white/5 py-4 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <ScanFace className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display font-bold text-white tracking-tight">SmartFace</span>
            <span className="text-[11px] ml-1.5 font-semibold uppercase text-indigo-400">Portal Suite</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono">Cluster: Live (US-East)</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col justify-center">
        
        {/* Header Block */}
        <div ref={heroRef} className="text-center max-w-3xl mx-auto mb-12">
          <div className="gsap-hero-item inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Unified Biometric Portal Gateway</span>
          </div>

          <h1 className="gsap-hero-item font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Select Your Role to Access <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              SmartFace Attendance Hub
            </span>
          </h1>

          <p className="gsap-hero-item mt-4 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            Role-based attendance management, real-time ArcFace biometrics, and active campus security telemetry for all stakeholders.
          </p>
        </div>

        {/* 4 Role Cards Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {portals.map((portal) => {
            const IconComponent = portal.icon;
            return (
              <div
                key={portal.role}
                className="gsap-portal-card group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0E1428]/90 p-6 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
              >
                <div>
                  {/* Top Role Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-white group-hover:scale-105 transition-transform">
                      <IconComponent className="h-6 w-6 text-indigo-400" />
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${portal.badgeColor}`}>
                      {portal.role.toUpperCase()}
                    </span>
                  </div>

                  {/* Card Title & Description */}
                  <h3 className="font-display text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-6">
                    {portal.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2.5 border-t border-white/5 pt-4 mb-6">
                    {portal.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Launch Button & Demo Hint */}
                <div>
                  <div className="mb-3 text-[11px] text-gray-500 flex items-center justify-between">
                    <span>Demo Profile:</span>
                    <span className="text-gray-300 font-medium truncate max-w-[150px]">{portal.demoUser}</span>
                  </div>

                  <Link
                    href={portal.href}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-2.5 px-4 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98]"
                  >
                    <span>Launch Portal</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-6 text-center text-xs text-gray-500">
        <p>
          SmartFace Attendance Suite • Multi-Role Secure Ecosystem • Protected by ArcFace Biometrics & Anti-Proxy Dynamic Tokens
        </p>
      </footer>
    </div>
  );
}
