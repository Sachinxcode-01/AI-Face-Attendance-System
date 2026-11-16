'use client';

import React, { useState } from 'react';
import {
  ScanFace,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Cpu,
  Lock,
  Layers,
  Activity,
  Sliders,
  Check,
  Eye
} from 'lucide-react';

export function SmartAttendanceSection() {
  const [threshold, setThreshold] = useState(0.82);

  // Dynamic calculations based on slider
  const precisionPct = (99.2 + (threshold - 0.7) * 2.5).toFixed(1);
  const farRate = Math.max(0.001, (0.01 - (threshold - 0.7) * 0.03)).toFixed(4);
  const latencyMs = Math.round(110 + (threshold - 0.7) * 15);

  return (
    <section id="smart-attendance" className="relative scroll-mt-24 border-t border-white/[0.08] py-20 sm:py-28 bg-[#070A14]">
      {/* Background ambient lighting */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-10 top-1/2 h-[420px] w-[500px] -translate-y-1/2 rounded-full opacity-20 blur-[130px]"
        style={{ background: 'radial-gradient(circle, #8F8BFF 0%, #6FD8FF 50%, transparent 80%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs font-semibold text-[#6FD8FF] mb-4">
            <Sparkles className="h-3.5 w-3.5 text-[#6FD8FF]" />
            <span>TOUCHLESS CAMPUS INTELLIGENCE</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-[#F5F5F8]">
            Why Smart Attendance Matters
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[#B6B6C2] max-w-2xl mx-auto leading-relaxed">
            Legacy paper sign-ins and manual roll calls squander instructional time and encourage proxy attendance. SmartFace transforms attendance into an automated, touchless, and fraud-proof experience.
          </p>
        </div>

        {/* Legacy vs SmartFace Comparison Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Legacy Card */}
          <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6 sm:p-8 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">Legacy Attendance Methods</h3>
                <p className="text-xs text-red-400/80 font-mono">Paper Roster • Manual Calling • RFID Cards</p>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-[#B6B6C2]">
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span><strong>15 Minutes Wasted:</strong> Instructors lose 25% of class time calling rolls or collecting sign-in sheets.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span><strong>Rampant Buddy Punching:</strong> 18–24% of attendance records in large halls are proxies signed by friends or swiped with borrowed RFID cards.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span><strong>No Parent Visibility:</strong> Guardians learn of chronic absenteeism weeks later when official warning letters are mailed.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span><strong>Manual Data Entry Fatigue:</strong> Office staff spend hours copying messy paper tallies into academic ERP databases.</span>
              </li>
            </ul>
          </div>

          {/* SmartFace Card */}
          <div className="bytune-glass-card p-6 sm:p-8 relative border-emerald-500/30 shadow-emerald-500/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">SmartFace AI Biometrics</h3>
                <p className="text-xs text-emerald-400/90 font-mono">ArcFace 512-D • Salted Dynamic QR • Nexa AI</p>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-[#F5F5F8]">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Instant Sub-Second Walk-Through:</strong> Students are verified in &lt;120ms with walk-through gates accommodating 45+ students per minute.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Zero-Trust Anti-Proxy Enclave:</strong> Dynamic 30s rotating tokens, single-device binding, and passive liveness make buddy proxies impossible.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Immediate Stakeholder Notifications:</strong> Parents receive an automated arrival SMS/push ping the exact second their child steps through the gate.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Predictive Nexa AI Analytics:</strong> Automated safe-bunk forecasting, attendance streak gamification, and early drop-out risk interventions.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Interactive Calibration & Threshold Tuner (ByTune Craft Style Slider) */}
        <div className="bytune-glass-card p-6 sm:p-8 mb-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#8F8BFF]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#8F8BFF]">Neural Calibration Tuner</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-white">
                ArcFace Cosine Similarity Sensitivity
              </h3>
              <p className="text-xs sm:text-sm text-[#B6B6C2] leading-relaxed">
                Adjust the mathematical decision boundary for 512-dimensional vector matching. SmartFace is calibrated at <strong className="text-white">0.82</strong> to maintain a 0.001% False Acceptance Rate while processing legitimate faces instantly under challenging classroom lighting.
              </p>
            </div>

            {/* Interactive Slider Box */}
            <div className="w-full lg:w-96 rounded-2xl bg-[#0A0A0E] border border-white/[0.08] p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8A8A97] font-medium">Match Threshold:</span>
                <span className="font-mono font-bold text-base text-[#6FD8FF]">{threshold.toFixed(2)}</span>
              </div>

              {/* ByTune Styled Slider */}
              <div className="relative flex items-center">
                <input
                  type="range"
                  min="0.70"
                  max="0.95"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/[0.1] accent-[#8F8BFF]"
                  style={{
                    background: `linear-gradient(90deg, #8F8BFF 0%, #6FD8FF ${((threshold - 0.70) / 0.25) * 100}%, rgba(255,255,255,0.1) ${((threshold - 0.70) / 0.25) * 100}%)`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center font-mono">
                <div className="rounded-lg bg-white/[0.02] p-2">
                  <span className="text-[10px] text-[#8A8A97] block">Precision</span>
                  <span className="text-xs font-bold text-emerald-400">{precisionPct}%</span>
                </div>
                <div className="rounded-lg bg-white/[0.02] p-2">
                  <span className="text-[10px] text-[#8A8A97] block">FAR Error</span>
                  <span className="text-xs font-bold text-[#8F8BFF]">{farRate}%</span>
                </div>
                <div className="rounded-lg bg-white/[0.02] p-2">
                  <span className="text-[10px] text-[#8A8A97] block">Latency</span>
                  <span className="text-xs font-bold text-[#6FD8FF]">{latencyMs}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Technological Pillars of Smart Attendance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#101016] p-6 hover:border-[#8F8BFF]/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8F8BFF]/10 text-[#8F8BFF] mb-4">
              <Cpu className="h-6 w-6" />
            </div>
            <h4 className="font-display font-semibold text-white text-base mb-1">ArcFace 512-D Embeddings</h4>
            <p className="text-xs text-[#8A8A97] leading-relaxed">
              Deep convolutional neural networks map 106 facial points into invariant vector hyperplanes, robust to changes in hairstyles, glasses, or lighting.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#101016] p-6 hover:border-[#6FD8FF]/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6FD8FF]/10 text-[#6FD8FF] mb-4">
              <Eye className="h-6 w-6" />
            </div>
            <h4 className="font-display font-semibold text-white text-base mb-1">Passive Anti-Spoofing</h4>
            <p className="text-xs text-[#8A8A97] leading-relaxed">
              Analyzes micro-texture frequency distribution and specular reflections to reject photo prints, tablet screen replays, and 3D silicone mask spoofs.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#101016] p-6 hover:border-emerald-500/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h4 className="font-display font-semibold text-white text-base mb-1">30s Rotating Salt Tokens</h4>
            <p className="text-xs text-[#8A8A97] leading-relaxed">
              Dynamic QR tokens regenerate every 30 seconds with signed server salts, rendering forwarded photos and screenshots completely useless.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#101016] p-6 hover:border-amber-500/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
              <Activity className="h-6 w-6" />
            </div>
            <h4 className="font-display font-semibold text-white text-base mb-1">Edge Offline Sync Mesh</h4>
            <p className="text-xs text-[#8A8A97] leading-relaxed">
              Kiosks buffer attendance locally during internet outages with cryptographic proof-of-time stamps, automatically syncing when connection restores.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
