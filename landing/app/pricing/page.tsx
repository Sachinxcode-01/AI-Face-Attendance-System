"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  HelpCircle,
  Minus,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoModal } from "@/components/demo-modal";
import { PilotModal } from "@/components/pilot-modal";

const COMPARISON_CATEGORIES = [
  {
    category: "Core Biometrics & Verification",
    features: [
      { name: "ArcFace v2.4 512-dim Vector Extraction", starter: true, pro: true, enterprise: true, custom: true },
      { name: "Sub-300ms Edge Inference", starter: true, pro: true, enterprise: true, custom: true },
      { name: "Zero Raw Photo Storage Policy", starter: true, pro: true, enterprise: true, custom: true },
      { name: "Passive 3D Anti-Spoofing Liveness", starter: "Standard", pro: "Advanced", enterprise: "Military-Grade", custom: "Custom Hardware PAD" },
      { name: "Rotating Classroom HMAC-SHA256 QR", starter: true, pro: true, enterprise: true, custom: true },
      { name: "Local SQLite Offline Queue Buffer", starter: false, pro: true, enterprise: true, custom: true },
    ],
  },
  {
    category: "Portal & User Experiences",
    features: [
      { name: "Student Mobile & Web Portal", starter: true, pro: true, enterprise: true, custom: true },
      { name: "Teacher Session Command Portal", starter: true, pro: true, enterprise: true, custom: true },
      { name: "Parent Portal with Instant Arrival Alerts", starter: false, pro: true, enterprise: true, custom: true },
      { name: "Automated WhatsApp & SMS Notifications", starter: false, pro: "Included", enterprise: "Unlimited", custom: "Custom Gateway" },
      { name: "Nexa AI Student Retention Companion", starter: false, pro: true, enterprise: true, custom: true },
      { name: "Admin Sentinel Campus Radar & Telemetry", starter: "Basic", pro: "Full", enterprise: "Multi-Gate Cluster", custom: "Custom SOC Integration" },
    ],
  },
  {
    category: "Compliance & Enterprise Controls",
    features: [
      { name: "DPDP Act 2023 & FERPA Alignment", starter: true, pro: true, enterprise: true, custom: true },
      { name: "Cryptographic Tamper-Evident Audit Trail", starter: "30 Days", pro: "1 Year", enterprise: "7 Years (Statutory)", custom: "Custom Cold Archive" },
      { name: "1-Click NAAC & NBA Accreditation Reports", starter: false, pro: true, enterprise: true, custom: true },
      { name: "Bi-directional ERP / SIS Integration", starter: "CSV / Excel", pro: "REST API", enterprise: "Prebuilt (SAP / PeopleSoft / Custom)", custom: "Direct DB / Custom RPC" },
      { name: "Multi-Tenant Super Admin Console", starter: false, pro: false, enterprise: true, custom: true },
    ],
  },
  {
    category: "Support & Deployment SLA",
    features: [
      { name: "Support Channels", starter: "Email", pro: "Phone & Email", enterprise: "Dedicated TAM & Hotline", custom: "24/7 On-Call & On-Site" },
      { name: "Response SLA", starter: "24 business hours", pro: "4 business hours", enterprise: "1 hour priority", custom: "15-minute emergency SLA" },
      { name: "Deployment Architecture", starter: "Cloud Hosted", pro: "Hybrid Edge + Cloud", enterprise: "Private Cloud / Hybrid", custom: "100% Air-Gapped On-Prem" },
      { name: "Uptime Guarantee SLA", starter: "99.5%", pro: "99.8%", enterprise: "99.9%", custom: "99.99% High Availability" },
      { name: "Hardware Flexibility", starter: "Standard Webcams", pro: "IP / USB Cameras", enterprise: "Existing Turnstiles & CCTV", custom: "Any RTSP Stream / Custom Gate" },
    ],
  },
];

export default function PricingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [pilotOpen, setPilotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg0 text-mid">
      <SiteHeader onOpenDemo={() => setDemoOpen(true)} onOpenPilot={() => setPilotOpen(true)} />

      <main className="relative pb-28 pt-28 sm:pt-36">
        <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-mid transition hover:border-white/20 hover:text-hi"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1 font-mono text-[11px] uppercase tracking-widest text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Institutional Licensing
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-hi">
              Transparent, Scalable Campus Plans
            </h1>
            <p className="mt-6 text-[16px] sm:text-[17px] leading-relaxed text-mid">
              Deploy touchless facial attendance without buying proprietary proprietary turnstile hardware. Select the plan tailored to your campus size, or request a custom university rollout.
            </p>
          </div>

          {/* Pricing Tier Summary Cards */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Starter",
                price: "₹12",
                desc: "Departments & small institutes up to 500 students",
                cta: "Start 30-Day Pilot",
                action: () => setPilotOpen(true),
                highlight: false,
              },
              {
                name: "Professional",
                price: "₹24",
                desc: "Standard campuses up to 3,000 students (WhatsApp alerts included)",
                cta: "Book Campus Demo",
                action: () => setDemoOpen(true),
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "₹36",
                desc: "Multi-faculty colleges up to 15,000 students with ERP integration",
                cta: "Request Walkthrough",
                action: () => setDemoOpen(true),
                highlight: false,
              },
              {
                name: "Custom University",
                price: "Custom",
                desc: "Air-gapped on-premise deployment for 20,000+ student universities",
                cta: "Contact Sales",
                action: () => setDemoOpen(true),
                highlight: false,
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-[22px] border flex flex-col justify-between ${
                  p.highlight
                    ? "border-accent/60 bg-[rgba(16,16,24,0.95)] shadow-[0_0_24px_rgba(143,139,255,0.25)]"
                    : "border-white/10 bg-surface/85"
                }`}
              >
                <div>
                  <h2 className="font-display text-xl font-medium text-hi">{p.name}</h2>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-semibold text-hi">{p.price}</span>
                    <span className="font-mono text-[11px] text-faint">/student/mo</span>
                  </div>
                  <p className="mt-2 text-[13px] text-mid">{p.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={p.action}
                  className={`mt-6 w-full h-10 rounded-full text-[13px] font-semibold flex items-center justify-center cursor-pointer ${
                    p.highlight
                      ? "btn-pill-accent"
                      : "border border-white/15 bg-white/[0.04] text-hi hover:bg-white/[0.08]"
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Detailed Feature Comparison Matrix */}
          <div className="mt-24">
            <div className="mb-8">
              <span className="font-mono text-[11px] uppercase tracking-wider text-spotify font-semibold">
                Comprehensive Matrix
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
                Detailed Feature & Capability Comparison
              </h2>
            </div>

            <div className="overflow-x-auto rounded-[22px] border border-white/10 bg-surface/80 backdrop-blur-md">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="p-4 sm:p-5 font-mono text-[11px] uppercase tracking-wider text-mid">Capability</th>
                    <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-mid text-center">Starter</th>
                    <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-accent text-center font-bold">Professional</th>
                    <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-mid text-center">Enterprise</th>
                    <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-mid text-center">Custom Univ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {COMPARISON_CATEGORIES.map((cat, cIdx) => (
                    <tbody key={cIdx} className="divide-y divide-white/[0.06]">
                      <tr className="bg-white/[0.02]">
                        <td colSpan={5} className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-accent font-semibold">
                          {cat.category}
                        </td>
                      </tr>
                      {cat.features.map((feat, fIdx) => (
                        <tr key={fIdx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 text-hi font-medium">{feat.name}</td>
                          <td className="px-4 py-3.5 text-center text-mid font-mono text-[12px]">
                            {typeof feat.starter === "boolean" ? (
                              feat.starter ? <Check className="h-4 w-4 text-spotify mx-auto" /> : <Minus className="h-4 w-4 text-faint mx-auto" />
                            ) : (
                              feat.starter
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center text-hi font-mono text-[12px] bg-accent/[0.03]">
                            {typeof feat.pro === "boolean" ? (
                              feat.pro ? <Check className="h-4 w-4 text-spotify mx-auto" /> : <Minus className="h-4 w-4 text-faint mx-auto" />
                            ) : (
                              feat.pro
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center text-mid font-mono text-[12px]">
                            {typeof feat.enterprise === "boolean" ? (
                              feat.enterprise ? <Check className="h-4 w-4 text-spotify mx-auto" /> : <Minus className="h-4 w-4 text-faint mx-auto" />
                            ) : (
                              feat.enterprise
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center text-mid font-mono text-[12px]">
                            {typeof feat.custom === "boolean" ? (
                              feat.custom ? <Check className="h-4 w-4 text-spotify mx-auto" /> : <Minus className="h-4 w-4 text-faint mx-auto" />
                            ) : (
                              feat.custom
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deployment Options Deep Dive */}
          <div className="mt-20 grid gap-6 md:grid-cols-3">
            <div className="p-6 rounded-[22px] border border-white/10 bg-surface/80">
              <Server className="h-5 w-5 text-accent mb-3" />
              <h2 className="font-display text-lg font-medium text-hi">1. Cloud Hosted</h2>
              <p className="mt-2 text-[13px] text-mid leading-relaxed">
                Managed high-availability cloud infrastructure with instant updates, automatic daily backups, and zero local server maintenance required.
              </p>
            </div>

            <div className="p-6 rounded-[22px] border border-white/10 bg-surface/80">
              <Zap className="h-5 w-5 text-spotify mb-3" />
              <h2 className="font-display text-lg font-medium text-hi">2. Hybrid Edge Node</h2>
              <p className="mt-2 text-[13px] text-mid leading-relaxed">
                Biometric vector matching occurs locally on campus edge kiosks in &lt;300ms, caching check-ins during internet drops and syncing upon reconnect.
              </p>
            </div>

            <div className="p-6 rounded-[22px] border border-white/10 bg-surface/80">
              <Shield className="h-5 w-5 text-accent2 mb-3" />
              <h2 className="font-display text-lg font-medium text-hi">3. Air-Gapped On-Premise</h2>
              <p className="mt-2 text-[13px] text-mid leading-relaxed">
                100% physically isolated on-premise servers for government institutions, defense colleges, and universities requiring complete data sovereignty.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 card-bytune rounded-[22px] p-8 border border-white/10 bg-gradient-to-r from-accent/15 via-surface to-spotify/15 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h2 className="font-display text-2xl font-medium text-hi">
                Ready to evaluate SmartFace on your campus?
              </h2>
              <p className="mt-1 text-[14px] text-mid">
                Join 50+ collegiate institutions eliminating proxy attendance today.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="btn-pill-accent h-11 px-6 text-[14px] font-semibold cursor-pointer"
              >
                Book College Demo
              </button>
              <button
                type="button"
                onClick={() => setPilotOpen(true)}
                className="btn-pill-glass h-11 px-5 text-[14px] font-medium border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-hi cursor-pointer"
              >
                Apply for Pilot
              </button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter onOpenDemo={() => setDemoOpen(true)} />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
      <PilotModal isOpen={pilotOpen} onClose={() => setPilotOpen(false)} />
    </div>
  );
}
