"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CloudOff,
  Fingerprint,
  Flame,
  QrCode,
  Radar,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

const TIERS = ["Bronze", "Silver", "Gold", "Inferno"];
const OFFLINE_POINTS = ["AES-256 Hive queue", "HMAC-SHA256 signed", "Up to 500 records"];

function CellLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
      <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.8} />
      {children}
    </p>
  );
}

export function Features() {
  const reduceMotion = useReducedMotion();
  const [activeCell, setActiveCell] = useState(0);
  const [qrCountdown, setQrCountdown] = useState(18);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCell((prev) => (prev + 1) % 64);
    }, 120);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setQrCountdown((prev) => (prev <= 1 ? 20 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="features"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Core Architecture"
          title="Everything attendance needs. Nothing it doesn't."
          description="Five coordinated subsystems: 512-D embeddings, rotating QR tokens, security escalation, habit streaks, and mobile offline queuing."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-6">
          {/* Feature 1: Biometrics Vector Matrix */}
          <Reveal className="lg:col-span-3" direction="up" delay={0.05}>
            <SpotlightCard
              spotlightColor="rgba(143, 139, 255, 0.22)"
              className="h-full flex flex-col justify-between"
            >
              <div>
                <CellLabel icon={Fingerprint}>512-dim biometrics</CellLabel>
                <h3 className="mt-4 font-display text-[22px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                  ArcFace (buffalo_l) vector matching
                </h3>
                <p className="mt-2 max-w-md text-[14.5px] leading-[23.9px] text-mid">
                  API enrollment extracts a 512-dimension normalized vector into MongoDB. Live verification matches embeddings in memory and returns the cosine similarity score.
                </p>

                <div
                  aria-hidden
                  className="mt-6 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-sm"
                >
                  {Array.from({ length: 64 }, (_, index) => {
                    const isLit = index === activeCell || (index + 8) % 64 === activeCell;
                    const baseOpacity = 0.15 + (((index * 37) % 11) / 11) * 0.7;
                    return (
                      <span
                        key={index}
                        className="aspect-square rounded-[3px] transition-all duration-200"
                        style={{
                          backgroundColor: isLit ? "#6fd8ff" : "#8f8bff",
                          opacity: isLit ? 1 : baseOpacity,
                          transform: isLit ? "scale(1.2)" : "scale(1)",
                          boxShadow: isLit ? "0 0 8px #6fd8ff" : "none",
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-faint border-t border-white/[0.06] pt-3">
                <span className="flex items-center gap-1.5 text-mid">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Vector · 512-D (Demo Matrix)
                </span>
                <span className="text-[#9fe0b6] font-medium">Default Cutoff ≥ 0.60</span>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* Feature 2: Anti-Proxy QR with Live Timer */}
          <Reveal className="lg:col-span-3" direction="up" delay={0.12}>
            <SpotlightCard
              spotlightColor="rgba(111, 216, 255, 0.22)"
              className="h-full flex flex-col justify-between"
            >
              <div>
                <CellLabel icon={QrCode}>Anti-proxy session</CellLabel>
                <h3 className="mt-4 font-display text-[22px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                  20s rotating tokens &amp; geofencing
                </h3>
                <p className="mt-2 max-w-md text-[14.5px] leading-[23.9px] text-mid">
                  QR tokens expire after 20 seconds (+5s clock skew), use timing-safe HMAC-SHA256 verification, and pair with optional classroom geofencing to deter forwarded screenshots.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4 p-3.5 rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-sm">
                  <div className="relative flex h-10 w-10 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#6fd8ff"
                        strokeWidth="2.5"
                        strokeDasharray={94.2}
                        strokeDashoffset={94.2 * (1 - qrCountdown / 20)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <span className="absolute font-mono text-[10px] font-semibold text-hi">
                      {qrCountdown}s
                    </span>
                  </div>

                  <div>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1 font-mono text-sm tracking-widest text-hi shadow-inner">
                      8A · 3F · D1
                    </span>
                    <span className="ml-2 font-mono text-[11px] text-faint">
                      demo expires in {qrCountdown}s
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-faint border-t border-white/[0.06] pt-3">
                <span>HMAC · SHA256</span>
                <span className="text-accent2 font-medium">20s + 5s skew window</span>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* Feature 3: Sentinel with Animated Radar Sweep */}
          <Reveal className="lg:col-span-2" direction="up" delay={0.18}>
            <SpotlightCard
              spotlightColor="rgba(30, 215, 96, 0.2)"
              className="h-full flex flex-col justify-between"
            >
              <div>
                <CellLabel icon={Radar}>Sentinel guard</CellLabel>
                <h3 className="mt-4 font-display text-[20px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                  Unrecognized face escalation
                </h3>
                <p className="mt-2 text-[14px] leading-[23px] text-mid">
                  When local OpenCV kiosk monitoring detects sustained unrecognized faces, it logs a security alert with location and timestamp to the admin console and optional email alerts.
                </p>

                <div className="relative mt-5 h-28 overflow-hidden rounded-xl border border-white/[0.06] bg-black/40 flex items-center justify-center">
                  <div className="absolute h-20 w-20 rounded-full border border-spotify/20" />
                  <div className="absolute h-12 w-12 rounded-full border border-spotify/30" />
                  <div className="absolute h-4 w-4 rounded-full border border-spotify/40" />

                  {!reduceMotion && (
                    <div
                      className="absolute inset-0 origin-center animate-radar-sweep pointer-events-none"
                      style={{
                        background:
                          "conic-gradient(from 0deg, rgba(30, 215, 96, 0.35) 0deg, transparent 60deg, transparent 360deg)",
                      }}
                    />
                  )}

                  <div className="absolute top-7 right-10 flex items-center gap-1">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-80" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-spotify" />
                    </span>
                  </div>
                  <span className="absolute bottom-2 font-mono text-[9px] uppercase tracking-wider text-faint">
                    Demo Perimeter View
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                <span className="h-2 w-2 rounded-full bg-spotify animate-ping" />
                <span className="font-mono text-xs text-mid">Admin SecurityLog active</span>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* Feature 4: Streaks */}
          <Reveal className="lg:col-span-2" direction="up" delay={0.24}>
            <SpotlightCard
              spotlightColor="rgba(243, 198, 79, 0.2)"
              className="h-full flex flex-col justify-between"
            >
              <div>
                <CellLabel icon={Flame}>Student streaks</CellLabel>
                <h3 className="mt-4 font-display text-[20px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                  Consistent attendance tracking
                </h3>
                <p className="mt-2 text-[14px] leading-[23px] text-mid">
                  Tracks consecutive attendance days and subject thresholds with Bronze-to-Inferno milestone tiers, heatmaps, and deterministic risk alerts.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {TIERS.map((tier, idx) => (
                    <motion.span
                      whileHover={{ scale: 1.08 }}
                      key={tier}
                      className={`rounded-full px-3 py-1 font-mono text-[11px] transition-all cursor-default ${idx === 3
                          ? "bg-amber/20 text-amber border border-amber/50 font-semibold shadow-[0_0_12px_rgba(243,198,79,0.3)] animate-pulse"
                          : "bg-white/[0.04] text-mid border border-white/10 hover:border-white/20"
                        }`}
                    >
                      {tier}
                    </motion.span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between font-mono text-[11.5px] uppercase tracking-[0.14em] text-faint border-t border-white/[0.06] pt-3">
                <span>Streak engine</span>
                <span className="text-amber font-semibold">Sample 14-day tier</span>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* Feature 5: Offline Mobile Queue */}
          <Reveal className="lg:col-span-2" direction="up" delay={0.3}>
            <SpotlightCard
              spotlightColor="rgba(143, 139, 255, 0.2)"
              className="h-full flex flex-col justify-between"
            >
              <div>
                <CellLabel icon={CloudOff}>Mobile resilience</CellLabel>
                <h3 className="mt-4 font-display text-[20px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                  Encrypted offline queue
                </h3>
                <p className="mt-2 text-[14px] leading-[23px] text-mid">
                  The Flutter app buffers offline QR check-in payloads in an AES-256 encrypted Hive store and reconciles on reconnect. Server-side face verification requires API connectivity or a campus LAN node.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {OFFLINE_POINTS.map((point) => (
                    <span
                      key={point}
                      className="chip-bytune h-6 text-[10.5px] px-2.5 font-mono"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between font-mono text-[11.5px] uppercase tracking-[0.14em] text-faint border-t border-white/[0.06] pt-3">
                <span>Queue sync</span>
                <span className="text-spotify font-medium">7-day stale purge</span>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
