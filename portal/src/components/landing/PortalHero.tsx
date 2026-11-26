"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ArrowDown, ArrowRight, LogIn, Shield, UserPlus } from "lucide-react";
import { VerificationCard } from "./VerificationCard";

const TELEMETRY = [
  { value: "512-D", label: "Embeddings", sub: "ArcFace buffalo_l (R50)" },
  { value: "0.60", label: "Threshold", sub: "Configurable cosine" },
  { value: "20s", label: "QR Window", sub: "HMAC-SHA256 + 5s skew" },
  { value: "5 Roles", label: "Unified RBAC", sub: "Web, API & mobile" },
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

function LiveEngineBadge() {
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
        <span className="text-hi font-medium">{count.toLocaleString("en-US")}</span> simulated demo check-ins
      </span>
      <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
      <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#9fe0b6] sm:flex">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
        </span>
        Unified Engine
      </span>
    </motion.div>
  );
}

export function PortalHero() {
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
    <section id="top" className="relative overflow-hidden pb-20 pt-28 sm:pt-36 lg:pb-28">
      {/* Ambient ByTune Space Glows */}
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

      <div className="relative mx-auto grid w-full max-w-[var(--wide)] items-start gap-12 px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:px-8">
        <motion.div variants={container} initial={reduceMotion ? "show" : "hidden"} animate="show">
          <div className="flex flex-wrap items-center gap-3">
            <LiveEngineBadge />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-wider text-emerald-300">
              <Shield className="h-3 w-3 text-emerald-400" />
              512-D Vector Privacy
            </span>
          </div>

          <h1
            ref={headlineRef}
            className="mt-6 font-display text-[2.75rem] font-medium leading-[1.02] tracking-[-0.035em] text-hi sm:text-[3.75rem] lg:text-[4.5rem] xl:text-[78px] xl:leading-[82px] xl:tracking-[-2.8px]"
          >
            <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
              <span
                data-hero-line
                style={{ transform: "translateY(112%)" }}
                className="block will-change-transform text-hi"
              >
                Biometric precision
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
              <span
                data-hero-line
                style={{ transform: "translateY(112%)" }}
                className="block will-change-transform text-shimmer-accent font-medium"
              >
                without roll call delays.
              </span>
            </span>
          </h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-[580px] text-pretty text-[15px] sm:text-[16px] leading-[25.6px] text-mid"
          >
            SmartFace replaces manual paper sign-ins with InsightFace ArcFace (buffalo_l, ResNet-50) 512-dimensional embeddings, 20-second rotating HMAC-SHA256 QR tokens, and synchronized portals for students, faculty, administrators, super admins, and parents.
          </motion.p>

          {/* Portal Actions */}
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3.5">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              href="#role-gateway"
              className="btn-pill-accent h-[48px] px-6 text-[14px] font-semibold flex items-center gap-2 shadow-[0_0_28px_rgba(143,139,255,0.4)]"
            >
              <span>Launch Role Portals</span>
              <ArrowRight className="h-4 w-4" />
            </motion.a>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/auth/login"
                className="btn-pill-glass h-[48px] px-6 text-[14px] font-medium flex items-center gap-2 border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-hi"
              >
                <LogIn className="h-4 w-4 text-accent" />
                <span>Sign In</span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/auth/register"
                className="btn-pill-outline h-[48px] px-5 text-[13.5px] font-medium flex items-center gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5 text-spotify" />
                <span>Create Account</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Portal Telemetry Row */}
          <motion.dl
            variants={item}
            className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-[var(--hairline)] pt-6"
          >
            {TELEMETRY.map((metric) => (
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

          {/* Scroll cue */}
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
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Scroll to explore portal</span>
          </div>
        </motion.div>

        {/* Right Column: Live Verification Card with ByTune Radial Glow */}
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative w-full lg:pt-1"
        >
          <div
            aria-hidden
            className="absolute inset-0 -inset-x-6 -inset-y-6 rounded-[36px] pointer-events-none opacity-85 card-glow-bg"
          />
          <div className="relative">
            <VerificationCard />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
