"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanFace, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

interface TelemetryStage {
  progress: number;
  label: string;
  sub: string;
}

const STAGES: TelemetryStage[] = [
  { progress: 15, label: "BOOTING SMARTFACE NODE", sub: "Initializing neural recognition kernel v2.4" },
  { progress: 42, label: "LOADING ARCFACE 512-D WEIGHTS", sub: "Sub-300ms vector matching pipeline primed" },
  { progress: 78, label: "CRYPTOGRAPHIC SAFEGUARDS VERIFIED", sub: "Zero-photo storage & TLS 1.3 handshake active" },
  { progress: 100, label: "SYSTEM OPERATIONAL", sub: "Enterprise biometric attendance ready" },
];

export function Preloader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user already saw the full preloader in this browser session
    const hasLoadedBefore = typeof window !== "undefined" && sessionStorage.getItem("smartface_booted");
    const duration = hasLoadedBefore ? 450 : 850; // Snappy 450ms for repeat visits, 850ms for first-time boot

    let startTime: number | null = null;
    let animationFrameId: number;

    const updateProgress = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min((elapsed / duration) * 100, 100);

      // Smooth easeOutQuad progress
      const eased = Math.round(100 * (1 - Math.pow(1 - rawProgress / 100, 2)));
      setProgress(eased);

      if (rawProgress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // Hold at 100% briefly for polish, then smoothly dismiss
        setTimeout(() => {
          setLoading(false);
          try {
            sessionStorage.setItem("smartface_booted", "true");
          } catch {
            // ignore storage errors in private browsing
          }
        }, 140);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Prevent scroll while preloading
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  if (!mounted) return null;

  // Find active stage
  const currentStage = STAGES.slice().reverse().find((s) => progress >= s.progress) || STAGES[0];

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="smartface-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.99,
            filter: "blur(8px)",
            transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050507] px-6 text-center select-none"
        >
          {/* Ambient Cosmic Background Glows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(143,139,255,0.18)_0%,rgba(111,216,255,0.06)_45%,transparent_70%)] blur-[60px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(30,215,96,0.12)_0%,transparent_70%)] blur-[40px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-[420px] w-full">
            {/* Biometric Scanner Aperture */}
            <div className="relative mb-7">
              {/* Spinning Conic Gradient Ring */}
              <div
                className="absolute -inset-2.5 rounded-2xl opacity-75 blur-sm animate-[spin_6s_linear_infinite]"
                style={{
                  background:
                    "conic-gradient(from 0deg at 50% 50%, rgba(143,139,255,0.8), rgba(111,216,255,0.9), rgba(30,215,96,0.8), rgba(143,139,255,0.8))",
                }}
              />

              {/* Central Frosted Badge */}
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-[#101016]/90 shadow-2xl backdrop-blur-xl">
                <ScanFace className="h-9 w-9 text-[#8f8bff] transition-transform duration-300" strokeWidth={1.7} />

                {/* Laser scan line animation */}
                <motion.div
                  animate={{ y: [-24, 24, -24] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-x-3 h-[2px] bg-gradient-to-r from-transparent via-[#6fd8ff] to-transparent shadow-[0_0_8px_#6fd8ff]"
                />

                {/* Corner reticles */}
                <div className="absolute top-2 left-2 h-1.5 w-1.5 border-t border-l border-[#6fd8ff]" />
                <div className="absolute top-2 right-2 h-1.5 w-1.5 border-t border-r border-[#6fd8ff]" />
                <div className="absolute bottom-2 left-2 h-1.5 w-1.5 border-b border-l border-[#6fd8ff]" />
                <div className="absolute bottom-2 right-2 h-1.5 w-1.5 border-b border-r border-[#6fd8ff]" />

                {/* Status Dot */}
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ed760] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#1ed760] border-2 border-[#050507]" />
                </span>
              </div>
            </div>

            {/* Brand Title */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10.5px] font-mono tracking-widest text-[#8f8bff] uppercase">
                <Sparkles className="h-3 w-3 text-[#6fd8ff]" />
                SmartFace Engine
              </span>
              <span className="text-[11px] font-mono text-white/40">|</span>
              <span className="text-[11px] font-mono text-[#1ed760] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                99.8% Precision
              </span>
            </div>

            {/* Telemetry Stage Output */}
            <motion.h2
              key={currentStage.label}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[14px] font-semibold tracking-wide text-white uppercase font-mono"
            >
              {currentStage.label}
            </motion.h2>

            <motion.p
              key={currentStage.sub}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-[12px] text-[#8a8a97] mt-0.5 h-5 truncate max-w-full font-sans"
            >
              {currentStage.sub}
            </motion.p>

            {/* Progress Bar Container */}
            <div className="w-full mt-5 relative">
              <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/[0.08] p-[1px] shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#8f8bff] via-[#6fd8ff] to-[#1ed760] shadow-[0_0_12px_rgba(111,216,255,0.6)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.1 }}
                />
              </div>

              {/* Progress and Latency Telemetry */}
              <div className="flex items-center justify-between mt-2.5 px-0.5 text-[11px] font-mono text-[#8a8a97]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6fd8ff] animate-pulse" />
                  Latency: <span className="text-white font-medium">&lt;300ms</span>
                </span>
                <span className="text-white font-semibold tabular-nums text-[12px]">
                  {progress}%
                </span>
              </div>
            </div>

            {/* Quick Skip button for accessibility */}
            <button
              type="button"
              onClick={() => setLoading(false)}
              className="mt-6 text-[10.5px] font-mono text-white/30 hover:text-white/70 transition-colors uppercase tracking-wider"
            >
              [ Click to bypass ]
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
