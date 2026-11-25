'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Sliders } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { SpotlightCard } from '@/components/ui/spotlight-card';

export function SmartAttendanceSection() {
  const [threshold, setThreshold] = useState(0.82);

  const precisionPct = (99.2 + (threshold - 0.7) * 2.5).toFixed(1);
  const farRate = Math.max(0.001, (0.01 - (threshold - 0.7) * 0.03)).toFixed(4);
  const latencyMs = Math.round(110 + (threshold - 0.7) * 15);

  return (
    <section id="smart-attendance" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32">
      <div className="mx-auto max-w-[var(--wide)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Comparison & Calibration"
          title="Why Smart Attendance Matters"
          description="Paper sign-ins and manual roll calls average 15 minutes per lecture and permit proxy sign-ins. SmartFace verifies identities at the gate or classroom door in under 120ms with calibrated ArcFace embeddings."
        />

        {/* Side-by-Side Comparison Matrix */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Legacy Attendance */}
          <Reveal delay={0.05} direction="up">
            <SpotlightCard spotlightColor="rgba(239, 68, 68, 0.14)" borderColor="rgba(239, 68, 68, 0.35)" className="p-6 sm:p-7 h-full">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <h3 className="font-display text-base font-semibold text-hi">Legacy Attendance Methods</h3>
                <span className="font-mono text-[10px] text-red-400 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                  Paper & RFID Swipes
                </span>
              </div>

              <ul className="space-y-3.5 text-xs text-mid">
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong className="text-hi">15 minutes lost per class:</strong> Calling names or passing paper sheets disrupts teaching time.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong className="text-hi">18–24% proxy rate:</strong> Students routinely sign for absent friends or hand off RFID badges.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Delayed parent notification:</strong> Guardians only learn of attendance issues weeks later when official reports are compiled.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Manual ledger entry:</strong> Office staff re-type paper tallies into academic management software.</span>
                </li>
              </ul>
            </SpotlightCard>
          </Reveal>

          {/* SmartFace */}
          <Reveal delay={0.12} direction="up">
            <SpotlightCard spotlightColor="rgba(30, 215, 96, 0.16)" borderColor="rgba(30, 215, 96, 0.35)" className="p-6 sm:p-7 h-full">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <h3 className="font-display text-base font-semibold text-hi">SmartFace AI Biometrics</h3>
                <span className="font-mono text-[10px] text-spotify uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-spotify/10 border border-spotify/25">
                  ArcFace 512-D ONNX
                </span>
              </div>

              <ul className="space-y-3.5 text-xs text-hi/90">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-spotify shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Under 120ms verification:</strong> Walk-through gates handle 45 to 60 students per minute without physical contact.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-spotify shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Single-device binding:</strong> 30-second dynamic salts and hardware tokens prevent forwarded QR screenshots.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-spotify shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Immediate parent notifications:</strong> Parents receive an SMS and push alert the second their child passes Gate A.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-spotify shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Automated streak calculation:</strong> Nexa AI monitors minimum 75% thresholds and computes safe-bunk buffers.</span>
                </li>
              </ul>
            </SpotlightCard>
          </Reveal>
        </div>

        {/* Neural Calibration Tuner */}
        <Reveal delay={0.15} direction="up">
          <div className="card-bytune p-6 sm:p-8 mb-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders className="h-4 w-4 text-accent" />
                  <span className="font-mono text-xs uppercase tracking-wider text-accent">Cosine Match Threshold</span>
                </div>
                <h3 className="font-display text-xl font-medium text-hi">
                  Decision Boundary Calibration
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-mid leading-relaxed">
                  SmartFace calibrates at <strong className="text-hi font-mono">0.82</strong> to maintain a 0.001% False Acceptance Rate while matching legitimate student faces across varied classroom illumination.
                </p>
              </div>

              <div className="w-full lg:w-96 rounded-2xl bg-[#050507] border border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-faint">Calibrated Cutoff:</span>
                  <span className="font-mono font-bold text-sm text-accent">{threshold.toFixed(2)}</span>
                </div>

                <input
                  type="range"
                  min="0.70"
                  max="0.95"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/[0.1] accent-[#8F8BFF]"
                />

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center font-mono">
                  <div className="rounded-xl bg-white/[0.03] p-2">
                    <span className="text-[10px] text-faint block">Precision</span>
                    <span className="text-xs font-bold text-spotify">{precisionPct}%</span>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-2">
                    <span className="text-[10px] text-faint block">FAR Error</span>
                    <span className="text-xs font-bold text-accent">{farRate}%</span>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-2">
                    <span className="text-[10px] text-faint block">Latency</span>
                    <span className="text-xs font-bold text-hi">{latencyMs}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Technical Architecture Specification Table (Replaced 4 icon card grid) */}
        <div className="portal-card overflow-hidden">
          <div className="p-5 border-b border-white/[0.08]">
            <h3 className="font-display text-base font-semibold text-white">System Architecture Specifications</h3>
            <p className="text-xs text-[#8A8A97] mt-0.5">Core technical standards implemented across campus kiosks and mobile nodes.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050507] border-b border-white/[0.08] text-[#8A8A97]">
                <tr>
                  <th className="py-3 px-5 font-medium">Subsystem</th>
                  <th className="py-3 px-5 font-medium">Implementation</th>
                  <th className="py-3 px-5 font-medium">Performance / Guarantee</th>
                  <th className="py-3 px-5 font-medium">Data Boundary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-[#B6B6C2]">
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-white">Face Embeddings</td>
                  <td className="py-3.5 px-5">ArcFace ONNX model (ResNet-50 backbone)</td>
                  <td className="py-3.5 px-5 text-emerald-400">&lt;120ms on edge CPU</td>
                  <td className="py-3.5 px-5">512-D float vectors only; no raw photos saved</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-white">Liveness Verification</td>
                  <td className="py-3.5 px-5">Passive specular reflection and micro-texture analysis</td>
                  <td className="py-3.5 px-5 text-emerald-400">99.8% photo & screen rejection</td>
                  <td className="py-3.5 px-5">Runs locally on device camera buffer</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-white">Dynamic Session QR</td>
                  <td className="py-3.5 px-5">HMAC-SHA256 timestamped cryptographic salt</td>
                  <td className="py-3.5 px-5 text-emerald-400">30-second strict drift window</td>
                  <td className="py-3.5 px-5">Locked to faculty classroom GPS perimeter</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-white">Offline Edge Sync</td>
                  <td className="py-3.5 px-5">Local encrypted SQLite queue with hardware timestamps</td>
                  <td className="py-3.5 px-5 text-emerald-400">Zero packet loss during outages</td>
                  <td className="py-3.5 px-5">Auto-reconciles when campus network restores</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
