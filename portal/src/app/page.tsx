'use client';

import React from 'react';
import Link from 'next/link';
import { ScanFace, ArrowRight, ArrowUpRight } from 'lucide-react';

// Section components
import { BiometricHeroVisual } from '@/components/landing/BiometricHeroVisual';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { SmartAttendanceSection } from '@/components/landing/SmartAttendanceSection';
import { InteractiveTokenCraft } from '@/components/landing/InteractiveTokenCraft';
import { RoleGatewaySection } from '@/components/landing/RoleGatewaySection';
import { ArchitectureFaqSection } from '@/components/landing/ArchitectureFaqSection';

export default function PortalGatewayPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-[#B6B6C2] flex flex-col justify-between selection:bg-[#8F8BFF]/30 selection:text-white font-sans">
      {/* Top Header Navigation — ByTune Glass Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#050507]/85 backdrop-blur-xl py-3 px-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          {/* Logo & Platform Tag */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[#050507] shadow-lg shadow-accent/25 transition-transform duration-200 group-hover:scale-105">
              <ScanFace className="h-4 w-4" strokeWidth={2.4} />
            </div>
            <div>
              <span className="font-display text-base font-semibold tracking-tight text-white">SmartFace</span>
              <span className="ml-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">Portal Suite</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-[#B6B6C2]">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#smart-attendance" className="hover:text-white transition-colors">
              Smart Attendance
            </a>
            <a href="#anti-proxy-craft" className="hover:text-white transition-colors">
              Anti-Proxy Tech
            </a>
            <a href="#role-gateway" className="hover:text-white transition-colors">
              Role Portals
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              Architecture & FAQ
            </a>
          </nav>

          {/* Right Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:inline-flex items-center gap-2 chip-bytune h-7 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10.5px]">ArcFace: Online</span>
            </div>

            <Link
              href="/auth/login"
              className="btn-pill-glass h-8 px-4 text-xs font-medium"
            >
              Sign In
            </Link>

            <a
              href="#role-gateway"
              className="btn-pill-accent h-8 px-4 text-xs font-semibold"
            >
              Role Portals
            </a>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 chip-bytune">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-mid">
                    Unified Campus Biometric Engine
                  </span>
                </div>

                <h1 className="text-balance font-display text-3xl sm:text-5xl lg:text-[52px] font-medium leading-[1.08] tracking-[-0.028em] text-hi">
                  Biometric precision without roll call delays.
                </h1>

                <p className="text-pretty text-sm sm:text-base leading-[26px] text-mid max-w-xl">
                  SmartFace replaces manual paper sign-ins and proxy fraud with 512-dimension ArcFace neural embeddings, 30-second rotating cryptographic salts, and synchronized portals for students, faculty, administrators, and parents.
                </p>

                {/* Pill Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#role-gateway"
                    className="btn-pill-accent h-11 px-6 text-xs font-semibold flex items-center gap-2"
                  >
                    <span>Launch Role Portals</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <a
                    href="#how-it-works"
                    className="btn-pill-glass h-11 px-5 text-xs font-medium"
                  >
                    <span>How It Works</span>
                  </a>

                  <a
                    href="#anti-proxy-craft"
                    className="btn-pill-glass h-11 px-5 text-xs font-medium"
                  >
                    <span>Anti-Proxy Demo</span>
                  </a>
                </div>

                {/* Concrete measured telemetry facts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/[0.08] text-xs font-mono">
                  <div>
                    <span className="text-faint block text-[10.5px] uppercase tracking-wider">Inference</span>
                    <span className="text-hi font-semibold text-sm">&lt;120ms latency</span>
                  </div>
                  <div>
                    <span className="text-faint block text-[10.5px] uppercase tracking-wider">Liveness</span>
                    <span className="text-emerald-400 font-semibold text-sm">99.8% confirmed</span>
                  </div>
                  <div>
                    <span className="text-faint block text-[10.5px] uppercase tracking-wider">QR Salt</span>
                    <span className="text-hi font-semibold text-sm">30s drift window</span>
                  </div>
                  <div>
                    <span className="text-faint block text-[10.5px] uppercase tracking-wider">Buddy Proxy</span>
                    <span className="text-accent font-semibold text-sm">0% hardware lock</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visualizer */}
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

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#050507] py-12 px-6 sm:px-12 text-xs text-faint">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[#050507]">
              <ScanFace className="h-3.5 w-3.5" strokeWidth={2.4} />
            </div>
            <div>
              <p className="font-semibold text-white">SmartFace Attendance Ecosystem</p>
              <p className="text-[11px] font-mono text-faint">ArcFace 512-D ONNX · Zero-Knowledge Privacy · FERPA & GDPR</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px]">
            <a href="#how-it-works" className="text-mid hover:text-white transition-colors">How It Works</a>
            <a href="#smart-attendance" className="text-mid hover:text-white transition-colors">Smart Attendance</a>
            <a href="#role-gateway" className="text-mid hover:text-white transition-colors">Portals</a>
            <a href="#faq" className="text-mid hover:text-white transition-colors">Privacy & FAQ</a>
            <Link href="/auth/login" className="text-accent hover:text-accent2 transition-colors">Portal Login</Link>
          </div>

          <p className="font-mono text-[11px] text-[#60606C]">
            © {new Date().getFullYear()} SmartFace Suite.
          </p>
        </div>
      </footer>
    </div>
  );
}
