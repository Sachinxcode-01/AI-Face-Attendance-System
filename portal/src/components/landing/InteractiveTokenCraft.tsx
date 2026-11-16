'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, Smartphone, Radio } from 'lucide-react';

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
      setScanResult(`Verified at 00:${seconds < 10 ? '0' : ''}${seconds}s · Token ${formattedToken} consumed and invalidated.`);
    }, 600);
  };

  return (
    <section id="anti-proxy-craft" className="relative scroll-mt-24 border-t border-white/[0.08] py-20 bg-[#050507]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="card-bytune p-6 sm:p-8 rounded-[22px] shadow-2xl">
          {/* Left-Aligned Header & Mode Switcher */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-accent mb-1.5">
                Dynamic Salt Engine
              </p>
              <h3 className="font-display text-2xl font-semibold text-hi">
                Interactive Anti-Proxy Simulator
              </h3>
              <p className="text-xs sm:text-sm text-mid mt-1">
                See how a 30-second cryptographic token rotation prevents attendance proxies and forwarded screenshots.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveMode('qr')}
                className={`chip-bytune ${activeMode === 'qr' ? 'chip-bytune-active' : ''}`}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Dynamic Rotating QR</span>
              </button>
              <button
                onClick={() => setActiveMode('kiosk')}
                className={`chip-bytune ${activeMode === 'kiosk' ? 'chip-bytune-active' : ''}`}
              >
                <span>Kiosk Walk-Through</span>
              </button>
              <button
                onClick={() => setActiveMode('mesh')}
                className={`chip-bytune ${activeMode === 'mesh' ? 'chip-bytune-active' : ''}`}
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Offline Mesh Sync</span>
              </button>
            </div>
          </div>

          {/* Interactive Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
            {/* Visual Token Box */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-[20px] bg-[#050507] border border-white/[0.08] text-center">
              <div className="relative flex h-48 w-48 items-center justify-center rounded-[18px] bg-white p-3 shadow-xl">
                <div className="relative h-full w-full bg-[#050507] rounded-[14px] flex flex-col items-center justify-center p-3">
                  <QrCode className="h-24 w-24 text-white" />
                  <div className="mt-1 font-mono text-[11px] font-bold text-accent2 bg-[#101016] px-2.5 py-0.5 rounded-full border border-white/10">
                    {formattedToken}
                  </div>
                </div>
              </div>

              {/* Progress Clock Bar */}
              <div className="w-full max-w-xs mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-faint">Rotation Window:</span>
                  <span className={`font-bold ${seconds <= 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                    00:{seconds < 10 ? `0${seconds}` : seconds}s
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent2 transition-all duration-1000"
                    style={{ width: `${(seconds / TOKEN_WINDOW) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Explanation & Action Panel */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-[18px] bg-[#050507] border border-white/[0.06] p-4.5 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-mid">
                  <span>SALT_HMAC:</span>
                  <span className="text-hi truncate max-w-[220px]">sha256:4a8b...{formattedToken.toLowerCase()}</span>
                </div>
                <div className="flex items-center justify-between text-mid">
                  <span>DRIFT_TOLERANCE:</span>
                  <span className="text-emerald-400">Strict ±30 seconds</span>
                </div>
                <div className="flex items-center justify-between text-mid">
                  <span>HARDWARE_LOCK:</span>
                  <span className="text-accent">1 Active UUID per Student</span>
                </div>
              </div>

              <p className="text-xs text-mid leading-relaxed">
                Forwarded screenshots fail because the token expires before absent students can scan it. The server verifies the cryptographic salt, device hardware UUID, and classroom geofence concurrently.
              </p>

              <div>
                <button
                  onClick={handleSimulateScan}
                  disabled={isVerifying}
                  className="btn-pill-accent h-10 px-5 text-xs font-semibold flex items-center gap-2"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>{isVerifying ? 'Verifying...' : 'Simulate Student Scan'}</span>
                </button>

                {scanResult && (
                  <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs text-emerald-400 font-mono">
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
