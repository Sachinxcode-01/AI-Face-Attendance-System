"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { PORTAL_URL } from "@/lib/constants";
import { ROLES, type Role } from "@/lib/content";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const ACCENTS: Record<
  Role["accent"],
  { badge: string; glow: string; text: string; border: string }
> = {
  indigo: {
    badge: "border-accent/20 bg-accent/10 text-accent",
    glow: "bg-accent/20",
    text: "text-accent",
    border: "hover:border-accent/40",
  },
  emerald: {
    badge: "border-spotify/20 bg-spotify/10 text-[#9fe0b6]",
    glow: "bg-spotify/20",
    text: "text-[#9fe0b6]",
    border: "hover:border-spotify/40",
  },
  amber: {
    badge: "border-amber/20 bg-amber/10 text-amber",
    glow: "bg-amber/20",
    text: "text-amber",
    border: "hover:border-amber/40",
  },
  sky: {
    badge: "border-accent2/20 bg-accent2/10 text-accent2",
    glow: "bg-accent2/20",
    text: "text-accent2",
    border: "hover:border-accent2/40",
  },
};

export function RoleGateway() {
  return (
    <section
      id="portals"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          title="One campus. Four vantage points."
          description="Every role signs into the same unified portal, on its own route. This page is only the front door: dashboards live on Website 2."
        />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {ROLES.map((role, index) => {
              const Icon = role.icon;
              const accent = ACCENTS[role.accent];
              return (
                <Reveal key={role.key} delay={index * 0.06} className="h-full">
                  <div
                    className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[22px] border border-[var(--hairline)] bg-surface p-6 sm:p-7 transition-all duration-300 hover:border-[var(--hairline-strong)] hover:bg-[#16161d]`}
                  >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-accent transition-colors duration-300 group-hover:text-accent2 group-hover:border-accent/40">
                              <Icon className="h-5 w-5" strokeWidth={1.8} />
                            </span>
                              <span className={`chip-bytune h-6 text-[10px] uppercase tracking-wider font-mono ${accent.badge}`}>
                                {role.accent}
                              </span>
                        </div>

                        <h3 className="mt-5 font-display text-[20px] font-medium tracking-tight text-hi">
                          {role.title}
                        </h3>
                        <p className="mt-2 text-[14px] leading-[22px] text-mid">
                          {role.description}
                        </p>

                        <ul className="mt-6 space-y-2 border-t border-white/[0.06] pt-4 font-mono text-[11px] text-faint">
                          {role.capabilities.map((b) => (
                            <li key={b} className="flex items-center gap-2">
                              <Check className="h-3 w-3 text-spotify shrink-0" />
                              <span className="text-mid">{b}</span>
                            </li>
                          ))}
                        </ul>
                    </div>

                      <div className="mt-8 pt-4 border-t border-white/[0.06]">
                        <a
                          href={role.href}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-pill-glass w-full justify-between group-hover:border-white/20 group-hover:text-hi"
                        >
                          <span className="text-[13px] font-medium">Open {role.title}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
                        </a>
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
