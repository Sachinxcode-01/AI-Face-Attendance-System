"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ArrowDown, ArrowRight, Activity, Sparkles, Shield, Cpu } from "lucide-react";
import { PORTAL_URL } from "@/lib/constants";
import { VerificationCard } from "./verification-card";

const METRICS = [
  { value: "99.8%", label: "Recognition accuracy", sub: "ArcFace cosine 0.94" },
  { value: "<300ms", label: "Verify latency", sub: "INT8 on-device ONNX" },
  { value: "512-dim", label: "Vector embedding", sub: "Zero photo storage" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
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
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex items-center gap-2.5 rounded-full border border-[var(--hairline)] bg-[rgba(16,16,22,0.8)] backdrop-blur-md px-3.5 py-1.5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_20px_rgba(0,0,0,0.4)]"
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
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
        </span>
        Live fleet
      </span>
    </motion.div>
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
        stagger: 0.12,
        delay: 0.12,
      });
    }, headlineRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-32 sm:pt-40 lg:pb-36">
      {/* Ambient background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.2]" />
        <div
          className="absolute -top-[120px] left-1/2 -translate-x-1/2 h-[540px] w-[900px] rounded-full opacity-35 blur-[130px] pointer-events-none animate-glow-breathe"
          style={{
            background:
              "radial-gradient(circle, rgba(143,139,255,0.35) 0%, rgba(111,216,255,0.18) 50%, transparent 75%)",
          }}
        />
        <div
          className="absolute top-[20%] right-[10%] h-[320px] w-[320px] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(30,215,96,0.2) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-[var(--wide)] items-center gap-14 px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:px-8">
        <motion.div variants={container} initial={reduceMotion ? "show" : "hidden"} animate="show">
          <LiveCount />

          {/* Hero Heading with kinetic reveal & subtle gradient accent */}
          <h1
            ref={headlineRef}
            className="mt-6 font-display text-[2.75rem] font-medium leading-[1.02] tracking-[-0.035em] text-hi sm:text-[4rem] lg:text-[5.25rem] xl:text-[92px] xl:leading-[92px] xl:tracking-[-3.22px]"
          >
            <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
              <span
                data-hero-line
                style={{ transform: "translateY(112%)" }}
                className="block will-change-transform text-hi"
              >
                Every face. Every gate.
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
              <span
                data-hero-line
                style={{ transform: "translateY(112%)" }}
                className="block will-change-transform text-shimmer-accent font-medium"
              >
                One campus.
              </span>
            </span>
          </h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-[560px] text-pretty text-[15px] sm:text-[16px] leading-[25.6px] text-mid"
          >
            Enterprise face recognition, rotating anti-proxy QR codes, and automated campus security
            alerts: one platform that verifies an entire campus in under 300ms.
          </motion.p>

          {/* Action pill buttons with interactive hover animation */}
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
            {onOpenDemo ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onOpenDemo}
                className="btn-pill-accent shadow-[0_0_24px_rgba(143,139,255,0.35)]"
              >
                <Sparkles className="h-4 w-4" />
                Request Campus Demo
              </motion.button>
            ) : null}
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              href={PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-pill-white group"
            >
              Go to Portal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              href="#how-it-works"
              className="btn-pill-outline"
            >
              Explore System
            </motion.a>
          </motion.div>

          {/* Metrics with subtle hover lift */}
          <motion.dl
            variants={item}
            className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-[var(--hairline)] pt-6"
          >
            {METRICS.map((metric) => (
              <motion.div
                whileHover={{ y: -2 }}
                key={metric.label}
                className="transition-colors"
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                  {metric.label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold tracking-tight text-hi flex items-baseline gap-1.5">
                  <span>{metric.value}</span>
                </dd>
                <dd className="text-[11px] font-mono text-mid/80">{metric.sub}</dd>
              </motion.div>
            ))}
          </motion.dl>

          {/* Scroll cue with smooth dip animation */}
          <div
            aria-hidden
            className="mt-10 flex items-center gap-2 text-faint"
            style={{ animation: "Hero_cueOut 1s var(--ease-in-out) 6s forwards" }}
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-[var(--hairline)] bg-surface shadow-sm"
              style={{ animation: "Hero_cueDip 2.2s var(--ease-in-out) infinite" }}
            >
              <ArrowDown className="h-3.5 w-3.5 text-mid" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Scroll to explore</span>
          </div>
        </motion.div>

        {/* Floating Hero Card with Radial Glow & Float */}
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative lg:pl-4"
        >
          {/* Card glow behind */}
          <div
            aria-hidden
            className="absolute inset-0 -inset-x-8 -inset-y-8 rounded-[36px] pointer-events-none opacity-90 card-glow-bg"
          />

          <div style={reduceMotion ? undefined : { animation: "Hero_float 8s cubic-bezier(0.22, 1, 0.36, 1) infinite" }}>
            <VerificationCard />
          </div>

          {/* Floating Liveness Chip */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
            className="absolute -right-4 top-12 hidden items-center gap-2.5 rounded-full border border-[var(--hairline-strong)] bg-[rgba(16,16,22,0.9)] px-4 py-2 backdrop-blur-md shadow-xl sm:flex animate-subtle-float"
          >
            <Activity className="h-3.5 w-3.5 text-spotify animate-pulse" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-hi font-medium">
              Liveness Gate · Online
            </span>
          </motion.div>

          {/* Floating Edge Node Chip */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.75 }}
            className="absolute -left-6 bottom-16 hidden items-center gap-2.5 rounded-full border border-[var(--hairline-strong)] bg-[rgba(16,16,22,0.9)] px-4 py-2 backdrop-blur-md shadow-xl sm:flex"
            style={{ animation: "DesktopSection_pipFloat 6.5s cubic-bezier(0.22, 1, 0.36, 1) infinite" }}
          >
            <Cpu className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mid">
              Edge ONNX · 192ms
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
