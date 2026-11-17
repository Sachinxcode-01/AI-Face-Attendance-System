"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BrainCircuit, Gauge, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

const NOTES = [
  {
    icon: BrainCircuit,
    tag: "AI Biometrics",
    title: "ArcFace v2.4 calibration flow",
    body: "Five-angle enrollment capture with weak-enrollment flagging, so accuracy never hinges on one lucky photo.",
    meta: "Admin · calibration",
    accent: "rgba(143, 139, 255, 0.2)",
  },
  {
    icon: Gauge,
    tag: "Performance",
    title: "Sub-300ms gate verification",
    body: "Quantized ONNX runtime on the edge node now verifies a full face in under 300ms, queue-free at 8:00 AM.",
    meta: "Edge node · ONNX",
    accent: "rgba(111, 216, 255, 0.2)",
  },
  {
    icon: ShieldCheck,
    tag: "Security",
    title: "Sentinel intruder escalation",
    body: "Unknown faces escalate to security with gate, timestamp and frame before anyone walks in, not after.",
    meta: "Sentinel · alerts",
    accent: "rgba(30, 215, 96, 0.2)",
  },
];

export function Release() {
  return (
    <section
      id="release"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="Release 2.4"
              title="The biggest update since launch."
              description="Calibration, speed and escalation: rebuilt end to end, rolled out to every campus on the same night."
            />
            <Reveal delay={0.15}>
              <motion.a
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                href="#faq"
                className="mt-8 btn-pill-glass group"
              >
                <span>Read the full changelog</span>
                <ArrowUpRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </motion.a>
            </Reveal>
          </div>

          <div className="space-y-4">
            {NOTES.map((note, index) => {
              const Icon = note.icon;
              return (
                <Reveal key={note.title} delay={index * 0.08} direction="up" distance={20}>
                  <SpotlightCard
                    spotlightColor={note.accent}
                    enableTilt
                    className="flex gap-5 p-6 sm:p-7"
                  >
                    <motion.span
                      whileHover={{ scale: 1.1, rotate: 6 }}
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent transition-colors duration-300 group-hover:text-white group-hover:border-accent/40"
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </motion.span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip-bytune h-6 text-[10px] px-2.5 font-mono">
                          {note.tag}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                          {note.meta}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-[20px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                        {note.title}
                      </h3>
                      <p className="mt-2 text-[14.5px] leading-[23.9px] text-mid">
                        {note.body}
                      </p>
                    </div>
                  </SpotlightCard>
                </Reveal>
              );
            })}

            {/* Release 2.4 Performance & Calibration Telemetry Panel */}
            <Reveal delay={0.25} direction="up" distance={20}>
              <div className="relative overflow-hidden rounded-[22px] border border-[var(--hairline-strong)] bg-bg0 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
                <div aria-hidden className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

                <div className="relative">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
                      </span>
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-hi">
                        ArcFace v2.4 Benchmark Specs
                      </span>
                    </div>
                    <span className="chip-bytune h-6 text-[10px] text-accent border-accent/30 bg-accent/10 font-semibold uppercase">
                      ONNX Quantized INT8
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-[14px] border border-white/5 bg-white/[0.02] p-3.5 text-left transition-colors hover:border-white/15"
                    >
                      <span className="font-mono text-[9.5px] uppercase tracking-wider text-faint">
                        Inference Speed
                      </span>
                      <p className="mt-1 font-display text-lg font-semibold text-hi">192ms</p>
                      <span className="font-mono text-[9px] text-spotify">Sub-300ms SLA</span>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-[14px] border border-white/5 bg-white/[0.02] p-3.5 text-left transition-colors hover:border-white/15"
                    >
                      <span className="font-mono text-[9.5px] uppercase tracking-wider text-faint">
                        Cosine Threshold
                      </span>
                      <p className="mt-1 font-display text-lg font-semibold text-hi">0.94</p>
                      <span className="font-mono text-[9px] text-mid">High Precision</span>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-[14px] border border-white/5 bg-white/[0.02] p-3.5 text-left transition-colors hover:border-white/15"
                    >
                      <span className="font-mono text-[9.5px] uppercase tracking-wider text-faint">
                        Vector Dimension
                      </span>
                      <p className="mt-1 font-display text-lg font-semibold text-hi">512-dim</p>
                      <span className="font-mono text-[9px] text-accent">ArcFace ResNet</span>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-[14px] border border-white/5 bg-white/[0.02] p-3.5 text-left transition-colors hover:border-white/15"
                    >
                      <span className="font-mono text-[9.5px] uppercase tracking-wider text-faint">
                        Liveness Depth
                      </span>
                      <p className="mt-1 font-display text-lg font-semibold text-hi">RGB+IR</p>
                      <span className="font-mono text-[9px] text-spotify">Anti-Spoof active</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
