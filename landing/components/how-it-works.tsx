"use client";

import { BellRing, QrCode, ScanFace, type LucideIcon } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const STEPS: { number: string; icon: LucideIcon; title: string; body: string; meta: string }[] = [
  {
    number: "01",
    icon: QrCode,
    title: "Launch the session",
    body: "Faculty start a class session on the Teacher Portal. A signed, class-scoped QR code appears and rotates on a 30-second drift window.",
    meta: "Teacher Portal · rotating token",
  },
  {
    number: "02",
    icon: ScanFace,
    title: "Verify identity & liveness",
    body: "The ArcFace ONNX engine validates face identity and liveness against the enrolled 512-dimension embedding — under 300ms, on any camera.",
    meta: "<300ms · on-device inference",
  },
  {
    number: "03",
    icon: BellRing,
    title: "Sync and notify",
    body: "Attendance lands in the database instantly and push notifications go to parents and admins, stamped with gate, time and confidence score.",
    meta: "Push + email · audit logged",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-28"
    >
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from a raised hand to a parent's phone."
          description="No turnstiles, no cards, no end-of-class roll call. One session start, one face, one instant record."
        />

        <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:block"
          />
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.number} delay={index * 0.08}>
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--hairline)] bg-surface text-accent">
                      <Icon className="h-5 w-5" strokeWidth={1.7} />
                    </span>
                    <span className="font-display text-4xl font-medium leading-none text-white/[0.07]">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-[19px] font-medium tracking-tight text-hi">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-mid">{step.body}</p>
                  <p className="mt-4 inline-flex rounded-md border border-[var(--hairline)] bg-white/[0.02] px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
                    {step.meta}
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
