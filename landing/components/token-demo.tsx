"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SpotlightCard } from "./ui/spotlight-card";

const TOKEN_WINDOW = 20; // seconds (matches backend/api/src/utils/attendanceQr.js VALIDITY_MS = 20_000)

function useTokenClock() {
  const [seconds, setSeconds] = useState(TOKEN_WINDOW);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((s) => (s <= 1 ? TOKEN_WINDOW : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return seconds;
}

function tokenFor(seconds: number) {
  const seed = Math.floor(seconds / 5);
  const chars = "0123456789ABCDEF";
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += chars[(seed * 7 + i * 13) % 16];
  }
  return `${out.slice(0, 2)}·${out.slice(2)}`;
}

export function TokenDemo() {
  const reduceMotion = useReducedMotion();
  const seconds = useTokenClock();
  const fraction = seconds / TOKEN_WINDOW;
  const token = tokenFor(seconds);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(token.replace("·", ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="token-demo"
      className="relative scroll-mt-24 overflow-hidden border-t border-[var(--hairline)] bg-bg1 py-28 sm:py-36 lg:py-[168px]"
    >
      <div className="relative mx-auto grid w-full max-w-[var(--container)] items-center gap-14 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-8">
        <Reveal direction="left" duration={0.75}>
          <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            <span className="h-px w-6 bg-accent/60" aria-hidden />
            Anti-Proxy Cryptography · Simulator
          </p>
          <h2 className="mt-3 text-balance font-display text-[32px] font-medium leading-[1.04] tracking-[-0.028em] text-hi sm:text-[46px] lg:text-[58px]">
            Short-lived tokens, verified in real time.
          </h2>
          <p className="mt-5 max-w-[560px] text-pretty text-[16px] sm:text-[19px] leading-[30.4px] tracking-[-0.015em] text-mid">
            This interactive demo illustrates SmartFace&apos;s session QR lifecycle: tokens carry a 20-second validity window (+5s clock-skew tolerance), timing-safe HMAC-SHA256 signature, duplicate check-in lock, and optional Haversine classroom geofence to deter screenshot sharing.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <span className="chip-bytune font-mono text-[11px]">
              Session-scoped HMAC-SHA256
            </span>
            <span className="chip-bytune font-mono text-[11px]">
              20s validity (+5s skew)
            </span>
            <span className="chip-bytune font-mono text-[11px]">
              Unique session check-in lock
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.15} direction="right" duration={0.8}>
          <div className="relative mx-auto w-full max-w-[440px]">
            <div
              aria-hidden
              className="absolute inset-0 -inset-x-6 -inset-y-6 rounded-[36px] pointer-events-none opacity-80 card-glow-bg animate-glow-breathe"
            />

            <SpotlightCard
              spotlightColor="rgba(111, 216, 255, 0.2)"
              enableTilt
              className="p-6 sm:p-7 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mid">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
                  </span>
                  Simulated Token Demo
                </span>
                <span className="chip-bytune h-6 text-[10px] text-accent border-accent/20 bg-accent/5 font-semibold">
                  HMAC-SHA256
                </span>
              </div>

              <div className="my-8 text-center">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  Sample Token Window
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={token}
                    initial={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 font-mono text-5xl font-semibold tracking-wider text-hi sm:text-6xl text-shimmer-accent drop-shadow-[0_0_20px_rgba(111,216,255,0.3)]"
                  >
                    {token}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <p className="text-xs text-mid">
                    Valid for:{" "}
                    <span
                      className={`font-mono font-semibold tabular-nums ${seconds <= 5 ? "text-amber animate-pulse" : "text-spotify"
                        }`}
                    >
                      {seconds}s
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="chip-bytune h-6 text-[10.5px] px-2.5 gap-1 hover:text-hi active:scale-95"
                    title="Copy sample token"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-spotify" />
                        <span className="text-spotify font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-mono text-[10px] text-faint">
                  <span>20s Validity Window</span>
                  <span>{Math.round(fraction * 100)}% remaining</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 p-[1px]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${fraction * 100}%`,
                      background:
                        seconds <= 5
                          ? "linear-gradient(90deg, #f3c64f, #ef4444)"
                          : "linear-gradient(90deg, #8f8bff, #6fd8ff)",
                    }}
                    transition={reduceMotion ? undefined : { ease: "linear", duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 font-mono text-[10px] text-faint">
                <span>Next cycle in: {seconds}s</span>
                <span className="text-[#9fe0b6] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-spotify" />
                  Timing-safe check
                </span>
              </div>
            </SpotlightCard>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
