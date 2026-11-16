"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ArrowDown, ArrowRight, ArrowUpRight, Activity, Radio, Sparkles } from "lucide-react";
import { PORTAL_URL } from "@/lib/constants";
import { VerificationCard } from "./verification-card";

const METRICS = [
  { value: "99.8%", label: "Recognition accuracy" },
  { value: "<300ms", label: "Verify latency" },
  { value: "512-d", label: "ArcFace embedding" },
];

const HEADLINE = [
  { text: "Every face. Every gate.", className: "text-hi" },
  { text: "One campus.", className: "text-hi font-medium" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/** Live "verifications today" ticker with animated equalizer bars. */
function LiveCount() {
  const [count, setCount] = useState(1284);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCount((value) => value + Math.floor(Math.random() * 3) + 1);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      data-cue
      className="inline-flex items-center gap-2.5 rounded-full border border-[var(--hairline)] bg-[rgba(16,16,22,0.8)] backdrop-blur-md px-3.5 py-1.5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
      style={{ animation: "Hero_cueFade 0.9s var(--ease-out) 0.5s both" }}
    >
      <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden>
        {[0, 1, 2, 3].map((bar) => (
          <span
            key={bar}
            className="w-[2.5px] origin-bottom rounded-full bg-spotify"
            style={{
              height: "100%",
              animation: `LiveCount_eq 1.05s var(--ease-in-out) ${bar * 0.14}s infinite`,
            }}
          />
        ))}
      </span>
      <span className="font-mono text-[11px] tabular-nums tracking-wide text-mid">
        <span className="text-hi font-medium">{count.toLocaleString("en-US")}</span> verifications today
      </span>
      <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
      <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#9fe0b6] sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-spotify" /> Live
      </span>
    </div>
  );
}

interface HeroProps {
  onOpenDemo?: () => void;
}

export function Hero({ onOpenDemo }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const lines = headlineRef.current?.querySelectorAll<HTMLElement>("[data-hero-line]");
    if (!lines?.length) return;

    if (reduceMotion) {
      lines.forEach((line) => {
        line.style.transform = "none";
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(lines, {
        y: 0,
        duration: 1.15,
        ease: "expo.out",
        stagger: 0.1,
        delay: 0.12,
      });
    }, headlineRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-32 sm:pt-40 lg:pb-36">
      {/* Ambient ByTune radial glow background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-[0.2]" />
        <div
          className="absolute -top-[120px] left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-30 blur-[120px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(143,139,255,0.3) 0%, rgba(111,216,255,0.15) 50%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-[var(--wide)] items-center gap-14 px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:px-8">
        <motion.div variants={container} initial={reduceMotion ? "show" : "hidden"} animate="show">
          <LiveCount />

          {/* ByTune Hero Heading (92px 500 line-height 92px tracking -3.22px) */}
          <h1
            ref={headlineRef}
            className="mt-6 font-display text-[2.75rem] font-medium leading-[1.02] tracking-[-0.035em] text-hi sm:text-[4rem] lg:text-[5.25rem] xl:text-[92px] xl:leading-[92px] xl:tracking-[-3.22px]"
          >
            {HEADLINE.map((line) => (
              <span key={line.text} className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
                <span
                  data-hero-line
                  style={{ transform: "translateY(112%)" }}
                  className={`block will-change-transform ${line.className}`}
                >
                  {line.text}
                </span>
              </span>
            ))}
          </h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-[560px] text-pretty text-[15px] sm:text-[16px] leading-[25.6px] text-mid"
          >
            Enterprise face recognition, rotating anti-proxy QR codes, and automated campus security
            alerts: one platform that verifies an entire campus in under 300ms.
          </motion.p>

          {/* Action pill buttons */}
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
            {onOpenDemo ? (
              <button
                type="button"
                onClick={onOpenDemo}
                className="btn-pill-accent"
              >
                Request Campus Demo
              </button>
            ) : null}
            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-pill-white"
            >
              Go to Portal
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#how-it-works"
              className="btn-pill-glass"
            >
              Explore System
            </a>
          </motion.div>

          {/* Metrics */}
          <motion.dl
            variants={item}
            className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-[var(--hairline)] pt-6"
          >
            {METRICS.map((metric) => (
              <div key={metric.label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                  {metric.label}
                </dt>
                <dd className="mt-1 font-display text-xl font-medium tracking-tight text-hi">
                  {metric.value}
                </dd>
              </div>
            ))}
          </motion.dl>

          {/* Scroll cue with ByTune dip animation */}
          <div
            aria-hidden
            className="mt-10 flex items-center gap-2 text-faint"
            style={{ animation: "Hero_cueOut 1s var(--ease-in-out) 5s forwards" }}
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-[var(--hairline)] bg-surface"
              style={{ animation: "Hero_cueDip 2.2s var(--ease-in-out) infinite" }}
            >
              <ArrowDown className="h-3.5 w-3.5 text-mid" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Scroll</span>
          </div>
        </motion.div>

        {/* Floating Hero Card with ByTune Radial Glow & 7.5s float animation */}
        < motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative lg:pl-4"
        >
          {/* Card glow behind */}
          <div
            aria-hidden
            className="absolute inset-0 -inset-x-8 -inset-y-8 rounded-[36px] pointer-events-none opacity-90 card-glow-bg"
          />

            <div style={reduceMotion ? undefined : { animation: "Hero_float 7.5s cubic-bezier(0.22, 1, 0.36, 1) infinite" }}>
              <VerificationCard />
            </div>

            {/* Floating liveness chip */}
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
              className="absolute -right-3 top-10 hidden items-center gap-2 rounded-full border border-[var(--hairline)] bg-[rgba(16,16,22,0.85)] px-4 py-2 backdrop-blur-md shadow-lg sm:flex"
              style={reduceMotion ? undefined : { animation: "DesktopSection_pipFloat 6s cubic-bezier(0.22, 1, 0.36, 1) infinite" }}
            >
              <Activity className="h-3.5 w-3.5 text-spotify" />
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mid">
                Liveness gate · online
              </span>
            </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
