"use client";

import { CloudOff, Fingerprint, Flame, QrCode, Radar, Sparkles, type LucideIcon } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const CELL =
  "relative flex flex-col overflow-hidden rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-6 transition-colors duration-300 hover:border-[var(--hairline-strong)]";

const TIERS = ["Bronze", "Silver", "Gold", "Inferno"];

const OFFLINE_POINTS = ["Local queue", "Auto-reconcile", "No lost records"];

function CellLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
      <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.8} />
      {children}
    </p>
  );
}

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          title="Everything attendance needs. Nothing it doesn't."
          description="Six systems working as one: identity, session integrity, security escalation, habit, assistance and uptime."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-6">
          <Reveal className="lg:col-span-3">
            <div id="biometrics" className={`${CELL} h-full scroll-mt-28`}>
              <CellLabel icon={Fingerprint}>512-dim biometrics</CellLabel>
              <h3 className="mt-4 font-display text-xl font-medium tracking-tight text-hi">
                ArcFace, embedded at the edge
              </h3>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-mid">
                Every enrollment becomes a 512-dimension vector. Recognition compares embeddings,
                never photographs, and returns a confidence score in milliseconds.
              </p>
              <div
                aria-hidden
                className="mt-6 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1"
              >
                {Array.from({ length: 64 }, (_, index) => (
                  <span
                    key={index}
                    className="aspect-square rounded-[2px] bg-accent"
                    style={{ opacity: 0.12 + (((index * 37) % 11) / 11) * 0.8 }}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                <span>Vector · 512</span>
                <span className="text-[#9fe0b6]">Cosine 0.94</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="lg:col-span-3">
            <div className={`${CELL} h-full`}>
              <CellLabel icon={QrCode}>Anti-proxy QR</CellLabel>
              <h3 className="mt-4 font-display text-xl font-medium tracking-tight text-hi">
                Codes that expire before they leak
              </h3>
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-mid">
                Session tokens rotate on a 30-second drift window and are signed to the live class.
                A screenshot is useless by the time it reaches the group chat.
              </p>
                <div className="mt-6 rounded-md border border-[var(--hairline)] bg-black/30 p-3">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                    <span>Session token</span>
                    <span className="text-[#9fe0b6]">Rotating</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <code className="font-mono text-lg tracking-[0.18em] text-hi">8F3A·2C91</code>
                    <span className="font-mono text-[10px] text-faint">00:30</span>
                  </div>
                    <div className="mt-3 h-1 overflow-hidden rounded-sm bg-white/[0.06]">
                      <div className="h-full w-2/3 rounded-sm bg-accent" />
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.1} className="lg:col-span-2">
                <div className={`${CELL} h-full`}>
                  <CellLabel icon={Radar}>Sentinel</CellLabel>
                  <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-hi">
                    Active intruder alerts
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-mid">
                    Unknown faces are flagged with gate, timestamp and frame before anyone walks in.
                  </p>
                  <div className="mt-auto pt-6">
                      <div className="flex items-center gap-2.5 rounded-md border border-rose-400/20 bg-rose-500/[0.07] px-3 py-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
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
                  <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-hi">
                    Bronze to Diamond Inferno
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-mid">
                    Attendance becomes a habit students actually protect, one clean check-in at a time.
                  </p>
                  <div className="mt-auto grid grid-cols-4 gap-1.5 pt-6">
                    {TIERS.map((tier, index) => (
                      <span
                        key={tier}
                        className={`rounded-md border px-2 py-1 text-center font-mono text-[10.5px] uppercase tracking-wider transition ${
                          index === 2
                            ? "border-accent/40 bg-accent/15 text-accent"
                            : "border-white/[0.06] bg-white/[0.02] text-faint"
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
              <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-hi">
                A student assistant that knows
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mid">
                Ask about attendance, timetables and leave in plain language. Nexa answers from that
                student's own records.
              </p>
              <div className="mt-auto space-y-2 pt-6">
                <div className="ml-auto w-fit max-w-[92%] rounded-md bg-accent/25 px-3 py-2 text-[11px] leading-snug text-[#d6d4ff]">
                  Did I hit 90% this month?
                </div>
                <div className="w-fit max-w-[96%] rounded-md border border-[var(--hairline)] bg-white/[0.03] px-3 py-2 text-[11px] leading-snug text-mid">
                  You&apos;re at <span className="text-[#9fe0b6]">92.4%</span>: 3 sessions above the
                  threshold.
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.22} className="lg:col-span-6">
            <div className={`${ CELL } h - full`}>
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <CellLabel icon={CloudOff}>Resilience</CellLabel>
                  <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-hi">
                    Offline-first edge resiliency
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-mid">
                    Verification runs at the gate. If the uplink drops, check-ins queue locally and
                    reconcile automatically when it returns: no lost attendance, no duplicates.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {OFFLINE_POINTS.map((point) => (
                    <span
                      key={point}
                      className="rounded-md border border-[var(--hairline)] bg-white/[0.02] px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-mid"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div >
      </div >
    </section >
  );
}
