"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { ROLES, type Role } from "@/lib/content";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

const ACCENTS: Record<
  Role["accent"],
  { badge: string; glow: string; text: string; spotlight: string }
> = {
  indigo: {
    badge: "border-accent/30 bg-accent/10 text-accent",
    glow: "bg-accent/20",
    text: "text-accent",
    spotlight: "rgba(143, 139, 255, 0.25)",
  },
  emerald: {
    badge: "border-spotify/30 bg-spotify/10 text-[#9fe0b6]",
    glow: "bg-spotify/20",
    text: "text-[#9fe0b6]",
    spotlight: "rgba(30, 215, 96, 0.25)",
  },
  amber: {
    badge: "border-amber/30 bg-amber/10 text-amber",
    glow: "bg-amber/20",
    text: "text-amber",
    spotlight: "rgba(243, 198, 79, 0.25)",
  },
  sky: {
    badge: "border-accent2/30 bg-accent2/10 text-accent2",
    glow: "bg-accent2/20",
    text: "text-accent2",
    spotlight: "rgba(111, 216, 255, 0.25)",
  },
  violet: {
    badge: "border-accent/40 bg-accent/15 text-hi",
    glow: "bg-accent/25",
    text: "text-accent",
    spotlight: "rgba(143, 139, 255, 0.28)",
  },
};

export function RoleGateway() {
  return (
    <section
      id="portals"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
        <div className="mx-auto w-full max-w-[var(--wide)] px-6 lg:px-8">
          <SectionHeading
            eyebrow="Portal Access"
            title="One campus. Five role-based portals."
            description="Every stakeholder signs into the unified SmartFace Portal on its dedicated route—from student check-ins and faculty sessions to campus administration and multi-college governance."
          />

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {ROLES.map((role, index) => {
                const Icon = role.icon;
                const accent = ACCENTS[role.accent];
                return (
                  <Reveal key={role.key} delay={index * 0.08} direction="up" distance={24} className="h-full">
                    <SpotlightCard
                      spotlightColor={accent.spotlight}
                      enableTilt
                      className="flex h-full flex-col justify-between p-6"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <motion.span
                            whileHover={{ scale: 1.15, rotate: 6 }}
                            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent transition-colors duration-300 group-hover:text-white group-hover:border-accent/40"
                          >
                            <Icon className="h-5 w-5" strokeWidth={1.8} />
                          </motion.span>
                          <span className={`chip-bytune h-6 text-[10px] uppercase tracking-wider font-mono font-semibold ${accent.badge}`}>
                            {role.label}
                          </span>
                        </div>

                          <h3 className="mt-5 font-display text-[19px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                            {role.title}
                          </h3>
                            <p className="mt-2 text-[13.5px] leading-[21px] text-mid">
                              {role.description}
                            </p>

                            <ul className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-4 font-mono text-[11px] text-faint">
                              {role.capabilities.map((b) => (
                                <li key={b} className="flex items-center gap-2">
                                  <Check className="h-3 w-3 text-spotify shrink-0" />
                                  <span className="text-mid group-hover:text-hi transition-colors">{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-8 pt-4 border-t border-white/[0.06]">
                            <motion.a
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              href={role.href}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-pill-glass w-full justify-between group-hover:border-white/20 group-hover:text-hi group"
                            >
                              <span className="text-[13px] font-semibold">Open {role.label}</span>
                              <ArrowUpRight className="h-3.5 w-3.5 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </motion.a>
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
