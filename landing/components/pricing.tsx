"use client";

import { Check } from "lucide-react";
import { COMPANY_CONTACT } from "@/lib/constants";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

interface PricingProps {
  onOpenDemo?: () => void;
  onOpenPilot?: () => void;
}

export const PRICING_PLANS = [
  {
    id: "opensource",
    name: "Open Source",
    tagline: "Self-hosted MIT codebase for evaluation & campus IT teams",
    priceInr: "₹0",
    period: "MIT source code",
    capacity: "Unlimited (Self-Managed)",
    badge: "MIT License",
    highlight: false,
    features: [
      "Full Express, FastAPI, Next.js & Flutter source",
      "InsightFace ArcFace (buffalo_l) 512-D recognition",
      "20s HMAC-SHA256 rotating QR & geofencing",
      "All 5 role portals + mobile offline Hive queue",
      "Self-managed MongoDB, backups & mail/SMS keys",
      "Community GitHub issues & documentation",
    ],
    deployment: "Self-Hosted (Your Infra)",
    ctaText: "View Source on GitHub",
    ctaAction: "github",
  },
  {
    id: "starter",
    name: "Starter Pilot / Dept",
    tagline: "Managed cloud evaluation for departments & small institutes",
    priceInr: "₹12",
    period: "student / month (billed annually)",
    capacity: "Up to 500 Students",
    badge: "30-Day Trial",
    highlight: false,
    features: [
      "Managed cloud hosting for API & portal",
      "Student, Teacher, Admin & Parent web portals",
      "20s rotating QR & ArcFace 512-D verification",
      "Transactional email alerts (configured limit)",
      "CSV / Excel / JSON attendance report exports",
      "Email support (2 business-day response target)",
    ],
    deployment: "Managed Cloud",
    ctaText: "Start 30-Day Pilot",
    ctaAction: "pilot",
  },
  {
    id: "professional",
    name: "Professional Campus",
    tagline: "Managed deployment for degree & engineering colleges",
    priceInr: "₹24",
    period: "student / month (billed annually)",
    capacity: "Up to 3,000 Students",
    badge: "Most Popular",
    highlight: true,
    features: [
      "Everything in Starter, plus:",
      "Parent Portal & SMS gateway integration (usage billed)",
      "Nexa AI assistant (Groq fair-use token quota)",
      "OneRoster 1.2 CSV onboarding & Google Sheets sync",
      "Priority email & scheduled call support (1 business-day)",
      "Full CSV/JSON export & 30-day cancellation window",
    ],
    deployment: "Managed Cloud / Hybrid LAN",
    ctaText: "Book Campus Demo",
    ctaAction: "demo",
  },
  {
    id: "enterprise",
    name: "Enterprise / University",
    tagline: "Multi-college governance & custom on-premise contracts",
    priceInr: "Custom",
    period: "annual institutional contract",
    capacity: "3,000–20,000+ Students",
    badge: "Custom Scope",
    highlight: false,
    features: [
      "Multi-college Super Admin tenant console",
      "Campus LAN / private cloud deployment options",
      "Optional Supabase pgvector & custom SIS/LMS scoping",
      "Guided onboarding, faculty training & pilot validation",
      "Custom support & availability targets by agreement",
      "Data residency & institutional DPIA documentation support",
    ],
    deployment: "Private Cloud / Campus LAN",
    ctaText: "Contact Institutional Sales",
    ctaAction: "demo",
  },
];

export function Pricing({ onOpenDemo, onOpenPilot }: PricingProps) {
  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32 lg:py-36"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Open Source & Commercial Licensing"
          title="Transparent Options: Self-Host Free or Choose Managed Hosting"
          description="Self-host the MIT-licensed codebase on your own servers at ₹0 software license cost, or choose a commercial plan for managed hosting, onboarding, and support. Taxes (GST) and optional SMS/hardware costs apply separately."
        />

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid gap-6 lg:grid-cols-4 items-stretch">
          {PRICING_PLANS.map((plan, idx) => (
            <Reveal key={plan.id} delay={idx * 0.08} direction="up" className="h-full">
              <SpotlightCard
                spotlightColor={
                  plan.highlight
                    ? "rgba(143, 139, 255, 0.35)"
                    : "rgba(255, 255, 255, 0.08)"
                }
                className={`h-full flex flex-col justify-between p-6 sm:p-7 rounded-[22px] border ${plan.highlight
                    ? "border-accent/60 bg-[rgba(16,16,24,0.95)] shadow-[0_0_32px_rgba(143,139,255,0.2)]"
                    : "border-white/10 bg-surface/85"
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between min-h-[26px]">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-mid font-semibold">
                      {plan.name}
                    </span>
                    {plan.badge && (
                      <span className="font-mono text-[9.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-accent/40 bg-accent/15 text-accent font-semibold">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-[12.5px] text-faint min-h-[36px]">
                    {plan.tagline}
                  </p>

                  <div className="mt-6 pb-6 border-b border-white/[0.08]">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl sm:text-4xl font-semibold text-hi">
                        {plan.priceInr}
                      </span>
                      <span className="text-[11.5px] font-mono text-faint">/{plan.period}</span>
                    </div>
                    <span className="mt-1 block font-mono text-[11px] text-spotify">
                      {plan.capacity}
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-faint block">
                      Includes
                    </span>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-[12.5px] text-mid">
                        <Check className="h-4 w-4 text-spotify shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-faint">
                    <span>Deployment:</span>
                    <span className="text-mid font-medium">{plan.deployment}</span>
                  </div>

                  {plan.ctaAction === "github" ? (
                    <a
                      href={COMPANY_CONTACT.github}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-11 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/15 bg-white/[0.04] text-hi hover:bg-white/[0.08]"
                    >
                      {plan.ctaText}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (plan.ctaAction === "pilot" && onOpenPilot) {
                          onOpenPilot();
                        } else if (onOpenDemo) {
                          onOpenDemo();
                        }
                      }}
                      className={`w-full h-11 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${plan.highlight
                          ? "btn-pill-accent shadow-[0_0_20px_rgba(143,139,255,0.35)]"
                          : "border border-white/15 bg-white/[0.04] text-hi hover:bg-white/[0.08]"
                        }`}
                    >
                      {plan.ctaText}
                    </button>
                  )}
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

          <div className="mt-8 text-center text-[12px] text-faint font-mono">
            Commercial plans exclude applicable GST/taxes, campus camera/GPU hardware, on-site installation, and pass-through SMS carrier fees. Institutions retain full CSV/JSON data export rights upon cancellation.
          </div>

          <div className="mt-6 text-center">
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-wider text-accent hover:text-white transition-colors"
            >
              <span>View Full Feature Matrix, Billing Terms &amp; Deployment Details</span>
              <span>→</span>
            </a>
          </div>
        </div>
    </section>
  );
}
