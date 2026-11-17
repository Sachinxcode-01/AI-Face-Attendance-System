"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BellRing, CheckCircle2, QrCode, ScanFace, Users, Wifi } from "lucide-react";
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

/* ---------- Product screen simulations with high-tech animations ---------- */

function KioskScreen() {
  return (
    <div className="flex h-full flex-col bg-bg1">
      <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
          </span>
          Gate B · Kiosk Live Feed
        </span>
        <span className="font-mono text-[9.5px] text-faint">07:58:12</span>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-bg0">
        <img
          src="/hero-verification.jpg"
          alt="SmartFace kiosk verification"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-75 filter brightness-95"
        />
        <div aria-hidden className="absolute inset-0 bg-black/40" />

        {/* Live scanning line */}
        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#6fd8ff] to-transparent shadow-[0_0_12px_#6fd8ff] animate-laser-scan pointer-events-none" />

        {/* HUD Box */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex flex-col items-center gap-2"
        >
          <div className="rounded-full border border-spotify/40 bg-bg0/90 px-4 py-1.5 font-mono text-xs text-[#9fe0b6] backdrop-blur-md shadow-lg flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-spotify" />
            <span>Verification PASS · 99.8%</span>
          </div>
          <span className="font-mono text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded">
            Subject STU-88219 · Alex Rivera
          </span>
        </motion.div>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--hairline)] bg-[rgba(16,16,22,0.7)] px-5 py-3 font-mono text-[10.5px] text-mid">
        <span className="flex items-center gap-2">
          <ScanFace className="h-3.5 w-3.5 text-spotify" />
          Alex Rivera · CS-301
        </span>
        <span className="text-spotify font-medium flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          192ms
        </span>
      </div>
    </div>
  );
}

function RosterScreen() {
  const students = [
    { name: "Alex Rivera", roll: "CS-001", time: "07:58:12", status: "Verified" },
    { name: "Elena Rostova", roll: "CS-002", time: "07:58:24", status: "Verified" },
    { name: "Marcus Chen", roll: "CS-003", time: "07:59:01", status: "Verified" },
    { name: "Sophia Patel", roll: "CS-004", time: "07:59:15", status: "Verified" },
    { name: "Liam Vance", roll: "CS-005", time: "—", status: "Absent" },
  ];

  return (
    <div className="flex h-full flex-col bg-bg1">
      <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
          <Users className="h-3.5 w-3.5 text-accent" />
          CS-301 · Live Roster
        </span>
        <span className="rounded-full bg-spotify/15 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-spotify font-semibold">
          4 / 5 Present
        </span>
      </div>

      <div className="flex-1 divide-y divide-[var(--hairline)] overflow-y-auto px-5 py-2">
        {students.map((s, idx) => (
          <motion.div
            key={s.roll}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="flex items-center justify-between py-2.5 text-xs hover:bg-white/[0.02] px-1 rounded transition-colors"
          >
            <div>
              <p className="font-medium text-hi">{s.name}</p>
              <p className="font-mono text-[10px] text-faint">{s.roll}</p>
            </div>
            <div className="text-right">
              <span
                className={`font-mono text-[11px] font-semibold flex items-center justify-end gap-1 ${
                  s.status === "Verified" ? "text-spotify" : "text-amber"
                }`}
              >
                {s.status === "Verified" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-spotify" />
                )}
                {s.status}
              </span>
              <p className="font-mono text-[10px] text-faint">{s.time}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-[var(--hairline)] bg-[rgba(16,16,22,0.7)] px-5 py-3 text-center font-mono text-[10px] text-faint">
        Auto-synced with Campus ERP
      </div>
    </div>
  );
}

function ParentScreen() {
  return (
    <div className="flex h-full flex-col bg-bg1">
      <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
        <span className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
          <BellRing className="h-3.5 w-3.5 text-accent" />
          Parent Notification
        </span>
        <span className="font-mono text-[9.5px] text-[#9fe0b6]">Push · Instant</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        {/* Animated Pop Card */}
        <motion.div
          initial={{ scale: 0.92, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface/90 p-5 shadow-2xl backdrop-blur-md"
        >
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-spotify/15 text-spotify mb-3 shadow-[0_0_15px_rgba(30,215,96,0.25)]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="font-display text-base font-semibold text-hi">
            Alex Rivera checked in
          </h4>
          <p className="mt-1.5 text-xs text-mid">
            Campus Main Gate B · Stamped at 07:58 AM with 99.8% verification confidence.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 font-mono text-[10.5px] text-mid">
            <span className="h-1.5 w-1.5 rounded-full bg-spotify animate-pulse" />
            SMS & Push dispatched in 0.8s
          </div>
        </motion.div>
      </div>

      <div className="border-t border-[var(--hairline)] bg-[rgba(16,16,22,0.7)] px-5 py-3 text-center font-mono text-[10px] text-faint">
        End-to-End Encrypted Delivery
      </div>
    </div>
  );
}

const SCREEN_COMPONENTS = {
  kiosk: KioskScreen,
  roster: RosterScreen,
  parent: ParentScreen,
};

export function Showcase() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const screen = SCREENS[index];
  const Active = SCREEN_COMPONENTS[screen.key as keyof typeof SCREEN_COMPONENTS];

  return (
    <section
      id="showcase"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Interactive Experience"
          title="The whole campus, one screen at a time."
          description="Three roles, one living record. Watch the session move from gate to roster to parent's pocket without anyone lifting a finger."
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Screen switcher */}
          <div>
            <div className="flex flex-wrap gap-2 relative" role="tablist" aria-label="Product screens">
              {SCREENS.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={index === i}
                  onClick={() => setIndex(i)}
                  className={`chip-bytune relative transition-all duration-300 ${
                    index === i ? "text-hi bg-white/10 border-white/20" : "text-mid"
                  }`}
                >
                  {index === i && (
                    <motion.span
                      layoutId="showcaseActiveTab"
                      className="absolute inset-0 rounded-full bg-white text-[#0a0a0c] -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className={index === i ? "text-[#0a0a0c] font-semibold" : ""}>
                    {s.tab}
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={screen.key}
                initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="mt-8 font-display text-[26px] sm:text-[32px] font-medium leading-tight tracking-[-0.025em] text-hi">
                  {screen.title}
                </h3>
                <p className="mt-4 max-w-[560px] text-pretty text-[15px] sm:text-[16px] leading-[26px] text-mid">
                  {screen.body}
                </p>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-accent font-semibold">
                  {screen.meta}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Device frame styled with ByTune card-bytune recipe */}
          <Reveal delay={0.1} direction="right" duration={0.8}>
            <div className="relative mx-auto w-full max-w-[450px]">
              {/* Radial glow */}
              <div
                aria-hidden
                className="absolute inset-0 -inset-x-6 -inset-y-6 rounded-[36px] pointer-events-none opacity-80 card-glow-bg animate-glow-breathe"
              />

              <div className="relative card-bytune p-3 shadow-2xl backdrop-blur-xl">
                <div className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-bg0">
                  <div className="relative aspect-[4/4.3]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={screen.key}
                        className="absolute inset-0"
                        initial={reduceMotion ? undefined : { opacity: 0, scale: 0.985 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Active />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
