"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
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
      { name: "Bi-directional ERP / SIS Integration", starter: "CSV / Excel", pro: "REST API", enterprise: "Prebuilt (SAP / PeopleSoft)", custom: "Direct DB / Custom RPC" },
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

type PlanFilter = "all" | "starter" | "pro" | "enterprise" | "custom";

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
              Institutional Licensing
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-hi">
              Transparent, Scalable Campus Plans
            </h1>
            <p className="mt-6 text-[16px] sm:text-[17px] leading-relaxed text-mid">
              Deploy touchless facial attendance without buying proprietary turnstile hardware. Select the plan tailored to your campus size, or request a custom university rollout.
            </p>
          </div>

          {/* Pricing Tier Summary Cards */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                id: "starter",
                name: "Starter",
                price: "₹12",
                desc: "Departments & small institutes up to 500 students",
                cta: "Start 30-Day Pilot",
                action: () => setPilotOpen(true),
                highlight: false,
              },
              {
                id: "pro",
                name: "Professional",
                price: "₹24",
                desc: "Standard campuses up to 3,000 students (WhatsApp alerts included)",
                cta: "Book Campus Demo",
                action: () => setDemoOpen(true),
                highlight: true,
              },
              {
                id: "enterprise",
                name: "Enterprise",
                price: "₹36",
                desc: "Multi-faculty colleges up to 15,000 students with ERP integration",
                cta: "Request Walkthrough",
                action: () => setDemoOpen(true),
                highlight: false,
              },
              {
                id: "custom",
                name: "Custom University",
                price: "Custom",
                desc: "Air-gapped on-premise deployment for 20,000+ student universities",
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
                    <span className="font-mono text-[11px] text-faint">/student/mo</span>
                  </div>
                  <p className="mt-2 text-[13px] text-mid leading-relaxed">{p.desc}</p>
                </div>
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
              </motion.div>
            ))}
          </div>

          {/* Detailed Feature Comparison Matrix */}
          <div className="mt-24">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-spotify font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Comprehensive Matrix
                </span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
                  Detailed Feature &amp; Capability Comparison
                </h2>
                <p className="mt-1 text-[13.5px] text-faint">
                  Compare specifications, SLA levels, and biometric guarantees across tiers.
                </p>
              </div>

              {/* Mobile Filter Selector */}
              <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 text-[12px] font-mono">
                <span className="text-faint text-[11px] mr-1">View:</span>
                {[
                  { id: "all", label: "All Tiers" },
                  { id: "starter", label: "Starter" },
                  { id: "pro", label: "Professional" },
                  { id: "enterprise", label: "Enterprise" },
                  { id: "custom", label: "Custom Univ" },
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

            {/* Horizontal Scroll Prompt for Mobile/Tablet */}
            <div className="flex items-center justify-between text-[11.5px] font-mono text-faint mb-2.5 px-1 md:hidden">
              <span className="flex items-center gap-1 text-accent">
                <MoveRight className="h-3.5 w-3.5 animate-pulse" />
                Swipe horizontally to compare tiers
              </span>
              <span>4 institutional plans</span>
            </div>

            {/* Responsive Comparison Table Container */}
            <div className="relative overflow-x-auto rounded-[22px] border border-white/10 bg-surface/90 backdrop-blur-xl shadow-2xl">
              <table className="w-full min-w-[880px] text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    {/* Sticky Capability Column Header */}
                    <th className="sticky left-0 bg-[#0c0c12]/98 backdrop-blur-md z-20 p-4 sm:p-5 font-mono text-[11px] uppercase tracking-wider text-mid w-[32%] min-w-[260px] border-r border-white/[0.08] shadow-[2px_0_8px_rgba(0,0,0,0.4)]">
                      Capability
                    </th>

                    {/* Starter Header */}
                    <th
                      className={`p-4 sm:p-5 font-mono text-[11px] uppercase tracking-wider text-mid text-center whitespace-nowrap min-w-[140px] ${
                        mobileFilter !== "all" && mobileFilter !== "starter" ? "hidden md:table-cell" : ""
                      }`}
                    >
                      Starter
                    </th>

                    {/* Professional Header (Highlighted) */}
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

                    {/* Enterprise Header */}
                    <th
                      className={`p-4 sm:p-5 font-mono text-[11px] uppercase tracking-wider text-mid text-center whitespace-nowrap min-w-[150px] ${
                        mobileFilter !== "all" && mobileFilter !== "enterprise" ? "hidden md:table-cell" : ""
                      }`}
                    >
                      Enterprise
                    </th>

                    {/* Custom University Header */}
                    <th
                      className={`p-4 sm:p-5 font-mono text-[11px] uppercase tracking-wider text-mid text-center whitespace-nowrap min-w-[170px] pr-6 ${
                        mobileFilter !== "all" && mobileFilter !== "custom" ? "hidden md:table-cell" : ""
                      }`}
                    >
                      Custom University
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {COMPARISON_CATEGORIES.map((cat, cIdx) => (
                    <>
                      {/* Section Category Header */}
                      <tr key={`cat-${cIdx}`} className="bg-white/[0.02]">
                        <td
                          colSpan={5}
                          className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-accent font-semibold border-t border-b border-white/[0.08]"
                        >
                          {cat.category}
                        </td>
                      </tr>

                      {/* Category Features */}
                      {cat.features.map((feat, fIdx) => (
                        <tr
                          key={`feat-${cIdx}-${fIdx}`}
                          className="hover:bg-white/[0.025] transition-colors group"
                        >
                          {/* Sticky Capability Name */}
                          <td className="sticky left-0 bg-[#0d0d14]/95 backdrop-blur-md z-10 px-5 py-3.5 text-hi font-medium border-r border-white/[0.08] shadow-[2px_0_8px_rgba(0,0,0,0.3)]">
                            <span className="group-hover:text-accent transition-colors">
                              {feat.name}
                            </span>
                          </td>

                          {/* Starter Value */}
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

                          {/* Professional Value (Highlighted Column) */}
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

                          {/* Enterprise Value */}
                          <td
                            className={`px-4 py-3.5 text-center text-mid font-mono text-[12px] ${
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

                          {/* Custom University Value */}
                          <td
                            className={`px-4 py-3.5 text-center text-mid font-mono text-[12px] pr-6 ${
                              mobileFilter !== "all" && mobileFilter !== "custom" ? "hidden md:table-cell" : ""
                            }`}
                          >
                            {typeof feat.custom === "boolean" ? (
                              feat.custom ? (
                                <Check className="h-4 w-4 text-spotify mx-auto" />
                              ) : (
                                <Minus className="h-4 w-4 text-faint mx-auto opacity-50" />
                              )
                            ) : (
                              <span className="font-sans text-[12.5px] text-mid">{feat.custom}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Action Footer for Matrix */}
            <div className="mt-8 p-6 rounded-[20px] border border-white/10 bg-surface/70 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-[15px] font-semibold text-hi">
                  Need custom multi-campus clustering or high-throughput turnstile hardware sizing?
                </h3>
                <p className="text-[12.5px] text-faint mt-0.5">
                  Our systems engineering team provides free architectural scoping and hardware validation for your campus.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="btn-pill-accent h-10 px-5 text-[13px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-[0_0_16px_rgba(143,139,255,0.3)]"
              >
                <span>Speak with an Architect</span>
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
                title: "1. Cloud Hosted",
                desc: "Managed high-availability cloud infrastructure with instant updates, automatic daily backups, and zero local server maintenance required.",
              },
              {
                icon: Zap,
                color: "text-spotify",
                title: "2. Hybrid Edge Node",
                desc: "Local inference container running on campus Raspberry Pi / mini PC / existing turnstile IPCs with automatic asynchronous cloud synchronization.",
              },
              {
                icon: Shield,
                color: "text-accent2",
                title: "3. 100% Air-Gapped",
                desc: "Complete on-premise Kubernetes or bare-metal cluster with zero external WAN connectivity, ideal for government and high-security defense institutes.",
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
