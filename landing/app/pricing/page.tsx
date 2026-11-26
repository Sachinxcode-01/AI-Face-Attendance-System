"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  MoveRight,
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
import { COMPANY_CONTACT } from "@/lib/constants";

const COMPARISON_CATEGORIES = [
  {
    category: "Core Biometrics & Verification",
    features: [
      { name: "InsightFace ArcFace (buffalo_l, ResNet-50) 512-D Vectors", opensource: true, starter: true, pro: true, enterprise: true },
      { name: "Configurable Cosine Similarity Threshold (Default 0.60)", opensource: true, starter: true, pro: true, enterprise: true },
      { name: "In-Memory Live Verification Upload Cleanup", opensource: true, starter: true, pro: true, enterprise: true },
      { name: "20s Rotating HMAC-SHA256 QR + Optional Geofence", opensource: true, starter: true, pro: true, enterprise: true },
      { name: "Flutter Mobile AES-256 Hive Offline Queue", opensource: true, starter: true, pro: true, enterprise: true },
      { name: "CUDA GPU Acceleration Support (Campus Node)", opensource: "Self-configured", starter: false, pro: "Supported", enterprise: "Supported" },
    ],
  },
  {
    category: "Portal & User Experiences",
    features: [
      { name: "Student, Teacher, Admin, Parent & Super Admin Portals", opensource: true, starter: "4 Core Roles", pro: "All 5 Roles", enterprise: "All 5 Roles" },
      { name: "Parent Portal & Absence Notice Workflows", opensource: true, starter: true, pro: true, enterprise: true },
      { name: "Email Alerts (Resend / Brevo) & SMS (Twilio / MSG91)", opensource: "Bring your keys", starter: "Email included", pro: "Email + SMS passthrough", enterprise: "Custom volume" },
      { name: "Nexa AI Assistant (Groq LLM + Deterministic DB)", opensource: "Bring your key", starter: false, pro: "Fair-use quota", enterprise: "Custom quota" },
      { name: "Attendance Correction Disputes & Leave Approvals", opensource: true, starter: true, pro: true, enterprise: true },
    ],
  },
  {
    category: "Governance, Exports & Integrations",
    features: [
      { name: "Biometric Consent Tracking & Self-Service Deletion", opensource: true, starter: true, pro: true, enterprise: true },
      { name: "AttendanceAuditLog & SecurityLog History", opensource: "Self-managed", starter: "90 Days", pro: "1 Year", enterprise: "Custom Retention" },
      { name: "CSV / Excel / JSON / HTML Report Exports", opensource: true, starter: true, pro: true, enterprise: true },
      { name: "SIS / LMS Integration", opensource: "OneRoster CSV", starter: "CSV / Excel", pro: "OneRoster CSV + GSheets", enterprise: "Beta LMS / Custom API" },
      { name: "Optional Supabase pgvector Sync", opensource: "Self-configured", starter: false, pro: "Optional", enterprise: "Optional" },
    ],
  },
  {
    category: "Commercial Terms, Hosting & Support",
    features: [
      { name: "Software License / Billing Frequency", opensource: "MIT (₹0)", starter: "₹12/student/mo (Annual)", pro: "₹24/student/mo (Annual)", enterprise: "Custom Annual Contract" },
      { name: "Student Capacity", opensource: "Self-managed", starter: "Up to 500", pro: "Up to 3,000", enterprise: "3,000–20,000+" },
      { name: "Taxes, Hardware & Installation", opensource: "N/A", starter: "GST, HW & install extra", pro: "GST, HW & install extra", enterprise: "Scoped in contract" },
      { name: "Support Channel & Target Response", opensource: "GitHub Issues", starter: "Email (2 bus. days)", pro: "Email & Call (1 bus. day)", enterprise: "Dedicated Onboarding" },
      { name: "Trial, Cancellation & Data Export", opensource: "Always open", starter: "30-day pilot · CSV/JSON exit", pro: "30-day notice · CSV/JSON exit", enterprise: "Custom SLA & exit terms" },
    ],
  },
];

type PlanFilter = "all" | "opensource" | "starter" | "pro" | "enterprise";

export default function PricingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [pilotOpen, setPilotOpen] = useState(false);
  const [mobileFilter, setMobileFilter] = useState<PlanFilter>("all");

  return (
    <div className="min-h-screen bg-bg0 text-mid selection:bg-accent/30 selection:text-white">
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
              Open Source &amp; Institutional Licensing
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-hi">
              Clear Separation: MIT Open Source vs. Managed Services
            </h1>
            <p className="mt-6 text-[16px] sm:text-[17px] leading-relaxed text-mid">
              Self-host SmartFace for free under the MIT license, or select a commercial plan for managed hosting, guided onboarding, and institutional support. Applicable GST/taxes, camera/server hardware, on-site installation, and pass-through SMS carrier fees are billed separately.
            </p>
          </div>

          {/* Pricing Tier Summary Cards */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                id: "opensource",
                name: "Open Source",
                price: "₹0",
                unit: "MIT codebase",
                desc: "Self-hosted Express, FastAPI, Next.js & Flutter source on your own infra",
                cta: "View on GitHub",
                href: COMPANY_CONTACT.github,
                highlight: false,
              },
              {
                id: "starter",
                name: "Starter Pilot",
                price: "₹12",
                unit: "/student/mo (annual)",
                desc: "Managed cloud evaluation for departments up to 500 students (30-day trial)",
                cta: "Start 30-Day Pilot",
                action: () => setPilotOpen(true),
                highlight: false,
              },
              {
                id: "pro",
                name: "Professional",
                price: "₹24",
                unit: "/student/mo (annual)",
                desc: "Managed cloud or hybrid LAN for campuses up to 3,000 students",
                cta: "Book Campus Demo",
                action: () => setDemoOpen(true),
                highlight: true,
              },
              {
                id: "enterprise",
                name: "Enterprise",
                price: "Custom",
                unit: "annual contract",
                desc: "Multi-college Super Admin deployments for 3,000–20,000+ students",
                cta: "Contact Sales",
                action: () => setDemoOpen(true),
                highlight: false,
              },
            ].map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`p-6 rounded-[22px] border flex flex-col justify-between transition-all duration-300 ${
                  p.highlight
                    ? "border-accent/60 bg-[rgba(16,16,24,0.95)] shadow-[0_0_28px_rgba(143,139,255,0.22)]"
                    : "border-white/10 bg-surface/85 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-medium text-hi">{p.name}</h2>
                    {p.highlight && (
                      <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-semibold">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-semibold text-hi">{p.price}</span>
                    <span className="font-mono text-[11px] text-faint">{p.unit}</span>
                  </div>
                  <p className="mt-2 text-[13px] text-mid leading-relaxed">{p.desc}</p>
                </div>
                {p.href ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 w-full h-10 rounded-full text-[13px] font-semibold flex items-center justify-center cursor-pointer transition border border-white/15 bg-white/[0.04] text-hi hover:bg-white/[0.08]"
                  >
                    {p.cta}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={p.action}
                    className={`mt-6 w-full h-10 rounded-full text-[13px] font-semibold flex items-center justify-center cursor-pointer transition ${
                      p.highlight
                        ? "btn-pill-accent shadow-[0_0_20px_rgba(143,139,255,0.35)]"
                        : "border border-white/15 bg-white/[0.04] text-hi hover:bg-white/[0.08]"
                    }`}
                  >
                    {p.cta}
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Detailed Feature Comparison Matrix */}
          <div className="mt-24">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-spotify font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Plan Breakdown
                </span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
                  Detailed Feature, Commercial &amp; Support Comparison
                </h2>
                <p className="mt-1 text-[13.5px] text-faint">
                  Compare open-source self-hosting against commercial managed plans, billing terms, and data export rights.
                </p>
              </div>

              <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 text-[12px] font-mono">
                <span className="text-faint text-[11px] mr-1">View:</span>
                {[
                  { id: "all", label: "All" },
                  { id: "opensource", label: "Open Source" },
                  { id: "starter", label: "Starter" },
                  { id: "pro", label: "Professional" },
                  { id: "enterprise", label: "Enterprise" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMobileFilter(tab.id as PlanFilter)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                      mobileFilter === tab.id
                        ? "bg-white text-black font-semibold"
                        : "border border-white/10 bg-white/[0.04] text-mid hover:text-hi"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11.5px] font-mono text-faint mb-2.5 px-1 md:hidden">
              <span className="flex items-center gap-1 text-accent">
                <MoveRight className="h-3.5 w-3.5 animate-pulse" />
                Swipe horizontally to compare tiers
              </span>
              <span>4 options</span>
            </div>

            <div className="relative overflow-x-auto rounded-[22px] border border-white/10 bg-surface/90 backdrop-blur-xl shadow-2xl">
              <table className="w-full min-w-[880px] text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="sticky left-0 bg-[#0c0c12]/98 backdrop-blur-md z-20 p-4 sm:p-5 font-mono text-[11px] uppercase tracking-wider text-mid w-[32%] min-w-[260px] border-r border-white/[0.08] shadow-[2px_0_8px_rgba(0,0,0,0.4)]">
                      Capability
                    </th>

                    <th
                      className={`p-4 sm:p-5 font-mono text-[11px] uppercase tracking-wider text-mid text-center whitespace-nowrap min-w-[140px] ${
                        mobileFilter !== "all" && mobileFilter !== "opensource" ? "hidden md:table-cell" : ""
                      }`}
                    >
                      Open Source
                    </th>

                    <th
                      className={`p-4 sm:p-5 font-mono text-[11px] uppercase tracking-wider text-mid text-center whitespace-nowrap min-w-[140px] ${
                        mobileFilter !== "all" && mobileFilter !== "starter" ? "hidden md:table-cell" : ""
                      }`}
                    >
                      Starter
                    </th>

                    <th
                      className={`p-4 sm:p-5 font-mono text-[11px] uppercase tracking-wider text-accent text-center font-bold whitespace-nowrap min-w-[170px] bg-accent/[0.06] border-x border-accent/25 ${
                        mobileFilter !== "all" && mobileFilter !== "pro" ? "hidden md:table-cell" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40 font-semibold">
                          Most Popular
                        </span>
                        <span>Professional</span>
                      </div>
                    </th>

                    <th
                      className={`p-4 sm:p-5 font-mono text-[11px] uppercase tracking-wider text-mid text-center whitespace-nowrap min-w-[170px] pr-6 ${
                        mobileFilter !== "all" && mobileFilter !== "enterprise" ? "hidden md:table-cell" : ""
                      }`}
                    >
                      Enterprise
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {COMPARISON_CATEGORIES.map((cat, cIdx) => (
                    <Fragment key={`cat-${cIdx}`}>
                      <tr className="bg-white/[0.02]">
                        <td
                          colSpan={5}
                          className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-accent font-semibold border-t border-b border-white/[0.08]"
                        >
                          {cat.category}
                        </td>
                      </tr>

                      {cat.features.map((feat, fIdx) => (
                        <tr
                          key={`feat-${cIdx}-${fIdx}`}
                          className="hover:bg-white/[0.025] transition-colors group"
                        >
                          <td className="sticky left-0 bg-[#0d0d14]/95 backdrop-blur-md z-10 px-5 py-3.5 text-hi font-medium border-r border-white/[0.08] shadow-[2px_0_8px_rgba(0,0,0,0.3)]">
                            <span className="group-hover:text-accent transition-colors">
                              {feat.name}
                            </span>
                          </td>

                          <td
                            className={`px-4 py-3.5 text-center text-mid font-mono text-[12px] ${
                              mobileFilter !== "all" && mobileFilter !== "opensource" ? "hidden md:table-cell" : ""
                            }`}
                          >
                            {typeof feat.opensource === "boolean" ? (
                              feat.opensource ? (
                                <Check className="h-4 w-4 text-spotify mx-auto" />
                              ) : (
                                <Minus className="h-4 w-4 text-faint mx-auto opacity-50" />
                              )
                            ) : (
                              <span className="font-sans text-[12.5px] text-mid">{feat.opensource}</span>
                            )}
                          </td>

                          <td
                            className={`px-4 py-3.5 text-center text-mid font-mono text-[12px] ${
                              mobileFilter !== "all" && mobileFilter !== "starter" ? "hidden md:table-cell" : ""
                            }`}
                          >
                            {typeof feat.starter === "boolean" ? (
                              feat.starter ? (
                                <Check className="h-4 w-4 text-spotify mx-auto" />
                              ) : (
                                <Minus className="h-4 w-4 text-faint mx-auto opacity-50" />
                              )
                            ) : (
                              <span className="font-sans text-[12.5px] text-mid">{feat.starter}</span>
                            )}
                          </td>

                          <td
                            className={`px-4 py-3.5 text-center text-hi font-mono text-[12px] bg-accent/[0.035] border-x border-accent/20 ${
                              mobileFilter !== "all" && mobileFilter !== "pro" ? "hidden md:table-cell" : ""
                            }`}
                          >
                            {typeof feat.pro === "boolean" ? (
                              feat.pro ? (
                                <Check className="h-4 w-4 text-spotify mx-auto" />
                              ) : (
                                <Minus className="h-4 w-4 text-faint mx-auto opacity-50" />
                              )
                            ) : (
                              <span className="font-sans text-[12.5px] text-hi font-medium">{feat.pro}</span>
                            )}
                          </td>

                          <td
                            className={`px-4 py-3.5 text-center text-mid font-mono text-[12px] pr-6 ${
                              mobileFilter !== "all" && mobileFilter !== "enterprise" ? "hidden md:table-cell" : ""
                            }`}
                          >
                            {typeof feat.enterprise === "boolean" ? (
                              feat.enterprise ? (
                                <Check className="h-4 w-4 text-spotify mx-auto" />
                              ) : (
                                <Minus className="h-4 w-4 text-faint mx-auto opacity-50" />
                              )
                            ) : (
                              <span className="font-sans text-[12.5px] text-mid">{feat.enterprise}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-6 rounded-[20px] border border-white/10 bg-surface/70 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-[15px] font-semibold text-hi">
                  Need campus infrastructure sizing or custom institutional terms?
                </h3>
                <p className="text-[12.5px] text-faint mt-0.5">
                  Request a technical consultation to scope cameras, GPU/CPU nodes, SMS carrier accounts, and pilot criteria.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="btn-pill-accent h-10 px-5 text-[13px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-[0_0_16px_rgba(143,139,255,0.3)]"
              >
                <span>Schedule Consultation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Deployment Options Deep Dive */}
          <div className="mt-20 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Server,
                color: "text-accent",
                title: "1. Managed Cloud Hosting",
                desc: "Managed Express gateway, FastAPI AI service, and MongoDB hosting with scheduled backups and zero campus server maintenance.",
              },
              {
                icon: Zap,
                color: "text-spotify",
                title: "2. Hybrid Campus LAN + Cloud",
                desc: "Run local OpenCV/FastAPI inference on campus workstations or GPU servers while syncing attendance and mobile apps through the cloud.",
              },
              {
                icon: Shield,
                color: "text-accent2",
                title: "3. Self-Hosted MIT / Campus On-Prem",
                desc: "Deploy the open-source stack directly inside your institution's private network with full control over MongoDB, SMTP, and data residency.",
              },
            ].map((dep, idx) => {
              const Icon = dep.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="p-6 rounded-[22px] border border-white/10 bg-surface/80 backdrop-blur-md transition-colors hover:border-white/20"
                >
                  <Icon className={`h-5 w-5 ${dep.color} mb-3`} />
                  <h3 className="font-display text-lg font-medium text-hi">{dep.title}</h3>
                  <p className="mt-2 text-[13px] text-mid leading-relaxed">{dep.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      <SiteFooter onOpenDemo={() => setDemoOpen(true)} onOpenPilot={() => setPilotOpen(true)} />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
      <PilotModal isOpen={pilotOpen} onClose={() => setPilotOpen(false)} />
    </div>
  );
}
