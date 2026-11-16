"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { QrCode, ShieldCheck } from "lucide-react";
import { Reveal } from "./ui/reveal";

const TOKEN_WINDOW = 30; // seconds, matches the live drift window

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

/** Deterministic pseudo-token so the "signed code" feels live without a backend. */
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

  return (
    <section
      id="token-demo"
      className="relative scroll-mt-24 overflow-hidden border-t border-[var(--hairline)] bg-bg1 py-28 sm:py-36 lg:py-[168px]"
    >
      <div className="relative mx-auto grid w-full max-w-[var(--container)] items-center gap-14 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-8">
        <Reveal>
          <h2 className="text-balance font-display text-[32px] font-medium leading-[1.04] tracking-[-0.028em] text-hi sm:text-[46px] lg:text-[58px]">
            Every code, right on time.
          </h2>
          <p className="mt-5 max-w-[560px] text-pretty text-[16px] sm:text-[19px] leading-[30.4px] tracking-[-0.015em] text-mid">
            This is the token your campus sees. It rotates on a 30-second drift window, it is signed
            to this exact class, and by the time a screenshot reaches a group chat, it is already
            dead. Watch it burn.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <span className="chip-bytune">
              Class-scoped signature
            </span>
            <span className="chip-bytune">
              30s drift window
            </span>
            <span className="chip-bytune">
              HMAC-SHA256 verified
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="relative mx-auto w-full max-w-[420px]">
            {/* Radial glow */}
            <div
              aria-hidden
              className="absolute inset-0 -inset-x-6 -inset-y-6 rounded-[36px] pointer-events-none opacity-80 card-glow-bg"
            />

            <div className="relative card-bytune p-6 sm:p-7 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mid">
                  <ShieldCheck className="h-4 w-4 text-spotify" />
                  Live Token Engine
                </span>
                <span className="chip-bytune h-6 text-[10px] text-accent">
                  Rotating HMAC
                </span>
              </div>

              {/* Central Token Display */}
              <div className="my-8 text-center">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                  Active Session Token
                </span>
                <div className="mt-2 font-mono text-5xl font-semibold tracking-wider text-hi sm:text-6xl">
                  {token}
                </div>
                <p className="mt-2 text-xs text-mid">
                  Valid for:{" "}
                  <span className="font-mono font-medium text-spotify tabular-nums">
                    {seconds}s
                  </span>
                </p>
              </div>

              {/* Progress Slider (ByTune Recipe Input 1) */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-[10px] text-faint">
                  <span>Drift Window</span>
                  <span>{Math.round(fraction * 100)}% remaining</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 p-[1px]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
                    style={{ width: `${fraction * 100}%` }}
                    transition={reduceMotion ? undefined : { ease: "linear", duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 font-mono text-[10px] text-faint">
                <span>Next rotation: {seconds < 5 ? seconds : (seconds % 5) + 1}s</span>
                <span className="text-[#9fe0b6]">Anti-replay Armed</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
