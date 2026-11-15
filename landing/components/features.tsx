"use client";

import type { ReactNode } from "react";
import {
  CloudOff,
  Fingerprint,
  Flame,
  QrCode,
  Radar,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const CELL =
  "relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-surface p-6 transition-colors duration-300 hover:border-white/[0.16]";

const TIERS = ["Bronze", "Silver", "Gold", "Inferno"];

const OFFLINE_POINTS = ["Local queue", "Auto-reconcile", "No lost records"];

function CellLabel({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">
      <Icon className="h-3.5 w-3.5 text-brand-300" strokeWidth={1.8} />
      {children}
    </p>
  );
}

export function Features() {
  return (
    <section
      id="features"
      className="relative scroll-mt-24 border-t border-white/[0.06] py-24 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Platform"
          title="Built for the gate, the classroom and the group chat."
          description="Six systems working as one: identity, session integrity, security escalation, habit, assistance and uptime."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-6">
          <Reveal className="lg:col-span-3">
            <div id="biometrics" className={`${CELL} h-full scroll-mt-28`}>
              <CellLabel icon={Fingerprint}>512-dim biometrics</CellLabel>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">
                ArcFace, embedded at the edge
              </h3>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-muted">
                Every enrollment becomes a 512-dimension vector. Recognition compares embeddings —
                never photographs — and returns a confidence score in milliseconds.
              </p>
              <div
                aria-hidden
                className="mt-6 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1"
              >
                {Array.from({ length: 64 }, (_, index) => (
                  <span
                    key={index}
                    className="aspect-square rounded-[2px] bg-brand-400"
                    style={{ opacity: 0.12 + (((index * 37) % 11) / 11) * 0.8 }}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
                <span>Vector · 512</span>
                <span className="text-emerald-300">Cosine 0.94</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="lg:col-span-3">
            <div className={`${CELL} h-full`}>
              <CellLabel icon={QrCode}>Anti-proxy QR</CellLabel>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">
                Codes that expire before they leak
              </h3>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-muted">
                Session tokens rotate on a 30-second drift window and are signed to the live class.
                A screenshot is useless by the time it reaches the group chat.
              </p>
              <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/30 p-3">
                <div className="flex items-center justify-between font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-faint">
                  <span>Session token</span>
                  <span className="text-emerald-300">Rotating</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <code className="font-mono text-lg tracking-[0.18em] text-ink">8F3A·2C91</code>
                  <span className="font-mono text-[10px] text-ink-faint">00:30</span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-brand-500 to-brand-300" />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-2">
            <div className={`${CELL} h-full`}>
              <CellLabel icon={Radar}>Sentinel</CellLabel>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                Active intruder alerts
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                Unknown faces are flagged with gate, timestamp and frame — before anyone walks in.
              </p>
              <div className="mt-auto pt-6">
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-400/20 bg-rose-500/[0.07] px-3 py-2.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                  <span className="flex-1 font-mono text-[9px] uppercase tracking-[0.1em] text-rose-200/80">
                    Unknown face · Gate C
                  </span>
                  <span className="font-mono text-[9px] text-rose-300/60">now</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.14} className="lg:col-span-2">
            <div className={`${CELL} h-full`}>
              <CellLabel icon={Flame}>Streaks</CellLabel>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                Bronze to Diamond Inferno
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                Attendance becomes a habit students actually protect — one clean check-in at a time.
              </p>
              <div className="mt-auto grid grid-cols-4 gap-1.5 pt-6">
                {TIERS.map((tier, index) => (
                  <span
                    key={tier}
                    className={`rounded-lg border px-1 py-2 text-center font-mono text-[8.5px] uppercase tracking-wider ${
                      index === TIERS.length - 1
                        ? "border-brand-400/40 bg-brand-500/15 text-brand-200"
                        : "border-white/[0.06] bg-white/[0.02] text-ink-faint"
                    }`}
                  >
                    {tier}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.18} className="lg:col-span-2">
            <div className={`${CELL} h-full`}>
              <CellLabel icon={Sparkles}>Nexa AI</CellLabel>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                A student assistant that knows
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                Ask about attendance, timetables and leave in plain language. Nexa answers from that
                student&apos;s own records.
              </p>
              <div className="mt-auto space-y-2 pt-6">
                <div className="ml-auto w-fit max-w-[92%] rounded-xl rounded-br-sm bg-brand-600/25 px-3 py-2 text-[11px] leading-snug text-brand-100">
                  Did I hit 90% this month?
                </div>
                <div className="w-fit max-w-[96%] rounded-xl rounded-bl-sm border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] leading-snug text-ink-muted">
                  You&apos;re at <span className="text-emerald-300">92.4%</span> — 3 sessions above
                  the threshold.
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.22} className="lg:col-span-6">
            <div className={`${CELL} h-full`}>
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <CellLabel icon={CloudOff}>Resilience</CellLabel>
                  <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                    Offline-first edge resiliency
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                    Verification runs at the gate. If the uplink drops, check-ins queue locally and
                    reconcile automatically when it returns — no lost attendance, no duplicates.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {OFFLINE_POINTS.map((point) => (
                    <span
                      key={point}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-muted"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
