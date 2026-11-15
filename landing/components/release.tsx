import { ArrowUpRight, BrainCircuit, Gauge, ShieldCheck } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const NOTES = [
  {
    icon: BrainCircuit,
    tag: "AI Biometrics",
    title: "ArcFace v2.4 calibration flow",
    body: "Five-angle enrollment capture with weak-enrollment flagging, so accuracy never hinges on one lucky photo.",
    meta: "Admin · calibration",
  },
  {
    icon: Gauge,
    tag: "Performance",
    title: "Sub-300ms gate verification",
    body: "Quantized ONNX runtime on the edge node now verifies a full face in under 300ms — queue-free at 8:00 AM.",
    meta: "Edge node · ONNX",
  },
  {
    icon: ShieldCheck,
    tag: "Security",
    title: "Sentinel intruder escalation",
    body: "Unknown faces escalate to security with gate, timestamp and frame — before anyone walks in, not after.",
    meta: "Sentinel · alerts",
  },
];

export function Release() {
  return (
    <section id="release" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-28">
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="Release 2.4"
              title="The biggest update since launch."
              description="Calibration, speed and escalation — rebuilt end to end, rolled out to every campus on the same night."
            />
            <Reveal delay={0.15}>
              <a
                href="#faq"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--glass)] px-5 py-3 text-[14px] font-medium text-hi backdrop-blur-md transition duration-200 hover:border-[var(--hairline-strong)] hover:bg-[var(--glass-strong)]"
              >
                Read the full changelog
                <ArrowUpRight className="h-4 w-4 text-accent" />
              </a>
            </Reveal>
          </div>

          <div className="space-y-4">
            {NOTES.map((note, index) => {
              const Icon = note.icon;
              return (
                <Reveal key={note.title} delay={index * 0.08}>
                  <article className="glass-card group flex gap-5 transition-transform duration-300 hover:-translate-y-0.5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-accent transition-colors duration-300 group-hover:text-accent2">
                      <Icon className="h-5 w-5" strokeWidth={1.7} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[var(--hairline)] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-mid">
                          {note.tag}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                          {note.meta}
                        </span>
                      </div>
                      <h3 className="mt-2.5 font-display text-[19px] font-medium tracking-tight text-hi">
                        {note.title}
                      </h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-mid">{note.body}</p>
                    </div>
                  </article>
                </Reveal>
              );
            })}

            {/* Release 2.4 Performance & Calibration Telemetry Panel */}
            <Reveal delay={0.24}>
                      <div className="relative overflow-hidden rounded-[22px] border border-[var(--hairline-strong)] bg-bg0/90 shadow-2xl p-6 sm:p-7">
                        <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl"
                        />

                        <div className="relative">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                            <div className="flex items-center gap-2.5">
                              <span className="h-2 w-2 rounded-full bg-[#1ed760] shadow-[0_0_8px_#1ed760]" />
                              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-hi">
                                ArcFace v2.4 Benchmark Specs
                              </span>
                            </div>
                            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] text-accent font-semibold uppercase">
                              ONNX Quantized INT8
                            </span>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-faint">
                                Inference Speed
                              </span>
                              <p className="mt-1 font-display text-lg font-semibold text-hi">&lt; 280ms</p>
                              <span className="text-[10px] text-[#9fe0b6]">P99 verified</span>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-faint">
                                RAM Footprint
                              </span>
                              <p className="mt-1 font-display text-lg font-semibold text-hi">48 MB</p>
                              <span className="text-[10px] text-mid">Runs on Raspberry Pi</span>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-faint">
                                Vector Size
                              </span>
                              <p className="mt-1 font-display text-lg font-semibold text-hi">512-d</p>
                              <span className="text-[10px] text-mid">L2 normalized</span>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-faint">
                                Accuracy (LFW)
                              </span>
                              <p className="mt-1 font-display text-lg font-semibold text-hi">99.83%</p>
                              <span className="text-[10px] text-[#9fe0b6]">FAR &lt; 0.001%</span>
                            </div>
                          </div>

                          {/* Latency distribution bar */}
                          <div className="mt-5 rounded-xl border border-white/5 bg-surface/80 p-4">
                            <div className="flex items-center justify-between font-mono text-[10px] text-faint">
                              <span>Gate throughput distribution</span>
                              <span className="text-mid">1,280+ students / 10 min</span>
                            </div>
                            <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-white/10">
                              <div className="h-full bg-emerald-500" style={{ width: "88%" }} title="Sub-200ms (88%)" />
                              <div className="h-full bg-accent" style={{ width: "10%" }} title="200-300ms (10%)" />
                              <div className="h-full bg-amber-400" style={{ width: "2%" }} title="300-350ms (2%)" />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-mid">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                &lt;200ms (88%)
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-accent" />
                                200–300ms (10%)
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-faint">
                                &gt;300ms (2%)
                              </span>
                            </div>
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
