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
    badge: "border-brand-400/20 bg-brand-500/10 text-brand-300",
    glow: "bg-brand-500/20",
    text: "text-brand-300",
    border: "hover:border-brand-400/40",
  },
  emerald: {
    badge: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    glow: "bg-emerald-500/20",
    text: "text-emerald-300",
    border: "hover:border-emerald-400/40",
  },
  amber: {
    badge: "border-amber-400/20 bg-amber-500/10 text-amber-300",
    glow: "bg-amber-500/20",
    text: "text-amber-300",
    border: "hover:border-amber-400/40",
  },
  sky: {
    badge: "border-sky-400/20 bg-sky-500/10 text-sky-300",
    glow: "bg-sky-500/20",
    text: "text-sky-300",
    border: "hover:border-sky-400/40",
  },
};

export function RoleGateway() {
  return (
    <section
      id="portals"
      className="relative scroll-mt-24 border-t border-white/[0.06] py-24 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Portals"
          title="One campus. Four vantage points."
          description="Every role signs into the same unified portal, on its own route. This page is only the front door — dashboards live on Website 2."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((role, index) => {
            const Icon = role.icon;
            const accent = ACCENTS[role.accent];
            return (
              <Reveal key={role.key} delay={index * 0.06} className="h-full">
                <div
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-surface p-6 transition duration-300 hover:-translate-y-1 ${accent.border}`}
                >
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${accent.glow}`}
                  />
                  <div className="flex items-start justify-between">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl border ${accent.badge}`}>
                      <Icon className="h-5 w-5" strokeWidth={1.7} />
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
                      {role.label}
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-ink">
                    {role.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{role.description}</p>

                  <ul className="mt-5 space-y-2">
                    {role.capabilities.map((capability) => (
                      <li
                        key={capability}
                        className="flex gap-2 text-[12px] leading-snug text-ink-muted"
                      >
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${accent.text}`} />
                        {capability}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    <a
                      href={role.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13px] font-medium text-ink transition group-hover:border-white/20 group-hover:bg-white/[0.05]"
                    >
                      Open {role.label} portal
                      <ArrowUpRight className={`h-4 w-4 ${accent.text}`} />
                    </a>
                    <p className="mt-2 truncate font-mono text-[9px] tracking-wide text-ink-faint">
                      {role.path}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          Portals open on{" "}
          <a
            href={PORTAL_URL}
            target="_blank"
            rel="noreferrer"
            className="text-brand-300 transition hover:text-brand-200"
          >
            {PORTAL_URL.replace(/^https?:\/\//, "")}
          </a>
        </p>
      </div>
    </section>
  );
}
