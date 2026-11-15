"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { PORTAL_URL } from "@/lib/constants";
import { VerificationCard } from "./verification-card";

const METRICS = [
  { value: "99.8%", label: "Recognition accuracy" },
  { value: "<300ms", label: "Verify latency" },
  { value: "512-d", label: "ArcFace embedding" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-32 sm:pt-36 lg:pb-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-20rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[150px]" />
        <div className="absolute right-[-12rem] top-40 h-[26rem] w-[26rem] rounded-full bg-brand-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-grid mask-radial opacity-[0.35]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-8">
        <motion.div variants={container} initial={reduceMotion ? "show" : "hidden"} animate="show">
          <motion.p
            variants={item}
            className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5"
          >
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-[12.5px] text-ink-muted">ArcFace v2.4 Live</span>
            <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-300/90">
              99.8% sub-second recognition
            </span>
          </motion.p>

          <h1 className="mt-6 font-display text-[2.7rem] font-extrabold leading-[1.04] tracking-[-0.035em] sm:text-[3.5rem] xl:text-[4.05rem]">
            <motion.span variants={item} className="block text-ink">
              Touchless Biometric Attendance.
            </motion.span>
            <motion.span variants={item} className="block text-ink-muted">
              Zero Proxies.
            </motion.span>
            <motion.span
              variants={item}
              className="block bg-gradient-to-r from-brand-300 via-brand-400 to-emerald-300 bg-clip-text text-transparent"
            >
              Instant Proof.
            </motion.span>
          </h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-pretty text-[15.5px] leading-relaxed text-ink-muted sm:text-base"
          >
            Enterprise face recognition, rotating anti-proxy QR codes, and automated campus security
            alerts.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-6 text-[14.5px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(79,70,229,0.9)] transition hover:brightness-110"
            >
              Go to Portal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 text-[14.5px] font-medium text-ink transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Explore How It Works
              <ArrowDown className="h-4 w-4 text-ink-faint" />
            </a>
          </motion.div>

          <motion.dl
            variants={item}
            className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/[0.06] pt-6"
          >
            {METRICS.map((metric) => (
              <div key={metric.label}>
                <dt className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">
                  {metric.label}
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                  {metric.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="relative lg:pl-6"
        >
          <VerificationCard />
        </motion.div>
      </div>
    </section>
  );
}
