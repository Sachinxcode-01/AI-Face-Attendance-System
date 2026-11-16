import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

type Value = {
  num: string;
  title: string;
  body: string;
  meta: string;
};

const VALUES: Value[] = [
  {
    num: "01",
    title: "Recognition that never guesses",
    body: "ArcFace v2.4 compares 512-dimension embeddings, not photos. Confidence scores ship with every record, so weak matches surface before they become disputes.",
    meta: "99.8% · cosine 0.94",
  },
  {
    num: "02",
    title: "Tokens that die in 30 seconds",
    body: "Session codes rotate on a drift window and are signed to the live class. A screenshot forwarded to the group chat is already dead on arrival.",
    meta: "Anti-proxy · class-scoped",
  },
  {
    num: "03",
    title: "Edge-first, offline-proof",
    body: "Verification runs on the gate. If the uplink drops, check-ins queue locally and reconcile automatically: nothing lost, nothing double-counted.",
    meta: "Local queue · auto-reconcile",
  },
  {
    num: "04",
    title: "Privacy by default",
    body: "Raw frames are used once, then discarded. What persists is the embedding and the record: with admin deletion and a full audit trail behind it.",
    meta: "Embeddings only · audit logged",
  },
];

export function ValueProps() {
  return (
      <section id="biometrics" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-28">
        <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
          <SectionHeading
            title="Built for the realities of a campus, not a lab."
            description="Four guarantees every administrator asks for on the first call, and gets in writing."
          />

                      <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <Reveal>
                          <div className="relative overflow-hidden rounded-lg border border-[var(--hairline)] bg-surface p-2 shadow-sm">
                            <img
                              src="/product-banner.png"
                              alt="SmartFace Platform Suite Architecture and Kiosk Interface"
                              className="w-full rounded-md object-cover"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-mid">
                              <span>SmartFace Suite · Live Architecture</span>
                              <span className="text-[#9fe0b6]">ArcFace ONNX · Active</span>
                            </div>
                          </div>
                        </Reveal>

                        <div className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
                          {VALUES.map((value, index) => (
                            <Reveal key={value.title} delay={index * 0.06}>
                              <div className="py-5">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="font-mono text-xs font-semibold text-accent">
                                    {value.num}
                                  </span>
                                  <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
                                    {value.meta}
                                  </span>
                                </div>
                                <h3 className="mt-2 font-display text-[17px] font-medium tracking-tight text-hi">
                                  {value.title}
                                </h3>
                                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-mid">
                                    {value.body}
                                  </p>
                              </div>
                            </Reveal>
            ))}
                        </div>
                      </div>
                  </div>
                </section>
              );
            }
