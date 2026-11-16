'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ScanFace,
  Sparkles,
  Zap,
  Lock,
  Activity,
  ArrowRight,
  ShieldCheck,
  Radio,
  ExternalLink
} from 'lucide-react';
import gsap from 'gsap';

// Section components
import { BiometricHeroVisual } from '@/components/landing/BiometricHeroVisual';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { SmartAttendanceSection } from '@/components/landing/SmartAttendanceSection';
import { InteractiveTokenCraft } from '@/components/landing/InteractiveTokenCraft';
import { RoleGatewaySection } from '@/components/landing/RoleGatewaySection';
import { ArchitectureFaqSection } from '@/components/landing/ArchitectureFaqSection';

export default function PortalGatewayPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-hero-item',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'all',
        }
      );
    }, containerRef);

  return () => ctx.revert();
}, []);

return (
  <div
    ref={containerRef}
    className="min-h-screen bg-[#050507] text-[#B6B6C2] flex flex-col justify-between selection:bg-[#8F8BFF] selection:text-black font-sans"
  >
    {/* Background ambient lighting - ByTune inspired multi-layer glow */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div
        className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full opacity-25 blur-[160px]"
        style={{
          background: 'radial-gradient(circle, #8F8BFF 0%, #6FD8FF 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[45%] -left-[15%] w-[650px] h-[650px] rounded-full opacity-15 blur-[170px]"
        style={{ background: 'radial-gradient(circle, #8F8BFF 0%, transparent 65%)' }}
      />
      <div
        className="absolute -bottom-[10%] right-[5%] w-[700px] h-[700px] rounded-full opacity-20 blur-[180px]"
        style={{ background: 'radial-gradient(circle, #6FD8FF 0%, #8F8BFF 50%, transparent 75%)' }}
      />
    </div>

    {/* Top Header Navigation */}
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#050507]/80 backdrop-blur-xl py-3.5 px-4 sm:px-8 lg:px-12 transition-all">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        {/* Logo & Platform Tag */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#8F8BFF] via-[#8F8BFF]/90 to-[#6FD8FF] flex items-center justify-center text-black shadow-lg shadow-[#8F8BFF]/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            <ScanFace className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white tracking-tight text-base sm:text-lg">
                SmartFace
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8F8BFF] bg-[#8F8BFF]/10 border border-[#8F8BFF]/30 px-2 py-0.5 rounded-full">
                Portal Suite
              </span>
            </div>
            <p className="hidden sm:block text-[10.5px] text-[#8A8A97] tracking-tight">
              Touchless AI Biometrics & Multi-Role Telemetry
            </p>
          </div>
        </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-[#B6B6C2]">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#smart-attendance" className="hover:text-white transition-colors">
              About Smart Attendance
            </a>
            <a href="#anti-proxy-craft" className="hover:text-white transition-colors">
              Anti-Proxy Tech
            </a>
            <a href="#role-gateway" className="hover:text-white transition-colors">
              Role Portals
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

            {/* Right Header Status & Action Buttons */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ArcFace Core: Online</span>
              </div>

                  <Link
                    href="/auth/login"
                    className="bytune-chip text-xs py-1.5 px-3.5 hover:text-white"
                  >
                    Sign In
                  </Link>

                  <a
                    href="#role-gateway"
                    className="bytune-chip bytune-chip-active text-xs py-1.5 px-3.5 shadow-md shadow-[#8F8BFF]/10"
                  >
                    Role Gateway
                  </a>
                </div>
              </div>
          </header>

          {/* Main Page Body */}
          <main className="relative z-10 flex-1">
            {/* Hero Section */}
            <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-20 sm:pb-28">
              <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                  {/* Left Column: Headline, Description & Calls to Action */}
                  <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                    {/* Eyebrow Pill */}
                    <div className="gsap-hero-item inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs font-semibold text-[#8F8BFF] shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-[#8F8BFF]" />
                      <span>Next-Gen Touchless Attendance & Telemetry Suite</span>
                    </div>

                  {/* Hero Title */}
                  <h1 className="gsap-hero-item font-display text-4xl sm:text-6xl font-semibold tracking-tight text-[#F5F5F8] leading-[1.1]">
                    Biometric Precision <br className="hidden sm:inline" />
                    <span className="bg-gradient-to-r from-[#8F8BFF] via-[#6FD8FF] to-white bg-clip-text text-transparent">
                      Without the Friction.
                    </span>
                  </h1>

                    {/* Subtitle */}
                    <p className="gsap-hero-item text-sm sm:text-base text-[#B6B6C2] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                      SmartFace replaces manual roll calls and buddy-punching proxies with 512-dimensional ArcFace neural recognition, 30-second cryptographic rotating tokens, and real-time synchronized dashboards for students, teachers, admins, and parents.
                    </p>

                    {/* ByTune style Action Chips */}
                    <div className="gsap-hero-item flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                      <a
                        href="#role-gateway"
                        className="bytune-chip bytune-chip-active py-2.5 px-5 text-xs font-semibold shadow-xl shadow-[#8F8BFF]/20"
                      >
                        <span>Launch Role Portals</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </a>

                      <a
                        href="#how-it-works"
                        className="bytune-chip py-2.5 px-5 text-xs font-semibold"
                      >
                        <span>How It Works Process</span>
                      </a>

                    <a
                      href="#anti-proxy-craft"
                      className="bytune-chip py-2.5 px-5 text-xs font-semibold"
                    >
                      <span>Anti-Proxy Demo</span>
                    </a>
                  </div>

                      {/* Measured Telemetry Metrics */ }
                      <div className="gsap-hero-item flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 text-[11px] text-[#8A8A97] font-mono border-t border-white/[0.06]">
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-[#8F8BFF]" />
                          &lt;120ms Latency
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          99.8% Passive Liveness
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-[#6FD8FF]" />
                          30s Dynamic Salt
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-purple-400" />
                          Zero Buddy Proxies
                        </span>
                      </div>
              </div>

                      {/* Right Column: Hero Visualizer Showcase */}
                      <div className="lg:col-span-6 flex justify-center">
                        <BiometricHeroVisual />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 2: How It Works Process */}
                <HowItWorksSection />

                {/* Section 3: About Smart Attendance & Mathematical Foundation */}
                <SmartAttendanceSection />

              {/* Section 4: Interactive Anti-Proxy Craft Simulator */}
              <InteractiveTokenCraft />

                {/* Section 5: Unified Stakeholder Role Gateway */}
                <RoleGatewaySection />

                {/* Section 6: Architecture, Privacy & FAQ */}
                <ArchitectureFaqSection />
              </main>

      {/* Footer (ByTune Inspired) */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#050507] py-12 px-6 sm:px-12 text-xs text-[#8A8A97]">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#16161D] border border-white/10 flex items-center justify-center text-[#8F8BFF]">
              <ScanFace className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-white">SmartFace Attendance Ecosystem</p>
              <p className="text-[11px] text-[#8A8A97]">Touchless Biometrics • ArcFace 512-D • Zero-Knowledge Vector Privacy</p>
            </div>
          </div>

        <div className="flex flex-wrap items-center gap-6 text-[11px]">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#smart-attendance" className="hover:text-white transition-colors">Smart Attendance</a>
          <a href="#role-gateway" className="hover:text-white transition-colors">Portals</a>
          <a href="#faq" className="hover:text-white transition-colors">Privacy & FAQ</a>
          <Link href="/auth/login" className="hover:text-white transition-colors">Portal Login</Link>
        </div>

      <p className="text-[11px] text-[#60606C]">
        © {new Date().getFullYear()} SmartFace Suite. All rights reserved.
      </p>
  </div>
      </footer >
    </div >
  );
}
