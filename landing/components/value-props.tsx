"use client";

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
    title: "Calibrated vector matching",
    body: "InsightFace ArcFace (buffalo_l, ResNet-50) compares 512-dimension normalized embeddings against a configurable cosine threshold (default 0.60) and logs confidence scores for auditability.",
    meta: "512-D · cosine ≥0.60",
    accent: "rgba(143, 139, 255, 0.2)",
  },
  {
    num: "02",
    icon: Zap,
    title: "20-second rotating session tokens",
    body: "Classroom QR codes rotate every 20 seconds (+5s clock-skew tolerance) with HMAC-SHA256 signatures, duplicate-checkin locks, and optional classroom geofencing to deter forwarded screenshots.",
    meta: "HMAC-SHA256 · 20s window",
    accent: "rgba(111, 216, 255, 0.2)",
  },
  {
    num: "03",
    icon: Database,
    title: "Encrypted mobile offline queue",
    body: "The Flutter mobile app queues up to 500 check-in records in an AES-256 encrypted Hive store signed with HMAC-SHA256 and syncs automatically when connectivity returns.",
    meta: "Hive AES-256 · auto-sync",
    accent: "rgba(30, 215, 96, 0.2)",
  },
  {
    num: "04",
    icon: ShieldCheck,
    title: "Consent & template deletion controls",
    body: "Live API verification processes frames in memory without saving raw photos to disk. Consent timestamps, self-service template deletion, and manual/QR fallbacks are built in.",
    meta: "Opt-in · audit logged",
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
          eyebrow="Core Engineering Guarantees"
          title="Built for the realities of a campus, not hype."
          description="Four verifiable architectural capabilities administrators review before piloting SmartFace."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Visual Showcase Card */}
          <Reveal direction="left" duration={0.75}>
            <div className="group relative overflow-hidden card-bytune p-3 shadow-2xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <div className="relative overflow-hidden rounded-[16px]">
                <img
                  src="/campus-realities.jpg"
                  alt="SmartFace campus gate and classroom kiosk deployment concept"
                  className="w-full object-cover aspect-[16/10] transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[#0a0a0e]/90 via-transparent to-transparent pointer-events-none"
                />

                <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-laser-scan pointer-events-none" />

                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-[#101016]/90 px-3 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
                  </span>
                  <span className="text-hi font-medium">Illustrative Gate View</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-mid">
                <span>SmartFace v2.0 · Campus Deployment Concept</span>
                <span className="text-[#9fe0b6] flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-spotify animate-pulse" />
                  InsightFace ArcFace (buffalo_l)
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
                          Capability {val.num}
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
