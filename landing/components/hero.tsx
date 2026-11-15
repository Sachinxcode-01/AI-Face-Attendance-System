"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ArrowDown, ArrowRight, Activity, Radio } from "lucide-react";
import { PORTAL_URL } from "@/lib/constants";
import { VerificationCard } from "./verification-card";

const METRICS = [
  { value: "99.8%", label: "Recognition accuracy" },
  { value: "<300ms", label: "Verify latency" },
  { value: "512-d", label: "ArcFace embedding" },
];

const HEADLINE = [
  { text: "Every face. Every gate.", className: "text-hi" },
  { text: "One campus.", className: "text-gradient" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
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
      className="badge-pill inline-flex items-center gap-2.5 border border-[var(--hairline)] bg-[var(--glass)] backdrop-blur-md"
      style={{ animation: "Hero_cueFade 0.9s var(--ease-out) 1.15s both" }}
    >
      <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden>
        {[0, 1, 2, 3].map((bar) => (
          <span
            key={bar}
            className="w-[2.5px] origin-bottom rounded-full bg-[#1ed760]"
            style={{
              height: "100%",
              animation: `LiveCount_eq 1.05s var(--ease-in-out) ${bar * 0.14}s infinite`,
            }}
          />
        ))}
      </span>
      <span className="font-mono text-[11px] tabular-nums tracking-wide text-mid">
        <span className="text-hi">{count.toLocaleString("en-US")}</span> verifications today
      </span>
      <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
      <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#9fe0b6] sm:flex">
        <Radio className="h-3 w-3" /> Live
      </span>
    </div>
  );
}

export function Hero() {
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
    <section id="top" className="relative overflow-hidden pb-24 pt-32 sm:pt-40 lg:pb-32">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-22rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-accent/15 blur-[150px]" />
        <div className="absolute right-[-12rem] top-40 h-[26rem] w-[26rem] rounded-full bg-accent2/10 blur-[130px]" />
        <div className="absolute bottom-[-14rem] left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#1ed760]/[0.05] blur-[140px]" />
        <div className="absolute inset-0 bg-grid mask-radial opacity-[0.35]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[var(--wide)] items-center gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8">
        <motion.div variants={container} initial={reduceMotion ? "show" : "hidden"} animate="show">
          <LiveCount />

          <h1
            ref={headlineRef}
            className="mt-7 font-display text-[2.85rem] font-medium leading-[1.02] tracking-[-0.035em] text-hi sm:text-[4.2rem] xl:text-[5.75rem]"
          >
            {HEADLINE.map((line) => (
              <span key={line.text} className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
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
            className="mt-7 max-w-[563.2px] text-pretty text-[16px] leading-[25.6px] text-mid"
          >
            Enterprise face recognition, rotating anti-proxy QR codes, and automated campus security
            alerts — one platform that verifies an entire campus in under 300ms.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              className="group button-primary inline-flex h-12 items-center justify-center gap-2 px-6 transition-colors duration-200 hover:bg-[var(--glass-strong)]"
            >
              Go to Portal
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[999px] border border-[var(--hairline)] bg-transparent px-6 text-[15px] font-medium text-mid transition duration-200 hover:border-[var(--hairline-strong)] hover:text-hi"
            >
              Explore How It Works
              <ArrowDown className="h-4 w-4 text-faint" />
            </a>
          </motion.div>

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

          {/* Scroll cue */}
          <div
            aria-hidden
            className="mt-10 flex items-center gap-2 text-faint"
            style={{ animation: "Hero_cueOut 1s var(--ease-in-out) 4.5s forwards" }}
          >
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-[var(--hairline)]"
              style={{ animation: "Hero_cueDip 2.2s var(--ease-in-out) infinite" }}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Scroll</span>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative lg:pl-6"
          style={{ animation: "Hero_float 7s var(--ease-in-out) infinite" }}
        >
          <VerificationCard />

          {/* Floating liveness chip */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.55 }}
            className="absolute -right-2 top-8 hidden items-center gap-2 rounded-full border border-[var(--hairline)] bg-panel/80 px-3.5 py-2 backdrop-blur-xl sm:flex"
            style={{ animation: "Hero_float 6s var(--ease-in-out) 1.2s infinite" }}
          >
            <Activity className="h-3.5 w-3.5 text-[#1ed760]" />
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mid">
              Liveness gate · online
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
