'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, ShieldCheck, RefreshCw, Zap, CheckCircle2, Lock, Smartphone, Radio } from 'lucide-react';

const TOKEN_WINDOW = 30;

export function InteractiveTokenCraft() {
  const [seconds, setSeconds] = useState(TOKEN_WINDOW);
  const [activeMode, setActiveMode] = useState<'qr' | 'kiosk' | 'mesh'>('qr');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s <= 1 ? TOKEN_WINDOW : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Pseudo hash calculation based on second
  const seed = Math.floor(seconds / 5);
  const chars = '0123456789ABCDEF';
  let tokenHash = '';
  for (let i = 0; i < 8; i++) {
    tokenHash += chars[(seed * 11 + i * 17) % 16];
  }
  const formattedToken = `${tokenHash.slice(0, 4)}-${tokenHash.slice(4, 8)}`;

  const handleSimulateScan = () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setScanResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      setScanResult(`Verified at 00:${seconds < 10 ? '0' : ''}${seconds}s • Token ${formattedToken} consumed & invalidated.`);
    }, 800);
  };

  return (
    <section id="anti-proxy-craft" className="relative scroll-mt-24 border-t border-white/[0.08] py-20 sm:py-28 bg-[#050507]">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bytune-glass-card p-6 sm:p-10 relative overflow-hidden">
          {/* Top header & mode pills */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-semibold text-[#8F8BFF] mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#8F8BFF]" />
                <span>DYNAMIC ROTATING TOKEN ENGINE</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F5F8]">
                Interactive Anti-Proxy Simulator
              </h3>
              <p className="text-xs sm:text-sm text-[#B6B6C2] mt-1">
                Experience how 30-second cryptographic token rotation stops attendance proxies before they start.
              </p>
            </div>

            {/* Mode selection chips (ByTune chip style) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveMode('qr')}
                className={`bytune-chip ${activeMode === 'qr' ? 'bytune-chip-active' : ''}`}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Dynamic Rotating QR</span>
              </button>
              <button
                onClick={() => setActiveMode('kiosk')}
                className={`bytune-chip ${activeMode === 'kiosk' ? 'bytune-chip-active' : ''}`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Kiosk Walk-Through</span>
              </button>
              <button
                onClick={() => setActiveMode('mesh')}
                className={`bytune-chip ${activeMode === 'mesh' ? 'bytune-chip-active' : ''}`}
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Offline Resync Mesh</span>
              </button>
            </div>
          </div>

          {/* Main Interactive Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
            {/* Visual Token Box */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0A0A0E] border border-white/[0.08] text-center">
              {/* Dynamic QR Representation */}
              <div className="relative flex h-52 w-52 items-center justify-center rounded-2xl bg-white p-3 shadow-2xl">
                {/* Simulated QR Pattern with dynamic elements */}
                <div className="relative h-full w-full bg-[#0A0A0E] rounded-xl flex flex-col items-center justify-center p-4">
                  <QrCode className="h-28 w-28 text-white" />
                  <div className="mt-1 font-mono text-[11px] font-bold text-[#6FD8FF] bg-[#16161D] px-2 py-0.5 rounded">
                    {formattedToken}
                  </div>
                </div>

                {/* Rotating Corner Glow */}
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#8F8BFF] animate-ping" />
              </div>

              {/* Progress Clock Bar */}
              <div className="w-full max-w-xs mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8A8A97] flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 text-[#8F8BFF] animate-spin" style={{ animationDuration: '8s' }} />
                    Rotating Salt Window:
                  </span>
                  <span className={`font-bold ${seconds <= 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                    00:{seconds < 10 ? `0${seconds}` : seconds}s
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8F8BFF] to-[#6FD8FF] transition-all duration-1000"
                    style={{ width: `${(seconds / TOKEN_WINDOW) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Explanation & Action Panel */}
            <div className="lg:col-span-6 space-y-5">
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-[#8A8A97]">
                  <span>SALT_HMAC:</span>
                  <span className="text-white truncate max-w-[200px]">sha256:4a8b...{formattedToken.toLowerCase()}</span>
                </div>
                <div className="flex items-center justify-between text-[#8A8A97]">
                  <span>DRIFT_TOLERANCE:</span>
                  <span className="text-emerald-400">Strict ±30s</span>
                </div>
                <div className="flex items-center justify-between text-[#8A8A97]">
                  <span>HARDWARE_ENCLAVE:</span>
                  <span className="text-[#6FD8FF]">Single Hardware Lock</span>
                </div>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-[#B6B6C2]">
                <p>
                  <strong>Why screenshots fail:</strong> If a student takes a screenshot and sends it over WhatsApp to an absent peer, the token expires in seconds. By the time it is opened, the salt is invalid and triggers an immediate proxy violation alert on the Sentinel console.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleSimulateScan}
                  disabled={isVerifying}
                  className="bytune-chip bytune-chip-active w-full sm:w-auto py-2.5 px-6 text-xs font-semibold justify-center shadow-lg shadow-[#8F8BFF]/20"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>{isVerifying ? 'Verifying Hardware Salt...' : 'Simulate Student Mobile Scan'}</span>
                </button>

                {scanResult && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-mono animate-fadeIn">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{scanResult}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
