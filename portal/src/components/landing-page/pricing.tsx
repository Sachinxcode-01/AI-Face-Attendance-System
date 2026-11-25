"use client";

import { Check } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

interface PricingProps {
  onOpenDemo?: () => void;
  onOpenPilot?: () => void;
}

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For small institutes & departmental pilots",
    priceInr: "₹12",
    period: "student / month",
    capacity: "Up to 500 Students",
    badge: null,
    highlight: false,
    features: [
      "2 Gate Kiosk / Terminal licenses",
      "Rotating classroom anti-proxy QR codes",
      "ArcFace v2.4 512-dim edge biometrics",
      "Teacher & Student web portals",
      "Daily automated attendance summaries",
      "Standard email support (24h response)",
    ],
    deployment: "Cloud Hosted",
    ctaText: "Start 30-Day Pilot",
    ctaAction: "pilot",
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "Ideal for established engineering & degree colleges",
    priceInr: "₹24",
    period: "student / month",
    capacity: "Up to 3,000 Students",
    badge: "Most Popular",
    highlight: true,
    features: [
      "Up to 10 Gate Kiosk / Terminal licenses",
      "Everything in Starter, plus:",
      "Automated WhatsApp / SMS parent notifications",
      "Parent Portal with real-time arrival timestamps",
      "Nexa AI student study companion & streak badges",
      "Local offline SQLite queue buffer during outages",
      "Priority telephone & email support (4h response)",
    ],
    deployment: "Hybrid Edge + Cloud",
    ctaText: "Book Campus Demo",
    ctaAction: "demo",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For large colleges & multi-faculty institutions",
    priceInr: "₹36",
    period: "student / month",
    capacity: "Up to 15,000 Students",
    badge: "Campus Standard",
    highlight: false,
    features: [
      "Unlimited Kiosk terminals & turnstiles",
      "Everything in Professional, plus:",
      "Admin Sentinel campus telemetry & intruder radar",
      "Direct bi-directional SIS / ERP synchronization",
      "Automated 1-click NAAC & NBA compliance exports",
      "Dedicated Technical Account Manager",
      "99.9% Uptime Service Level Agreement (SLA)",
    ],
    deployment: "Private Cloud / Hybrid Edge",
    ctaText: "Book Enterprise Walkthrough",
    ctaAction: "demo",
  },
  {
    id: "custom",
    name: "Custom University",
    tagline: "For university systems & government campuses",
    priceInr: "Custom",
    period: "annual contract",
    capacity: "20,000+ Students",
    badge: "Air-Gapped",
    highlight: false,
    features: [
      "100% On-Premise Air-Gapped deployment available",
      "Custom RTSP CCTV & turnstile barrier integrations",
      "Custom AI model calibration & landmark adaptation",
      "On-site engineer deployment & faculty training",
      "White-labeled student & parent mobile applications",
      "24/7 dedicated emergency incident response",
    ],
    deployment: "On-Premise / Air-Gapped",
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
          eyebrow="Predictable Institutional Pricing"
          title="Transparent Plans for Every Campus Scale"
          description="Zero hidden hardware lock-ins. Use standard webcams and IP cameras with our pre-calibrated edge intelligence containers."
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
                  {/* Plan Badge & Header */}
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

                  {/* Price */}
                  <div className="mt-6 pb-6 border-b border-white/[0.08]">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl sm:text-4xl font-semibold text-hi">
                        {plan.priceInr}
                      </span>
                      <span className="text-[12px] font-mono text-faint">/{plan.period}</span>
                    </div>
                    <span className="mt-1 block font-mono text-[11px] text-spotify">
                      {plan.capacity}
                    </span>
                  </div>

                  {/* Feature list */}
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
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        {/* View Full Comparison CTA */}
        <div className="mt-12 text-center">
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-wider text-accent hover:text-white transition-colors"
          >
            <span>View Full Feature Matrix, Support SLAs & Deployment Specifications</span>
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
