"use client";

import { motion } from "framer-motion";
import { Scan, ShieldCheck, Zap, Database } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

type Value = {
  num: string;
  icon: typeof Scan;
  title: string;
  body: string;
  meta: string;
  accent: string;
};

const VALUES: Value[] = [
  {
    num: "01",
    icon: Scan,
    title: "Recognition that never guesses",
    body: "ArcFace v2.4 compares 512-dimension embeddings, not photos. Confidence scores ship with every record, so weak matches surface before they become disputes.",
    meta: "99.8% · cosine 0.94",
    accent: "rgba(143, 139, 255, 0.2)",
  },
  {
    num: "02",
    icon: Zap,
    title: "Tokens that die in 30 seconds",
    body: "Session codes rotate on a drift window and are signed to the live class. A screenshot forwarded to the group chat is already dead on arrival.",
    meta: "Anti-proxy · class-scoped",
    accent: "rgba(111, 216, 255, 0.2)",
  },
  {
    num: "03",
    icon: Database,
    title: "Edge-first, offline-proof",
    body: "Verification runs on the gate. If the uplink drops, check-ins queue locally and reconcile automatically: nothing lost, nothing double-counted.",
    meta: "Local queue · auto-reconcile",
    accent: "rgba(30, 215, 96, 0.2)",
  },
  {
    num: "04",
    icon: ShieldCheck,
    title: "Privacy by default",
    body: "Raw frames are used once, then discarded. What persists is the embedding and the record: with admin deletion and a full audit trail behind it.",
    meta: "Embeddings only · audit logged",
    accent: "rgba(243, 198, 79, 0.2)",
  },
];

export function ValueProps() {
  return (
    <section
      id="biometrics"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Biometric Guarantees"
          title="Built for the realities of a campus, not a lab."
          description="Four guarantees every administrator asks for on the first call, and gets in writing."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Visual Showcase Card with Holographic HUD */}
          <Reveal direction="left" duration={0.75}>
            <div className="group relative overflow-hidden card-bytune p-3 shadow-2xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <div className="relative overflow-hidden rounded-[16px]">
                <img
                  src="/campus-realities.jpg"
                  alt="SmartFace touchless campus speed gates and biometric kiosks"
                  className="w-full object-cover aspect-[16/10] transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[#0a0a0e]/90 via-transparent to-transparent pointer-events-none"
                />

                {/* Laser scan line over the campus image on hover */}
                <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-laser-scan pointer-events-none" />

                {/* Live gate badge overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-[#101016]/90 px-3 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
                  </span>
                  <span className="text-hi font-medium">Turnstile Bank 03 · Online</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-mid">
                <span>SmartFace Deployment · Live Campus Gates</span>
                <span className="text-[#9fe0b6] flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-spotify animate-pulse" />
                  ArcFace ONNX · Active Fleet
                </span>
              </div>
            </div>
          </Reveal>

          {/* 4 Interactive Spotlight Value Cards */}
          <div className="space-y-4">
            {VALUES.map((val, index) => {
              const Icon = val.icon;
              return (
                <Reveal key={val.num} delay={index * 0.09} direction="up" distance={20}>
                  <SpotlightCard
                    spotlightColor={val.accent}
                    className="p-5 sm:p-6"
                    enableTilt
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-accent group-hover:text-white transition-colors">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold">
                          Guarantee {val.num}
                        </span>
                      </div>
                      <span className="chip-bytune h-6 text-[10.5px] px-3 font-mono">
                        {val.meta}
                      </span>
                    </div>

                    <h3 className="mt-3.5 font-display text-[18px] sm:text-[19px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                      {val.title}
                    </h3>
                    <p className="mt-2 text-[14px] sm:text-[14.5px] leading-[23.9px] text-mid">
                      {val.body}
                    </p>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
