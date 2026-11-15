import { Fingerprint, QrCode, CloudOff, Lock, type LucideIcon } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

type Value = {
  icon: LucideIcon;
  title: string;
  body: string;
  meta: string;
};

const VALUES: Value[] = [
  {
    icon: Fingerprint,
    title: "Recognition that never guesses",
    body: "ArcFace v2.4 compares 512-dimension embeddings, not photos. Confidence scores ship with every record, so weak matches surface before they become disputes.",
    meta: "99.8% · cosine 0.94",
  },
  {
    icon: QrCode,
    title: "Tokens that die in 30 seconds",
    body: "Session codes rotate on a drift window and are signed to the live class. A screenshot forwarded to the group chat is already dead on arrival.",
    meta: "Anti-proxy · class-scoped",
  },
  {
    icon: CloudOff,
    title: "Edge-first, offline-proof",
    body: "Verification runs on the gate. If the uplink drops, check-ins queue locally and reconcile automatically — nothing lost, nothing double-counted.",
    meta: "Local queue · auto-reconcile",
  },
  {
    icon: Lock,
    title: "Privacy by default",
    body: "Raw frames are used once, then discarded. What persists is the embedding and the record — with admin deletion and a full audit trail behind it.",
    meta: "Embeddings only · audit logged",
  },
];

export function ValueProps() {
  return (
    <section id="biometrics" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why SmartFace"
          title="Built for the realities of a campus, not a lab."
          description="Four guarantees every administrator asks for on the first call — and gets in writing."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value, index) => {
            const Icon = value.icon;
            return (
              <Reveal key={value.title} delay={index * 0.07}>
                <div className="glass-card group h-full transition-transform duration-300 hover:-translate-y-1">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-accent transition-colors duration-300 group-hover:border-accent/40 group-hover:text-accent2">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </span>
                  <h3 className="mt-5 font-display text-[19px] font-medium tracking-tight text-hi">
                    {value.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-mid">{value.body}</p>
                  <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                    {value.meta}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
