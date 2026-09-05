'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export default function HeroVideo() {
  const [videoSrc, setVideoSrc] = useState('/videos/hero-scan.mp4');
  const [scanStatus, setScanStatus] = useState('COMPILING MESH...');
  const [matchPercent, setMatchPercent] = useState(99.12);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fallback to Mixkit stock video if local video fails to load (404)
  const handleVideoError = () => {
    if (videoSrc === '/videos/hero-scan.mp4') {
      console.log('Local hero-scan.mp4 not found, falling back to Mixkit cloud template');
      setVideoSrc('https://assets.mixkit.co/videos/preview/mixkit-futuristic-face-scanner-in-use-40347-large.mp4');
    }
  };

  // Simulating live HUD status telemetry
  useEffect(() => {
    const statusPool = [
      'ISOLATING FEATURE VECTORS...',
      'IRIS LOCK OK',
      'ANTI-PROXY SCANNING...',
      'COMPILING 3D MESH...',
      'MATCH CONFIRMED'
    ];
    let idx = 0;
    const interval = setInterval(() => {
      setScanStatus(statusPool[idx]);
      idx = (idx + 1) % statusPool.length;
      if (idx === 4) {
        setMatchPercent(99.2 + Math.random() * 0.7);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full min-h-[350px] md:min-h-[450px] flex items-center justify-center relative">
      {/* Decorative neon ambient mesh behind video */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-primary/20 rounded-full blur-[70px] pointer-events-none -z-10 animate-pulse-slow" />
      
      {/* Premium Glassmorphic Video Card Container */}
      <div className="w-full max-w-md aspect-square md:w-[420px] md:h-[420px] rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-md p-2 relative overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.15)] flex items-center justify-center">
        
        {/* Self-contained styling for high-tech HUD scanner animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes laserSweep {
            0% { top: 4%; }
            50% { top: 96%; }
            100% { top: 4%; }
          }
          @keyframes slowRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .laser-line {
            animation: laserSweep 3.5s ease-in-out infinite;
          }
          .hud-rotate {
            animation: slowRotate 15s linear infinite;
          }
        `}} />

        {/* Video Player */}
        <div className="w-full h-full rounded-2xl overflow-hidden relative bg-slate-950">
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            onError={handleVideoError}
            className="w-full h-full object-cover opacity-80"
          />

          {/* Sweeping Green Laser Scanline */}
          <div className="absolute left-[4%] right-[4%] h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] pointer-events-none laser-line z-20" />

          {/* Biometric Target crosshair overlay */}
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl z-10 flex items-center justify-center">
            {/* Target HUD Brackets */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/60" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/60" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/60" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/60" />

            {/* Rotating tracker rings */}
            <div className="w-48 h-48 rounded-full border border-dashed border-purple-500/20 hud-rotate flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-dashed border-primary/20" />
            </div>
            {/* Center target crosshair */}
            <div className="absolute w-4 h-4 flex items-center justify-center text-slate-500/30">
              +
            </div>
          </div>

          {/* Floating HUD Annotations */}
          {/* Top-Right Badge: Iris Scan status */}
          <div className="absolute top-6 right-6 px-2.5 py-1 rounded bg-slate-950/80 border border-purple-500/30 font-mono text-[8px] text-purple-400 uppercase tracking-wider backdrop-blur-sm shadow-[0_0_10px_rgba(139,92,246,0.2)] z-30">
            [IRIS SCAN: ACTIVE]
          </div>

          {/* Bottom-Left Badge: Mesh confirmation */}
          <div className="absolute bottom-6 left-6 px-2.5 py-1 rounded bg-slate-950/80 border border-emerald-500/30 font-mono text-[8px] text-emerald-400 uppercase tracking-wider backdrop-blur-sm shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center gap-1 z-30">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>[MESH: VERIFIED]</span>
          </div>

          {/* Top-Left telemetry card */}
          <div className="absolute top-6 left-6 p-3 rounded-2xl bg-slate-950/80 border border-white/5 font-mono text-[8px] space-y-1 text-slate-400 backdrop-blur-sm min-w-[120px] text-left z-30">
            <div className="text-white font-bold border-b border-white/5 pb-1 flex justify-between">
              <span>SYS STATUS</span>
              <span className="text-emerald-400 animate-pulse flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                LIVE
              </span>
            </div>
            <div>SCAN: <span className="text-purple-400 font-bold">{scanStatus}</span></div>
            {matchPercent > 0 && (
              <div className="text-emerald-400 font-bold">MATCH: {matchPercent.toFixed(2)}%</div>
            )}
          </div>

          {/* Centralized scanner scanning feedback banner */}
          <div className="absolute bottom-6 right-6 p-2 rounded-xl bg-slate-950/80 border border-white/5 font-mono text-[7px] text-slate-400 backdrop-blur-sm z-30 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            <span>ROTATING GEO-TOKEN SYNC</span>
          </div>

        </div>

      </div>
    </div>
  );
}
