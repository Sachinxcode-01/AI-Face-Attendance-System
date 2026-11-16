'use client';

import React, { useState, useEffect } from 'react';
import { ScanFace, ShieldCheck, Zap, Activity, CheckCircle2, Lock, Sparkles, RefreshCw } from 'lucide-react';

export function BiometricHeroVisual() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [similarityScore, setSimilarityScore] = useState(0.962);
  const [latencyMs, setLatencyMs] = useState(114);
  const [activeTab, setActiveTab] = useState<'neural' | 'telemetry' | 'liveness'>('neural');
  const [verifiedCount, setVerifiedCount] = useState(1482);

  const handleTriggerScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setSimilarityScore(+(0.94 + Math.random() * 0.05).toFixed(3));
          setLatencyMs(Math.floor(105 + Math.random() * 25));
          setVerifiedCount((c) => c + 1);
          return 100;
        }
        return prev + 12;
      });
    }, 70);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
      {/* Background radial glow matching ByTune reference: radial-gradient(58% 58% at 50% 62%, rgba(143, 139, 255, 0.2), ...) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[32px] opacity-75 blur-2xl"
        style={{
          background: 'radial-gradient(60% 60% at 50% 50%, rgba(143, 139, 255, 0.22) 0%, rgba(111, 216, 255, 0.1) 45%, rgba(0,0,0,0) 75%)',
        }}
      />

      {/* Main Glassmorphism Card */}
      <div className="bytune-glass-card relative overflow-hidden p-6 sm:p-7 text-[#F5F5F8]">
        {/* Top Header of Card */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8F8BFF]/30 to-[#6FD8FF]/20 border border-[#8F8BFF]/40 text-[#8F8BFF]">
              <ScanFace className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm tracking-tight text-[#F5F5F8]">ArcFace Sentinel v4.2</span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
                  LIVE INFERENCE
                </span>
              </div>
              <p className="text-[11px] text-[#8A8A97]">512-D ONNX Neural Engine • Touchless Gate 01</p>
            </div>
          </div>

          {/* ByTune style chip toggle */}
          <div className="hidden sm:flex items-center gap-1 rounded-full bg-white/[0.03] border border-white/[0.08] p-0.5">
            <button
              onClick={() => setActiveTab('neural')}
              className={`bytune-chip ${activeTab === 'neural' ? 'bytune-chip-active' : ''} text-[11px] py-1 px-3`}
            >
              Neural
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`bytune-chip ${activeTab === 'telemetry' ? 'bytune-chip-active' : ''} text-[11px] py-1 px-3`}
            >
              Telemetry
            </button>
            <button
              onClick={() => setActiveTab('liveness')}
              className={`bytune-chip ${activeTab === 'liveness' ? 'bytune-chip-active' : ''} text-[11px] py-1 px-3`}
            >
              Anti-Spoof
            </button>
          </div>
        </div>

        {/* Center Scanner Frame */}
        <div className="relative my-5 rounded-2xl border border-white/[0.08] bg-[#0A0A0E]/90 p-5 overflow-hidden">
          {/* Scanning Beam Animation */}
          {isScanning && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8F8BFF] to-transparent shadow-[0_0_15px_#8F8BFF] animate-scan z-20" />
          )}

          {/* Corner Guides */}
          <div className="absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-[#8F8BFF]" />
          <div className="absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-[#8F8BFF]" />
          <div className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-[#8F8BFF]" />
          <div className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-[#8F8BFF]" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            {/* Visual Face Canvas Simulation */}
            <div className="relative flex h-36 w-36 sm:h-40 sm:w-40 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06]">
              {/* Concentric telemetry rings */}
              <div className="absolute inset-2 rounded-full border border-dashed border-[#8F8BFF]/20 animate-spin" style={{ animationDuration: '24s' }} />
              <div className="absolute inset-6 rounded-full border border-[#6FD8FF]/20" />
              
              {/* Simulated Face Silhouette / Landmarking */}
              <div className="relative z-10 flex flex-col items-center">
                <ScanFace className={`h-16 w-16 transition-all duration-300 ${isScanning ? 'text-[#8F8BFF] scale-105' : 'text-white/80'}`} />
                <span className="mt-1 font-mono text-[9.5px] uppercase tracking-wider text-[#6FD8FF]">
                  {isScanning ? 'Aligning Points...' : 'Lock: Confirmed'}
                </span>
              </div>

              {/* Status Badge in Corner */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-[#0A0A0E]/90 px-1.5 py-0.5 border border-white/10 text-[9px] font-mono text-[#B6B6C2]">
                <Activity className="h-2.5 w-2.5 text-emerald-400" />
                60 FPS
              </div>
            </div>

            {/* Live Vector & Match Telemetry */}
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#B6B6C2]">Identity Match</span>
                <span className="font-mono text-xs font-semibold text-emerald-400">
                  {similarityScore} Cosine (99.4%)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8F8BFF] to-[#6FD8FF] transition-all duration-500"
                  style={{ width: `${Math.min(similarityScore * 100, 100)}%` }}
                />
              </div>

              {/* Embedding Vector Sample Preview */}
              <div className="rounded-lg bg-black/40 border border-white/[0.06] p-2.5 font-mono text-[10.5px]">
                <div className="flex items-center justify-between text-[#8A8A97] mb-1">
                  <span>Embedding Vector (512-D)</span>
                  <span className="text-[#6FD8FF]">{latencyMs}ms</span>
                </div>
                <p className="truncate text-[#B6B6C2] font-mono text-[10px]">
                  [0.0841, -0.2190, 0.4328, 0.9123, -0.0542, 0.3129, ...]
                </p>
              </div>

              {/* Verified Subject Pill */}
              <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.06] px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white text-[12px] leading-tight">Alice Smith (Roll #CS-042)</p>
                    <p className="text-[10px] text-[#8A8A97]">Class CS-401 • Room 302</p>
                  </div>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                  PRESENT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer: Real-time LiveCount Equalizer & Interactive Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/[0.08]">
          {/* LiveCount Equalizer (Inspired by ByTune LiveCount_eq) */}
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-5 w-7">
              <span className="w-1 bg-[#8F8BFF] rounded-full animate-eq-1" />
              <span className="w-1 bg-[#6FD8FF] rounded-full animate-eq-2" />
              <span className="w-1 bg-[#8F8BFF] rounded-full animate-eq-3" />
              <span className="w-1 bg-[#6FD8FF] rounded-full animate-eq-4" />
              <span className="w-1 bg-[#8F8BFF] rounded-full animate-eq-5" />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold text-white">
                {verifiedCount.toLocaleString()}+ Verified Today
              </p>
              <p className="text-[10px] text-[#8A8A97]">Zero proxy anomalies detected</p>
            </div>
          </div>

          {/* Interactive Trigger Button */}
          <button
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="bytune-chip bytune-chip-active hover:opacity-95 active:scale-95 text-xs py-2 px-4 shadow-lg shadow-[#8F8BFF]/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Computing Embedding...' : 'Simulate Biometric Scan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
