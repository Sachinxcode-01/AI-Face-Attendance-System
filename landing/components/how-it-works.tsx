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
    body: "The ArcFace ONNX engine validates face identity and liveness against the enrolled 512-dimension embedding: under 300ms, on any camera.",
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
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          title="Three steps from a raised hand to a parent's phone."
          description="No turnstiles, no cards, no end-of-class roll call. One session start, one face, one instant record."
        />

          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.number} delay={index * 0.08}>
                        <div className="group relative flex h-full flex-col justify-between rounded-[22px] border border-[var(--hairline)] bg-surface p-7 transition-all duration-300 hover:border-[var(--hairline-strong)] hover:bg-[#16161d]">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-accent transition-colors group-hover:text-accent2 group-hover:border-accent/40">
                                <Icon className="h-5 w-5" strokeWidth={1.8} />
                              </span>
                                <span className="font-display text-4xl font-medium leading-none text-white/[0.08] group-hover:text-white/[0.16] transition-colors">
                                  {step.number}
                                </span>
                            </div>

                            <h3 className="mt-6 font-display text-[20px] font-medium tracking-tight text-hi">
                              {step.title}
                            </h3>
                            <p className="mt-2.5 text-[14.5px] leading-[23.9px] text-mid">
                              {step.body}
                            </p>
                          </div>

                          <div className="mt-8 pt-4 border-t border-white/[0.06]">
                            <span className="chip-bytune h-6 text-[10.5px] px-3">
                              {step.meta}
                            </span>
                          </div>
                        </div>
                      </Reveal>
                      );
          })}
                    </div>
                  </div>
                </section>
              );
            }
