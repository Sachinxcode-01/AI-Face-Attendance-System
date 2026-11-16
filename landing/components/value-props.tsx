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
    <section id="biometrics" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]">
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          title="Built for the realities of a campus, not a lab."
          description="Four guarantees every administrator asks for on the first call, and gets in writing."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal>
            <div className="relative overflow-hidden card-bytune p-3 shadow-xl">
              <img
                src="/campus-realities.jpg"
                alt="SmartFace touchless campus speed gates and biometric kiosks"
                className="w-full rounded-[16px] object-cover aspect-[16/10]"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-mid">
                <span>SmartFace Deployment · Live Campus Gates</span>
                <span className="text-[#9fe0b6] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-spotify animate-pulse" />
                  ArcFace ONNX · Active Fleet
                </span>
              </div>
            </div>
          </Reveal>

          <div className="space-y-4">
            {VALUES.map((val, index) => (
              <Reveal key={val.num} delay={index * 0.08}>
                <div className="group relative rounded-[22px] border border-[var(--hairline)] bg-surface p-5 sm:p-6 transition-all duration-300 hover:border-[var(--hairline-strong)] hover:bg-[#16161d]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
                      {val.num}
                    </span>
                    <span className="chip-bytune h-6 text-[11px] px-3">
                      {val.meta}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-[18px] sm:text-[19px] font-medium tracking-tight text-hi">
                    {val.title}
                  </h3>
                  <p className="mt-2 text-[14px] sm:text-[14.5px] leading-[23.9px] text-mid">
                    {val.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section >
  );
}
