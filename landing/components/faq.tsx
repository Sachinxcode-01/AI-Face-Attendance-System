"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import { DEMO_MAILTO } from "@/lib/constants";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const FAQS = [
  {
    question: "What happens to students' face data?",
    answer:
      "Enrollment turns each face into a 512-dimension embedding. The raw frame is used for that moment only; the embedding and the attendance record are what persist. Admins can delete or re-enroll any profile from the portal, and every access is written to the audit trail.",
  },
  {
    question: "How do you stop photos, screens and masks?",
    answer:
      "ArcFace liveness checks run before a match is accepted, so printed photos, replayed video and flat masks fail. Face verification is paired with the rotating session QR, so a check-in also has to belong to a live class, not a screenshot forwarded to a friend.",
  },
  {
    question: "Does attendance still work if the internet drops?",
    answer:
      "Yes. Verification runs on the edge node, and check-ins queue locally if the uplink is lost. When the connection returns, the queue reconciles against the session: nothing is lost, and nothing is counted twice.",
  },
  {
    question: "What hardware does a campus need?",
    answer:
      "A camera and a browser. The kiosk runs on an existing IP camera, a USB webcam, or a tablet at the gate, without turnstiles or proprietary readers. Larger fleets can add an optional GPU node for parallel verification.",
  },
  {
    question: "How accurate is it in real classrooms?",
    answer:
      "ArcFace v2.4 benchmarks at 99.8% on well-lit enrollment. The admin calibration flow captures five angles per person and flags weak enrollments before they ever reach a gate, so accuracy does not hinge on one lucky photo.",
  },
  {
    question: "How long does installation take?",
    answer:
      "One gate is an afternoon: mount the camera, pair the edge node, import staff and students. A full campus rollout typically runs one to two weeks, and most of that is enrollment and timetable mapping rather than hardware.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
      <section id="faq" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-16 sm:py-24 lg:py-[140px]">
        <div className="mx-auto grid w-full max-w-[var(--container)] gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              title="The questions every campus asks first."
              description="Privacy, spoofing, uptime and installation: answered plainly, before you book a demo."
            />
            <Reveal delay={0.15}>
              <a
                href={DEMO_MAILTO}
                className="mt-8 btn-pill-glass"
              >
                Ask us something specific
                <ArrowUpRight className="h-4 w-4 text-accent" />
              </a>
            </Reveal>
          </div>

          <div className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
            {FAQS.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={faq.question}>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:text-white"
                    >
                      <span className="text-[17px] font-medium leading-snug text-hi">
                        {faq.question}
                      </span>
                      < span className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.03] shrink-0 mt-0.5">
                        <Plus
                          aria-hidden
                          className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-45 text-accent" : "text-faint"
                            }`}
                        />
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-7 pr-8 text-[14.5px] leading-[23.9px] text-mid">
                          {faq.answer}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      );
}
