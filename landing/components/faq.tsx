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
      "Enrollment turns each face into a 512-dimension mathematical embedding. The raw frame is used for that moment only; the embedding and the attendance record are what persist. Admins can delete or re-enroll any profile from the portal, and every access is written to the audit trail.",
  },
  {
    question: "How do you stop photos, screens and masks?",
    answer:
      "ArcFace liveness checks run before a match is accepted, so printed photos, replayed video and flat masks fail. Face verification is paired with the rotating session QR, so a check-in also has to belong to a live class — not a screenshot forwarded to a friend.",
  },
  {
    question: "Does attendance still work if the internet drops?",
    answer:
      "Yes. Verification runs on the edge node, and check-ins queue locally if the uplink is lost. When the connection returns, the queue reconciles against the session — nothing is lost, and nothing is counted twice.",
  },
  {
    question: "What hardware does a campus need?",
    answer:
      "A camera and a browser. The kiosk runs on an existing IP camera, a USB webcam, or a tablet at the gate — no turnstiles or proprietary readers. Larger fleets can add an optional GPU node for parallel verification.",
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
    <section id="faq" className="relative scroll-mt-24 border-t border-white/[0.06] py-24 sm:py-28">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="FAQ"
            title="The questions every campus asks first."
            description="Privacy, spoofing, uptime and installation — answered plainly, before you book a demo."
          />
          <Reveal delay={0.15}>
            <a
              href={DEMO_MAILTO}
              className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13px] font-medium text-ink transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Ask us something specific
              <ArrowUpRight className="h-4 w-4 text-brand-300" />
            </a>
          </Reveal>
        </div>

        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-6 py-5 text-left"
                  >
                    <span className="text-[15px] font-medium leading-snug text-ink">
                      {faq.question}
                    </span>
                    <Plus
                      aria-hidden
                      className={`mt-0.5 h-4 w-4 shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-45 text-brand-300" : "text-ink-faint"
                      }`}
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-8 text-[13.5px] leading-relaxed text-ink-muted">
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
