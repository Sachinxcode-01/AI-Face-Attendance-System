import { ScanFace, ShieldCheck, Sparkles } from "lucide-react";

export default function Loading() {
  return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050507] px-6 text-center select-none font-sans">
          {/* Ambient background glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(143,139,255,0.16)_0%,rgba(111,216,255,0.05)_50%,transparent_70%)] blur-[50px]" />
          </div>

            <div className="relative z-10 flex flex-col items-center max-w-[380px] w-full">
              {/* Biometric Aperture */}
              <div className="relative mb-6">
                <div
                  className="absolute -inset-2 rounded-2xl opacity-70 blur-sm animate-[spin_5s_linear_infinite]"
                  style={{
                    background:
                      "conic-gradient(from 0deg, rgba(143,139,255,0.8), rgba(111,216,255,0.9), rgba(30,215,96,0.8), rgba(143,139,255,0.8))",
                  }}
                />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-[#101016]/90 shadow-2xl backdrop-blur-xl">
                  <ScanFace className="h-8 w-8 text-[#8f8bff] animate-pulse" strokeWidth={1.7} />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ed760] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1ed760] border-2 border-[#050507]" />
                  </span>
                </div>
              </div>

            {/* Badge */}
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10.5px] font-mono tracking-widest text-[#8f8bff] uppercase">
                <Sparkles className="h-3 w-3 text-[#6fd8ff]" />
                SmartFace Node
              </span>
              <span className="text-[11px] font-mono text-[#1ed760] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Active
              </span>
            </div>

            {/* Text */}
            <h2 className="text-[13.5px] font-semibold tracking-wide text-white font-mono uppercase">
              Synchronizing Neural State...
            </h2>
            <p className="text-[12px] text-[#8a8a97] mt-0.5">
              Verifying biometric pipeline &amp; encrypted telemetry
            </p>

            {/* Clean sliding progress track */}
            <div className="w-full mt-4 h-[4px] overflow-hidden rounded-full bg-white/[0.08] relative">
              <div
                className="h-full w-28 rounded-full bg-gradient-to-r from-[#8f8bff] via-[#6fd8ff] to-[#1ed760] animate-loading-slide shadow-[0_0_8px_rgba(111,216,255,0.5)]"
              />
            </div>
          </div>
        </div>
        );
}
