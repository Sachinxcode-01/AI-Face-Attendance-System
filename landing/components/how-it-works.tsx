"use client";

import { motion } from "framer-motion";
import { BellRing, QrCode, ScanFace, ArrowRight, type LucideIcon } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

const STEPS: {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
  meta: string;
  accent: string;
  gradient: string;
}[] = [
  {
    number: "01",
    icon: QrCode,
    title: "Launch the session",
    body: "Faculty start a class session on the Teacher Portal. A signed, class-scoped QR code appears and rotates on a 30-second drift window.",
    meta: "Teacher Portal · rotating token",
    accent: "rgba(143, 139, 255, 0.2)",
    gradient: "from-accent to-accent2",
  },
  {
    number: "02",
    icon: ScanFace,
    title: "Verify identity & liveness",
    body: "The ArcFace ONNX engine validates face identity and liveness against the enrolled 512-dimension embedding: under 300ms, on any camera.",
    meta: "<300ms · on-device inference",
    accent: "rgba(111, 216, 255, 0.25)",
    gradient: "from-accent2 to-spotify",
  },
  {
    number: "03",
    icon: BellRing,
    title: "Sync and notify",
    body: "Attendance lands in the database instantly and push notifications go to parents and admins, stamped with gate, time and confidence score.",
    meta: "Push + email · audit logged",
    accent: "rgba(30, 215, 96, 0.2)",
    gradient: "from-spotify to-amber",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
      {/* Background ambient lighting */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 h-[350px] w-[800px] rounded-full opacity-15 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(143, 139, 255, 0.3) 0%, rgba(111, 216, 255, 0.15) 50%, transparent 75%)",
        }}
      />

      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Workflow Architecture"
          title="Three steps from a raised hand to a parent's phone."
          description="No turnstiles, no cards, no end-of-class roll call. One session start, one face, one instant record."
        />

        {/* Steps Grid */}
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.number} delay={index * 0.1} direction="up" distance={24}>
                <SpotlightCard
                  spotlightColor={step.accent}
                  enableTilt
                  className="flex h-full flex-col justify-between p-7"
                >
                  <div>
                    {/* Header: Icon + Number */}
                    <div className="flex items-center justify-between">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent transition-colors duration-300 group-hover:text-white group-hover:border-accent/50 group-hover:shadow-[0_0_20px_rgba(143,139,255,0.3)]"
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </motion.div>

                      <span className="font-display text-4xl font-semibold leading-none text-white/[0.08] group-hover:text-white/[0.22] transition-colors">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mt-6 font-display text-[20px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 text-[14.5px] leading-[23.9px] text-mid">
                      {step.body}
                    </p>
                  </div>

                  {/* Footer metadata */}
                  <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="chip-bytune h-6 text-[10.5px] px-3 font-mono">
                      {step.meta}
                    </span>
                    {index < 2 && (
                      <span className="hidden md:flex items-center text-faint group-hover:text-accent transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
