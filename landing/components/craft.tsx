"use client";

import { motion } from "framer-motion";
import { Sparkles, Clock, CheckCircle2, Shield, RefreshCw, Bot, Flame } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

const DETAILS = [
  {
    icon: Clock,
    title: "Grace windows",
    body: "Late by 90 seconds? The bell decides, not the bureaucracy. Configurable per class, per campus.",
    accent: "rgba(143, 139, 255, 0.2)",
  },
  {
    icon: CheckCircle2,
    title: "Leave, integrated",
    body: "Approved leave silently blanks a seat on the roster, no more chasing notes on WhatsApp.",
    accent: "rgba(111, 216, 255, 0.2)",
  },
  {
    icon: Shield,
    title: "A record you can defend",
    body: "Every check-in carries gate, timestamp and confidence score, written to an append-only audit trail.",
    accent: "rgba(30, 215, 96, 0.2)",
  },
  {
    icon: RefreshCw,
    title: "Roster self-heals",
    body: "New enrollments appear on the right roster automatically once the timetable maps them.",
    accent: "rgba(243, 198, 79, 0.2)",
  },
  {
    icon: Bot,
    title: "Nexa AI assistant",
    body: "Students ask attendance questions in plain language; Nexa answers from their own records only.",
    accent: "rgba(143, 139, 255, 0.2)",
  },
  {
    icon: Flame,
    title: "Streaks that stick",
    body: "Bronze to Diamond Inferno: attendance becomes the habit students protect, not the chore they dodge.",
    accent: "rgba(243, 198, 79, 0.2)",
  },
];

export function Craft() {
  return (
    <section
      id="craft"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Refinements"
          title="Everything between the bell and the break."
          description="The invisible details that make a system feel effortless: the grace windows, the self-healing rosters, the answers a student already trusts."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DETAILS.map((detail, index) => {
            const Icon = detail.icon;
            return (
              <Reveal
                key={detail.title}
                delay={(index % 3) * 0.08}
                direction="up"
                distance={20}
              >
                <SpotlightCard
                  spotlightColor={detail.accent}
                  enableTilt
                  className="flex h-full flex-col justify-between p-6 sm:p-7"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <motion.span
                        whileHover={{ scale: 1.15, rotate: 6 }}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-accent transition-colors group-hover:text-white group-hover:border-accent/40"
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </motion.span>
                      <span className="chip-bytune h-6 text-[10px] px-2.5 font-mono text-accent border-accent/20 bg-accent/5">
                        Detail 0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-[18px] sm:text-[19px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                      {detail.title}
                    </h3>
                    <p className="mt-2 text-[14px] sm:text-[14.5px] leading-[23.9px] text-mid">
                      {detail.body}
                    </p>
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
