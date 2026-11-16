'use client';

import React, { useState } from 'react';
import { ScanFace, CheckCircle2, RefreshCw } from 'lucide-react';

export function BiometricHeroVisual() {
  const [isScanning, setIsScanning] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(0.962);
  const [latencyMs, setLatencyMs] = useState(114);
  const [activeTab, setActiveTab] = useState<'preview' | 'telemetry'>('preview');

  const handleTriggerScan = () => {
    if (isScanning) return;
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      setSimilarityScore(+(0.94 + Math.random() * 0.05).toFixed(3));
      setLatencyMs(Math.floor(105 + Math.random() * 25));
    }, 900);
  };

  return (
    <div className="w-full max-w-xl mx-auto lg:max-w-none">
      {/* Main Solid Card - No backdrop filter, no blur, no glowing blobs */}
      <div className="portal-card p-5 sm:p-6 text-[#F5F5F8]">
        {/* Top Header of Card */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <ScanFace className="h-5 w-5 text-[#8F8BFF]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm text-[#F5F5F8]">ArcFace Sentinel v4.2</span>
                <span className="rounded bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                  LIVE INFERENCE
                </span>
              </div>
              <p className="text-[11px] text-[#8A8A97]">512-D ONNX Neural Engine • Touchless Gate 01</p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded bg-[#090A10] border border-white/[0.08] p-0.5">
            <button
              onClick={() => setActiveTab('preview')}
              className={`portal-chip ${activeTab === 'preview' ? 'portal-chip-active' : ''} text-[11px] py-1 px-3`}
            >
              Live UI
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`portal-chip ${activeTab === 'telemetry' ? 'portal-chip-active' : ''} text-[11px] py-1 px-3`}
            >
              512-D Vector
            </button>
          </div>
        </div>

        {/* Real Product Image Screen */}
        {activeTab === 'preview' ? (
          <div className="relative my-4 rounded-lg border border-white/[0.08] bg-[#050507] overflow-hidden">
            <img
              src="/product-banner.png"
              alt="SmartFace real campus attendance dashboard and live biometric verification roster"
              className="w-full h-52 sm:h-64 object-cover object-top"
            />
            {isScanning && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="absolute inset-x-0 h-0.5 bg-[#8F8BFF] animate-scan" />
                <div className="rounded bg-[#0D0F17] border border-white/20 px-3 py-1.5 text-xs font-mono text-[#F5F5F8] flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#8F8BFF]" />
                  <span>Calculating 512-D Cosine Match...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="my-4 rounded-lg border border-white/[0.08] bg-[#050507] p-4 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-[#8A8A97]">
              <span>COSINE_SIMILARITY:</span>
              <span className="text-emerald-400 font-bold">{similarityScore} (Threshold: 0.820)</span>
            </div>
            <div className="flex items-center justify-between text-[#8A8A97]">
              <span>LATENCY:</span>
              <span className="text-[#8F8BFF]">{latencyMs}ms ONNX inference</span>
            </div>
            <div className="flex items-center justify-between text-[#8A8A97]">
              <span>PASSIVE_LIVENESS:</span>
              <span className="text-emerald-400">99.8% Confirmed Real</span>
            </div>
            <div className="rounded bg-[#0D0F17] p-2.5 text-[11px] text-[#B6B6C2] break-all border border-white/[0.06]">
              [0.0841, -0.2190, 0.4328, 0.9123, -0.0542, 0.3129, 0.0094, -0.1482, ...]
            </div>
          </div>
        )}

        {/* Subject Verified Banner */}
        <div className="flex items-center justify-between rounded-lg bg-[#090A10] border border-white/[0.06] px-3.5 py-2.5 text-xs mb-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-[#F5F5F8] text-[12px] leading-tight">Alice Smith (Roll #CS-2024-042)</p>
              <p className="text-[11px] text-[#8A8A97]">Class CS-401 • Room 302 • Gate A</p>
            </div>
          </div>
          <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
            PRESENT
          </span>
        </div>

        {/* Action Button & Metric */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <span className="text-xs text-[#8A8A97] font-mono">
            1,482 verifications recorded today
          </span>

          <button
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="portal-btn portal-btn-primary py-2 px-3.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Testing Match...' : 'Test Verification'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
