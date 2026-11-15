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
      className="relative scroll-mt-24 overflow-hidden border-t border-[var(--hairline)] py-24 sm:py-28"
    >
      {/* Gradient backdrop, as measured on the reference page */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #0a0a0e 0%, #101016 45%, #14122b 75%, #0a0a0e 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[30rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[140px]"
      />

      <div className="relative mx-auto grid w-full max-w-[var(--container)] items-center gap-14 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-8">
        <Reveal>
          <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent2">
            <span className="h-px w-6 bg-accent2/60" aria-hidden />
            Live session demo
          </p>
          <h2 className="mt-4 text-balance font-display text-[2.2rem] font-medium leading-[1.08] tracking-[-0.03em] text-hi sm:text-[3.25rem] lg:text-[4rem]">
            Every code, right on time.
          </h2>
          <p className="mt-5 max-w-[563.2px] text-pretty text-[16px] leading-[25.6px] text-mid">
            This is the token your campus sees. It rotates on a 30-second drift window, it is signed
            to this exact class, and by the time a screenshot reaches a group chat — it is already
            dead. Watch it burn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="badge-pill border border-[var(--hairline)] bg-[var(--glass)] backdrop-blur-md">
              Class-scoped signature
            </span>
            <span className="badge-pill border border-[var(--hairline)] bg-[var(--glass)] backdrop-blur-md">
              30s drift window
            </span>
            <span className="badge-pill border border-[var(--hairline)] bg-[var(--glass)] backdrop-blur-md">
              Screenshot-proof
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="relative mx-auto w-full max-w-[380px]">
            <div
              aria-hidden
              className="absolute -inset-8 rounded-[40px] bg-accent/15 blur-3xl"
              style={{ animation: "Hero_float 8s var(--ease-in-out) infinite" }}
            />
            <div className="glass-card relative !p-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1ed760] shadow-[0_0_8px_#1ed760]" />
                  Session · CS-204
                </span>
                <ShieldCheck className="h-4 w-4 text-[#9fe0b6]" />
              </div>

              {/* QR placeholder */}
              <div className="mt-5 grid h-36 place-items-center rounded-xl border border-[var(--hairline)] bg-black/30">
                <div className="relative">
                  <QrCode className="h-16 w-16 text-hi" strokeWidth={1.2} />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/20 to-transparent"
                    style={{
                      animation: reduceMotion
                        ? "none"
                        : "Hero_cueSweep 2.4s var(--ease-in-out) infinite",
                    }}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                    Signed token
                  </p>
                  <p className="mt-1 font-mono text-2xl tracking-[0.18em] text-hi tabular-nums">
                    {token}
                  </p>
                </div>
                <p className="font-mono text-[11px] tabular-nums text-mid">
                  <span className="text-hi">{String(seconds).padStart(2, "0")}</span>s
                </p>
              </div>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
                  style={{ width: `${fraction * 100}%` }}
                />
              </div>
              <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                Rotating · next token in {seconds}s
              </p>
            </div>

            {/* Floating confirmation chip */}
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
              className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[var(--hairline)] bg-panel/90 px-4 py-2 backdrop-blur-xl"
              style={{ animation: "Hero_float 7s var(--ease-in-out) 1s infinite" }}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#1ed760]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mid">
                Verified · synced 0.2s ago
              </span>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
