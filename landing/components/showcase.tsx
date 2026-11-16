"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BellRing, CheckCircle2, Eye, MapPin, QrCode, ScanFace, Users } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

type Screen = {
  key: string;
  tab: string;
  title: string;
  body: string;
  meta: string;
};

const SCREENS: Screen[] = [
  {
    key: "kiosk",
    tab: "Gate kiosk",
    title: "The gate, thinking for itself.",
    body: "A camera, a browser and a rotating code. The kiosk verifies, stamps and waves students through: no phone swipe, no queue, no proxy.",
    meta: "Edge node · <300ms",
  },
  {
    key: "roster",
    tab: "Teacher roster",
    title: "Take attendance without taking time.",
    body: "The session opens itself, the roster fills itself, and exceptions surface as a short list instead of a 40-minute argument.",
    meta: "Live roster · auto-sync",
  },
  {
    key: "parent",
    tab: "Parent alert",
    title: "The moment they arrive, you know.",
    body: "Timestamp, gate and confidence score, pushed to the parent's phone before their child reaches the classroom door.",
    meta: "Push + email · instant",
  },
];

/* ---------- CSS-built product screens (swap for real captures pre-launch) ---------- */

function KioskScreen() {
  return (
    <div className="flex h-full flex-col bg-bg1">
      <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1ed760]" />
          Gate B · Kiosk
        </span>
        <span className="font-mono text-[9px] text-faint">07:58:12</span>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg0">
        <img
          src="/mobile-screen.png"
          alt="SmartFace kiosk verification"
          className="absolute inset-0 h-full w-full object-cover object-top opacity-60"
        />
        <div aria-hidden className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-10 top-1/2 h-20 -translate-y-1/2 text-[#1ed760]">
          {
            ["left-0 top-0 rounded-tl-sm border-l-2 border-t-2", "right-0 top-0 rounded-tr-sm border-r-2 border-t-2", "bottom-0 left-0 rounded-bl-sm border-b-2 border-l-2", "bottom-0 right-0 rounded-br-sm border-b-2 border-r-2"].map(
              (c) => (
                <span key={c} aria-hidden className={`absolute h-6 w-6 border-current ${c}`} />
              ),
            )
          }
        </div>
      </div>
      <div className="space-y-2.5 border-t border-[var(--hairline)] p-4">
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
          <span>Subject A-1942</span>
          <span className="text-[#9fe0b6]">Match 99.4%</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-mid">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#1ed760]" />
          Attendance stamped · 07:58 · Gate B
        </div>
      </div>
    </div>
  );
}

function RosterScreen() {
  const rows = [
    { name: "A. Sharma", status: "Verified", ok: true },
    { name: "M. Okafor", status: "Verified", ok: true },
    { name: "L. Petrova", status: "Verified", ok: true },
    { name: "R. Iyer", status: "Proxy blocked", ok: false },
    { name: "D. Kim", status: "Verified", ok: true },
  ];
  return (
    <div className="flex h-full flex-col bg-bg1">
      <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          <Users className="h-3 w-3 text-accent" />
          CS-204 · Period 2
        </span>
        <span className="font-mono text-[9px] text-[#9fe0b6]">31/32 present</span>
      </div>
      <div className="flex-1 space-y-1.5 p-4">
        {rows.map((row) => (
          <div
            key={row.name}
            className="flex items-center justify-between rounded-lg border border-[var(--hairline)] bg-white/[0.02] px-3 py-2"
          >
            <span className="text-[11.5px] text-hi">{row.name}</span>
            <span
              className={`font-mono text-[8.5px] uppercase tracking-[0.1em] ${row.ok ? "text-[#9fe0b6]" : "text-rose-300"
                }`}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--hairline)] p-3.5">
        <div className="flex items-center gap-2 font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">
          <QrCode className="h-3 w-3 text-accent" />
          Token rotates in 00:14
        </div>
      </div>
    </div>
  );
}

function ParentScreen() {
  return (
    <div className="flex h-full flex-col bg-bg1">
      <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          <BellRing className="h-3 w-3 text-accent" />
          Parent app
        </span>
        <span className="font-mono text-[9px] text-faint">Now</span>
      </div>
      <div className="flex-1 p-4">
        <div className="rounded-xl border border-[var(--hairline)] bg-white/[0.03] p-4">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-faint">
            Arrival confirmed
          </p>
          <p className="mt-2 font-display text-[15px] font-medium text-hi">
            Aarav Sharma reached Gate B
          </p>
          <p className="mt-1 text-[11.5px] text-mid">
            07:58 AM · Confidence 99.4% · Liveness passed
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Gate B", "On time", "Streak 14"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[var(--hairline)] bg-white/[0.03] px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-mid"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#1ed760]/20 bg-[#1ed760]/[0.06] px-3 py-2.5">
          <MapPin className="h-3.5 w-3.5 text-[#9fe0b6]" />
          <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-[#9fe0b6]">
            North campus · main gate
          </span>
        </div>
      </div>
    </div>
  );
}

const SCREEN_COMPONENTS = {
  kiosk: KioskScreen,
  roster: RosterScreen,
  parent: ParentScreen,
} as const;

/* ------------------------------ Section ------------------------------ */

export function Showcase() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % SCREENS.length), 4200);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [reduceMotion]);

  const screen = SCREENS[index];
  const Active = SCREEN_COMPONENTS[screen.key as keyof typeof SCREEN_COMPONENTS];

  return (
    <section id="showcase" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-28">
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          title="The whole campus, one screen at a time."
          description="Three roles, one living record. Watch the session move from gate to roster to parent's pocket without anyone lifting a finger."
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Screen switcher */}
          <div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Product screens">
              {SCREENS.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={index === i}
                  onClick={() => setIndex(i)}
                  className={`rounded-md border px-3.5 py-1.5 text-xs font-medium transition ${index === i
                    ? "border-accent/40 bg-accent/10 text-hi"
                    : "border-[var(--hairline)] bg-surface text-mid hover:text-hi"
                    }`}
                >
                  {s.tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={screen.key}
                initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="mt-8 font-display text-[1.6rem] font-medium leading-tight tracking-[-0.02em] text-hi sm:text-[2rem]">
                  {screen.title}
                </h3>
                <p className="mt-4 max-w-[563.2px] text-pretty text-[15px] leading-relaxed text-mid">
                  {screen.body}
                </p>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                  {screen.meta}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex gap-1.5" aria-hidden>
              {SCREENS.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  aria-label={`Show ${s.tab}`}
                  onClick={() => setIndex(i)}
                  className={`h-1 rounded-sm transition-all duration-300 ${index === i ? "w-8 bg-accent" : "w-3 bg-white/15 hover:bg-white/25"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Device frame */}
          <Reveal delay={0.1}>
            <div className="relative mx-auto w-full max-w-[440px]">
              <div className="relative rounded-lg border border-[var(--hairline)] bg-surface p-2 shadow-sm">
                <div className="overflow-hidden rounded-md border border-[var(--hairline)]">
                  <div className="relative aspect-[4/4.4]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={screen.key}
                        className="absolute inset-0"
                        initial={reduceMotion ? undefined : { opacity: 0, scale: 0.985 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 1.01 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Active />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div
                className="absolute -left-3 top-10 hidden items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-panel px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-mid sm:flex"
                style={{ animation: "Hero_float 6.5s var(--ease-in-out) 0.8s infinite" }}
              >
                <Eye className="h-3 w-3 text-accent" />
                2,418 faces indexed
              </div>
              <div
                className="absolute -right-3 bottom-12 hidden items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-panel px-3 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-mid sm:flex"
                style={{ animation: "Hero_float 7s var(--ease-in-out) 1.6s infinite" }}
              >
                <ScanFace className="h-3 w-3 text-[#1ed760]" />
                Liveness on
              </div>
            </div>
          </Reveal>
        </div>
  </div >
</section >
  );
}
