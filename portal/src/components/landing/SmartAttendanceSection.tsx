'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Sliders } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';
import { SpotlightCard } from '@/components/ui/spotlight-card';

export function SmartAttendanceSection() {
  const [threshold, setThreshold] = useState(0.60);

  const policyTier = threshold >= 0.85 ? "Strict" : threshold >= 0.65 ? "Elevated" : "Default";
  const farTradeoff = threshold >= 0.85 ? "Lower FAR" : threshold >= 0.65 ? "Balanced" : "Baseline";
  const timeoutBudget = "15.0s cap";

  return (
    <section id="smart-attendance" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32">
      <div className="mx-auto max-w-[var(--wide)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Comparison & Calibration"
          title="Why Smart Attendance Matters"
          description="Paper registers and manual roll calls consume instructional time and lack cryptographic audit trails. SmartFace pairs ArcFace (buffalo_l) 512-D verification with short-lived QR sessions and unified role portals."
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
                  <span><strong className="text-hi">Instructional time overhead:</strong> Manual roll calls or passed sheets interrupt lecture cadence.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Proxy & card-sharing risk:</strong> Signatures and unverified RFID swipes can be shared between peers.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Delayed parent notification:</strong> Guardians often learn of attendance gaps only when periodic reports are compiled.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Manual ledger entry:</strong> Administrative staff re-key paper tallies into student information systems.</span>
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
                  <span><strong className="text-hi">Automated check-ins:</strong> RetinaFace + ArcFace (buffalo_l) matches enrolled 512-D embeddings against your campus threshold.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-spotify shrink-0 mt-0.5" />
                  <span><strong className="text-hi">20s rotating QR + geofence:</strong> Short-lived HMAC-SHA256 session tokens (+5s skew) and optional classroom perimeter checks reduce replay risk.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-spotify shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Automated guardian alerts:</strong> Configurable Email, SMS, and mobile notifications when students check in or drop below thresholds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-spotify shrink-0 mt-0.5" />
                  <span><strong className="text-hi">Deterministic eligibility math:</strong> Server-side integer basis-point arithmetic powers threshold alerts and Nexa AI study guidance.</span>
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
                  <span className="font-mono text-xs uppercase tracking-wider text-accent">Cosine Match Threshold (Interactive Simulation)</span>
                </div>
                <h3 className="font-display text-xl font-medium text-hi">
                  Decision Boundary Calibration
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-mid leading-relaxed">
                  SmartFace defaults to <strong className="text-hi font-mono">0.60</strong> cosine similarity in production verification (with <strong className="text-hi font-mono">0.65</strong> and <strong className="text-hi font-mono">0.85+</strong> policy buckets configurable by Super Admins based on lighting and camera quality).
                </p>
              </div>

              <div className="w-full lg:w-96 rounded-2xl bg-[#050507] border border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-faint">Selected Threshold:</span>
                  <span className="font-mono font-bold text-sm text-accent">{threshold.toFixed(2)}</span>
                </div>

                <input
                  type="range"
                  min="0.50"
                  max="0.90"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/[0.1] accent-[#8F8BFF]"
                />

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center font-mono">
                  <div className="rounded-xl bg-white/[0.03] p-2">
                    <span className="text-[10px] text-faint block">Policy Tier</span>
                    <span className="text-xs font-bold text-spotify">{policyTier}</span>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-2">
                    <span className="text-[10px] text-faint block">FAR Tradeoff</span>
                    <span className="text-xs font-bold text-accent">{farTradeoff}</span>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-2">
                    <span className="text-[10px] text-faint block">Timeout Cap</span>
                    <span className="text-xs font-bold text-hi">{timeoutBudget}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Technical Architecture Specification Table (Replaced 4 icon card grid) */}
        <div className="portal-card overflow-hidden">
          <div className="p-5 border-b border-white/[0.08]">
            <h3 className="font-display text-base font-semibold text-white">Verified System Architecture Specifications</h3>
            <p className="text-xs text-[#8A8A97] mt-0.5">Implemented configuration across FastAPI AI worker, Express API gateway, and Flutter offline client.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050507] border-b border-white/[0.08] text-[#8A8A97]">
                <tr>
                  <th className="py-3 px-5 font-medium">Subsystem</th>
                  <th className="py-3 px-5 font-medium">Implementation</th>
                  <th className="py-3 px-5 font-medium">Configured Limit / Window</th>
                  <th className="py-3 px-5 font-medium">Data Boundary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-[#B6B6C2]">
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-white">Face Embeddings</td>
                  <td className="py-3.5 px-5">InsightFace ArcFace (buffalo_l, ResNet-50) ONNX</td>
                  <td className="py-3.5 px-5 text-emerald-400">0.60 default cosine (15s cap)</td>
                  <td className="py-3.5 px-5">512-D vectors in MongoDB; in-memory verify frames</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-white">Liveness & Abuse Controls</td>
                  <td className="py-3.5 px-5">Client-assisted liveness + rate limiting</td>
                  <td className="py-3.5 px-5 text-emerald-400">15 req/min; 2m cooldown (3 fails)</td>
                  <td className="py-3.5 px-5">Dedicated IR hardware required for strict PAD</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-white">Dynamic Session QR</td>
                  <td className="py-3.5 px-5">HMAC-SHA256 signed QR payload</td>
                  <td className="py-3.5 px-5 text-emerald-400">20s validity (+5s clock skew)</td>
                  <td className="py-3.5 px-5">Optional classroom geofence (100m default)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-white">Offline Mobile Queue</td>
                  <td className="py-3.5 px-5">Flutter AES-256 encrypted Hive + HMAC-SHA256</td>
                  <td className="py-3.5 px-5 text-emerald-400">Up to 500 records (7d purge)</td>
                  <td className="py-3.5 px-5">Queued check-ins sync on reconnect</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
