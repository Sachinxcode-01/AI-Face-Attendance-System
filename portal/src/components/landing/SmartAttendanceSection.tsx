'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Sliders } from 'lucide-react';

export function SmartAttendanceSection() {
  const [threshold, setThreshold] = useState(0.82);

  const precisionPct = (99.2 + (threshold - 0.7) * 2.5).toFixed(1);
  const farRate = Math.max(0.001, (0.01 - (threshold - 0.7) * 0.03)).toFixed(4);
  const latencyMs = Math.round(110 + (threshold - 0.7) * 15);

  return (
      <section id="smart-attendance" className="relative scroll-mt-24 border-t border-white/[0.08] py-20 bg-[#050507]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Left-Aligned Section Header - No pill badges */}
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-mono uppercase tracking-wider text-[#8F8BFF] mb-2">
              Comparison & Calibration
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#F5F5F8]">
              Why Smart Attendance Matters
            </h2>
            <p className="mt-3 text-sm text-[#B6B6C2] leading-relaxed">
              Paper sign-ins and manual roll calls average 15 minutes per lecture and permit proxy sign-ins. SmartFace verifies identities at the gate or classroom door in under 120ms with calibrated ArcFace embeddings.
            </p>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Legacy Attendance */}
            <div className="portal-card p-6 border-red-500/20 bg-[#0E0C10]">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <h3 className="font-display text-base font-semibold text-white">Legacy Attendance Methods</h3>
                <span className="font-mono text-[10px] text-red-400 uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                  Paper & RFID Swipes
                </span>
              </div>

              <ul className="space-y-3.5 text-xs text-[#B6B6C2]">
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong>15 minutes lost per class:</strong> Calling names or passing paper sheets disrupts teaching time.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong>18–24% proxy rate:</strong> Students routinely sign for absent friends or hand off RFID badges.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong>Delayed parent notification:</strong> Guardians only learn of attendance issues weeks later when official reports are compiled.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span><strong>Manual ledger entry:</strong> Office staff re-type paper tallies into academic management software.</span>
                </li>
              </ul>
            </div>

            {/* SmartFace */}
            <div className="portal-card p-6 border-emerald-500/20 bg-[#0B1012]">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <h3 className="font-display text-base font-semibold text-white">SmartFace AI Biometrics</h3>
                <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  ArcFace 512-D ONNX
                </span>
              </div>

              <ul className="space-y-3.5 text-xs text-[#F5F5F8]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Under 120ms verification:</strong> Walk-through gates handle 45 to 60 students per minute without physical contact.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Single-device binding:</strong> 30-second dynamic salts and hardware tokens prevent forwarded QR screenshots.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Immediate parent notifications:</strong> Parents receive an SMS and push alert the second their child passes Gate A.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Automated streak calculation:</strong> Nexa AI monitors minimum 75% thresholds and computes safe-bunk buffers.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Neural Calibration Tuner */}
          <div className="portal-card p-6 sm:p-7 mb-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders className="h-4 w-4 text-[#8F8BFF]" />
                  <span className="font-mono text-xs uppercase tracking-wider text-[#8F8BFF]">Cosine Match Threshold</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-white">
                  Decision Boundary Calibration
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#B6B6C2] leading-relaxed">
                  SmartFace calibrates at <strong className="text-white font-mono">0.82</strong> to maintain a 0.001% False Acceptance Rate while matching legitimate student faces across varied classroom illumination.
                </p>
              </div>

              <div className="w-full lg:w-96 rounded-lg bg-[#050507] border border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8A8A97]">Calibrated Cutoff:</span>
                  <span className="font-mono font-bold text-sm text-[#8F8BFF]">{threshold.toFixed(2)}</span>
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
                  <div className="rounded bg-white/[0.03] p-2">
                    <span className="text-[10px] text-[#8A8A97] block">Precision</span>
                    <span className="text-xs font-bold text-emerald-400">{precisionPct}%</span>
                  </div>
                  <div className="rounded bg-white/[0.03] p-2">
                    <span className="text-[10px] text-[#8A8A97] block">FAR Error</span>
                    <span className="text-xs font-bold text-[#8F8BFF]">{farRate}%</span>
                  </div>
                  <div className="rounded bg-white/[0.03] p-2">
                    <span className="text-[10px] text-[#8A8A97] block">Latency</span>
                    <span className="text-xs font-bold text-white">{latencyMs}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
