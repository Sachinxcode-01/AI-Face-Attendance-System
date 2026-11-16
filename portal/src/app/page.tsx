'use client';

import React from 'react';
import Link from 'next/link';
import { ScanFace, ArrowRight } from 'lucide-react';

// Section components
import { BiometricHeroVisual } from '@/components/landing/BiometricHeroVisual';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { SmartAttendanceSection } from '@/components/landing/SmartAttendanceSection';
import { InteractiveTokenCraft } from '@/components/landing/InteractiveTokenCraft';
import { RoleGatewaySection } from '@/components/landing/RoleGatewaySection';
import { ArchitectureFaqSection } from '@/components/landing/ArchitectureFaqSection';

export default function PortalGatewayPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-[#B6B6C2] flex flex-col justify-between selection:bg-[#8F8BFF] selection:text-black font-sans">
      {/* Top Header Navigation - Only top bar may use backdrop-blur */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#050507]/90 backdrop-blur-md py-3.5 px-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          {/* Logo & Platform Tag - Plain unboxed icon without tinted tiles */}
          <Link href="/" className="flex items-center gap-3">
            <ScanFace className="h-6 w-6 text-[#8F8BFF]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-white tracking-tight text-base sm:text-lg">
                  SmartFace
                </span>
                <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#8A8A97] bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded">
                  Portal Suite
                </span>
              </div>
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

          {/* Right Header Action Buttons - Clean neutral styles */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 text-xs font-mono text-[#8A8A97]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ArcFace: Online
            </span>

            <Link
              href="/auth/login"
              className="portal-chip text-xs py-1.5 px-3 hover:text-white"
            >
              Sign In
            </Link>

            <a
              href="#role-gateway"
              className="portal-btn portal-btn-primary text-xs py-1.5 px-3.5"
            >
              Role Portals
            </a>
          </div>
        </div>
      </header>

      {/* Main Page Content - Clean solid dark background, zero glowing blobs */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Left-aligned, no pill badges, solid single-color headline */}
              <div className="lg:col-span-6 space-y-6">
                <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#F5F5F8] leading-[1.15]">
                  Biometric precision without roll call delays.
                </h1>

                <p className="text-sm sm:text-base text-[#B6B6C2] max-w-xl leading-relaxed">
                  SmartFace replaces manual roll calls and proxy sign-ins with 512-dimension ArcFace neural recognition, 30-second rotating cryptographic salts, and synchronized dashboards for students, teachers, administrators, and parents.
                </p>

                {/* Plain, clean action buttons without colored glow halos */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="#role-gateway"
                    className="portal-btn portal-btn-primary py-2.5 px-5 text-xs font-semibold"
                  >
                    <span>Launch Role Portals</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </a>

                  <a
                    href="#how-it-works"
                    className="portal-btn py-2.5 px-5 text-xs font-medium"
                  >
                    <span>How It Works Process</span>
                  </a>

                  <a
                    href="#anti-proxy-craft"
                    className="portal-btn py-2.5 px-5 text-xs font-medium"
                  >
                    <span>Anti-Proxy Demo</span>
                  </a>
                </div>

                {/* Concrete measured telemetry facts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/[0.06] text-xs font-mono">
                  <div>
                    <span className="text-[#8A8A97] block text-[11px]">Inference</span>
                    <span className="text-white font-semibold">&lt;120ms latency</span>
                  </div>
                  <div>
                    <span className="text-[#8A8A97] block text-[11px]">Liveness</span>
                    <span className="text-emerald-400 font-semibold">99.8% confirmed</span>
                  </div>
                  <div>
                    <span className="text-[#8A8A97] block text-[11px]">QR Salt</span>
                    <span className="text-white font-semibold">30s drift window</span>
                  </div>
                  <div>
                    <span className="text-[#8A8A97] block text-[11px]">Buddy Proxy</span>
                    <span className="text-[#8F8BFF] font-semibold">0% hardware lock</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visualizer showcasing real UI screen and interactive test */}
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
      <footer className="border-t border-white/[0.08] bg-[#050507] py-10 px-6 sm:px-12 text-xs text-[#8A8A97]">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ScanFace className="h-5 w-5 text-[#8F8BFF]" />
            <div>
              <p className="font-semibold text-white">SmartFace Attendance Ecosystem</p>
              <p className="text-[11px] text-[#8A8A97]">ArcFace 512-D ONNX • Zero-Knowledge Vector Privacy • FERPA & GDPR Compliant</p>
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
            © {new Date().getFullYear()} SmartFace Suite.
          </p>
        </div>
      </footer>
    </div>
  );
}
