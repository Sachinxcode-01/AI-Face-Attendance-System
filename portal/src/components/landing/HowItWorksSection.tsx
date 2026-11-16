'use client';

import React, { useState } from 'react';
import {
  QrCode,
  ScanFace,
  ShieldCheck,
  BellRing,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  Clock,
  Smartphone,
  Eye,
  Radio,
  Sparkles,
  Zap
} from 'lucide-react';

interface StepDetail {
  step: string;
  number: string;
  title: string;
  subtitle: string;
  roleBadge: string;
  description: string;
  techSpecs: { label: string; value: string }[];
  interactivePreview: {
    heading: string;
    subheading: string;
    badge: string;
    snippet: string;
    metricLabel: string;
    metricValue: string;
  };
}

const STEPS: StepDetail[] = [
  {
    step: 'Phase 01',
    number: '01',
    title: 'Class Session Initiation & Salt Generation',
    subtitle: 'Cryptographic session anchor & geofencing',
    roleBadge: 'TEACHER PORTAL',
    description:
      'Faculty initiates attendance for a scheduled timetable slot with a single click. The backend generates a signed HMAC-SHA256 session token embedded with a 30-second rotating cryptographic salt, locked to the classroom GPS geofence radius.',
    techSpecs: [
      { label: 'Token Window', value: '30-second drift' },
      { label: 'Cipher', value: 'HMAC-SHA256' },
      { label: 'Geofence', value: 'Classroom Radius < 45m' },
      { label: 'Network', value: 'BSSID Cross-Check' },
    ],
    interactivePreview: {
      heading: 'Rotating Session Token',
      subheading: 'CS-401 Advanced Machine Learning · Room 302',
      badge: 'ACTIVE 30s DRIFT',
      snippet: 'TOKEN_SALT: "e3b0c44298fc1c149afbf4c8996fb924"\nHMAC_SIGN: "7f83b1657ff1fc53b92dc18148a1d65b"\nEXPIRY: 00:27s remaining',
      metricLabel: 'Session Security',
      metricValue: 'Anti-Replay Active',
    },
  },
  {
    step: 'Phase 02',
    number: '02',
    title: 'Touchless Neural Vector Extraction',
    subtitle: 'ArcFace 512-D inference & passive liveness check',
    roleBadge: 'EDGE SCANNER / MOBILE',
    description:
      'The student approaches the kiosk camera or opens the student check-in scanner. The ArcFace neural network extracts 106 facial landmarks and computes a 512-dimensional embedding in <120ms. Simultaneously, passive liveness analyzes skin micro-textures and specular depth to eliminate photo and screen attacks.',
    techSpecs: [
      { label: 'Inference Speed', value: '<120ms Latency' },
      { label: 'Embedding Vector', value: '512 Dimensions' },
      { label: 'Liveness Method', value: 'Passive Texture & Depth' },
      { label: 'Threshold', value: '0.82 Cosine Cutoff' },
    ],
    interactivePreview: {
      heading: 'ArcFace 512-D Neural Landmark',
      subheading: 'High-throughput 60 FPS face alignment',
      badge: 'LIVENESS: 99.8% REAL',
      snippet: 'LANDMARKS: 106 fiducials mapped\nCOSINE_SIM: 0.964 (Threshold: 0.820)\nANTI_SPOOF: PASSED (No screen glow detected)',
      metricLabel: 'Cosine Similarity',
      metricValue: '0.964 (Match Confirmed)',
    },
  },
  {
    step: 'Phase 03',
    number: '03',
    title: 'Anti-Proxy Cryptographic Handshake',
    subtitle: 'Hardware enclave binding & zero buddy punching',
    roleBadge: 'ZERO-TRUST SENTINEL',
    description:
      'To prevent buddy punching (e.g., sending screenshots to absent friends), the system verifies unique device hardware tokens, cross-references active Wi-Fi BSSID signals, and enforces single-seat attendance. Once an ID is logged for a lecture, that hardware token is locked from logging any other student.',
    techSpecs: [
      { label: 'Device Binding', value: '1 Hardware ID per Student' },
      { label: 'Screenshot Defense', value: '30s Salt Dynamic QR' },
      { label: 'Double-Punch Filter', value: '0-Tolerance Lock' },
      { label: 'Audit Trail', value: 'Immutable Timestamp' },
    ],
    interactivePreview: {
      heading: 'Hardware Enclave Handshake',
      subheading: 'Enclave cryptographic attestation',
      badge: 'DEVICE BOUND',
      snippet: 'HARDWARE_UUID: "dev-89a1-43ef-992a"\nDEVICE_INTEGRITY: Secure Boot Verified\nPROXY_ATTEMPT_COUNT: 0 (No Duplicate MAC)',
      metricLabel: 'Proxy Rejection',
      metricValue: '100% Cryptographic Lock',
    },
  },
  {
    step: 'Phase 04',
    number: '04',
    title: 'Synchronous Telemetry & Dispatches',
    subtitle: 'Streaks, parent alerts & automated audit records',
    roleBadge: 'UNIFIED DISPATCH',
    description:
      'Immediately upon verification, the attendance record is committed to the central database. Student attendance streaks advance, safety buffers recalculate via Nexa AI, real-time muster rolls populate the teacher screen, and parents receive an instant gate arrival push notification.',
    techSpecs: [
      { label: 'Database Write', value: '<24ms Sync Time' },
      { label: 'Parent Push', value: 'Instant SMS & Push' },
      { label: 'Streak Engine', value: 'Golden Blaze Streak (+1)' },
      { label: 'Faculty Roster', value: 'Real-time WebSocket' },
    ],
    interactivePreview: {
      heading: 'Real-Time Notification Dispatch',
      subheading: 'Stakeholders synchronized in real time',
      badge: 'DISPATCHED',
      snippet: 'PARENT_NOTIFICATION: "Alice Smith arrived at Gate A (09:02 AM)"\nSTREAK_STATUS: 14 Days Active (Golden Blaze)\nFACULTY_ROSTER: Updated (42/45 Present)',
      metricLabel: 'Stakeholder Sync',
      metricValue: 'Sub-Second Global Ping',
    },
  },
];

export function HowItWorksSection() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = STEPS[activeStepIndex];

  return (
    <section id="how-it-works" className="relative scroll-mt-24 border-t border-white/[0.08] py-20 sm:py-28 bg-[#050507]">
      {/* Background soft ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[150px]"
        style={{ background: 'radial-gradient(circle, #8F8BFF 0%, #6FD8FF 40%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading with ByTune typography */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs font-semibold text-[#8F8BFF] mb-4">
            <Zap className="h-3.5 w-3.5 text-[#8F8BFF]" />
            <span>4-STAGE VERIFICATION PIPELINE</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#F5F5F8]">
            How SmartFace Works
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[#B6B6C2] max-w-2xl mx-auto leading-relaxed">
            From the faculty session start to touchless face verification and instant parent notification — executed seamlessly with military-grade anti-proxy assurance.
          </p>

          {/* Interactive Step Selector Pill Buttons (ByTune Craft Style) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {STEPS.map((step, idx) => (
              <button
                key={step.number}
                onClick={() => setActiveStepIndex(idx)}
                className={`bytune-chip ${
                  activeStepIndex === idx ? 'bytune-chip-active' : ''
                } text-xs py-2 px-4 transition-all`}
              >
                <span className="font-mono opacity-60 mr-1.5">{step.number}</span>
                <span>{step.title.split('&')[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4 Cards Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {STEPS.map((step, index) => {
            const isSelected = activeStepIndex === index;
            return (
              <div
                key={step.number}
                onClick={() => setActiveStepIndex(index)}
                className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 relative ${
                  isSelected
                    ? 'bytune-glass-card border-[#8F8BFF]/50 shadow-lg shadow-[#8F8BFF]/10 scale-[1.02]'
                    : 'bg-[#101016]/80 border border-white/[0.08] hover:border-white/20 hover:bg-[#16161D]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`font-mono text-2xl font-bold ${isSelected ? 'text-[#8F8BFF]' : 'text-white/20'}`}>
                    {step.number}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isSelected ? 'bg-[#8F8BFF]/10 text-[#8F8BFF] border-[#8F8BFF]/30' : 'bg-white/[0.04] text-[#8A8A97] border-white/10'
                  }`}>
                    {step.roleBadge}
                  </span>
                </div>

                <h3 className="font-display text-base font-semibold text-[#F5F5F8] mb-1">
                  {step.title}
                </h3>
                <p className="text-xs text-[#8A8A97] mb-3 line-clamp-2">
                  {step.subtitle}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-[#6FD8FF] font-medium mt-auto pt-3 border-t border-white/[0.06]">
                  <span>Explore Phase Details</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Deep-Dive Interactive Phase Breakdown Card */}
        <div className="bytune-glass-card p-6 sm:p-10 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Comprehensive Explanation */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#8F8BFF]/10 border border-[#8F8BFF]/25 px-2.5 py-0.5 text-xs font-mono font-medium text-[#8F8BFF]">
                  {activeStep.step}
                </span>
                <span className="text-xs font-mono text-[#8A8A97]">• {activeStep.roleBadge}</span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F5F8] tracking-tight">
                {activeStep.title}
              </h3>

              <p className="text-sm text-[#B6B6C2] leading-relaxed">
                {activeStep.description}
              </p>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {activeStep.techSpecs.map((spec, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <p className="text-[11px] text-[#8A8A97] font-medium">{spec.label}</p>
                    <p className="text-xs sm:text-sm font-semibold font-mono text-white mt-0.5">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Dynamic Interactive Terminal / Simulation Box */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/[0.1] bg-[#0A0A0E] p-5 shadow-2xl relative">
                {/* Simulated Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[11px] font-mono text-[#8A8A97] ml-2">telemetry.smartface.internal</span>
                  </div>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
                    {activeStep.interactivePreview.badge}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-[#F5F5F8]">{activeStep.interactivePreview.heading}</h4>
                    <p className="text-xs text-[#8A8A97]">{activeStep.interactivePreview.subheading}</p>
                  </div>

                  {/* Code / Telemetry Log Box */}
                  <div className="rounded-xl bg-black/60 p-3.5 font-mono text-[11px] text-[#6FD8FF] leading-relaxed border border-white/[0.04] overflow-x-auto whitespace-pre">
                    {activeStep.interactivePreview.snippet}
                  </div>

                  {/* Status Indicator Bar */}
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3 text-xs border border-white/[0.06]">
                    <span className="text-[#8A8A97]">{activeStep.interactivePreview.metricLabel}:</span>
                    <span className="font-mono font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      {activeStep.interactivePreview.metricValue}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
