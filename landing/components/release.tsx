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

            {/* Imagery block — placeholder capture, replace pre-launch */}
            <Reveal delay={0.24}>
              <div className="relative overflow-hidden rounded-[22px] border border-[var(--hairline)]">
                <div className="relative aspect-[16/7] bg-gradient-to-br from-panel via-bg1 to-panel">
                  <div aria-hidden className="absolute inset-0 bg-grid opacity-30" />
                  <div
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-40 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl"
                  />
                  <div className="absolute inset-0 grid place-items-center p-6">
                    <div className="w-full max-w-md rounded-2xl border border-[var(--hairline)] bg-surface/70 p-4 backdrop-blur-xl">
                      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                        <span>Campus telemetry</span>
                        <span className="text-[#9fe0b6]">All systems live</span>
                      </div>
                      <div className="mt-3 flex items-end gap-1.5" aria-hidden>
                        {Array.from({ length: 24 }, (_, i) => (
                          <span
                            key={i}
                            className="flex-1 rounded-sm bg-gradient-to-t from-accent/40 to-accent2/70"
                            style={{
                              height: `${18 + ((i * 53) % 62)}px`,
                              opacity: 0.45 + ((i * 29) % 10) / 16,
                            }}
                          />
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between font-mono text-[9px] text-faint">
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>24:00</span>
                      </div>
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
