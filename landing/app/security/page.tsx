"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  FileCheck,
  Fingerprint,
  KeyRound,
  Lock,
  Radar,
  Radio,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserCheck,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoModal } from "@/components/demo-modal";
import { PilotModal } from "@/components/pilot-modal";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Reveal } from "@/components/ui/reveal";

type SecurityCategory =
  | "all"
  | "biometrics"
  | "encryption"
  | "liveness"
  | "rbac"
  | "compliance";

const PILLARS = [
  {
    id: "biometrics",
    icon: Fingerprint,
    category: "biometrics",
    title: "1. Biometric Data Handling & Zero-Photo Policy",
    tag: "ArcFace v2.4 · INT8 Quantized",
    badgeColor: "text-accent border-accent/30 bg-accent/10",
    description:
      "When a campus enrolls a student or staff member, SmartFace converts facial landmark geometry into a 512-dimension normalized mathematical vector embedding.",
    details: [
      "Ephemeral volatile RAM lifecycle: Raw camera frames exist only in memory for ~180 milliseconds during landmark feature extraction, then are immediately zeroed out.",
      "Zero raw image storage: No photograph, JPEG, or visual image is ever written to disk, edge SSDs, or central cloud storage databases.",
      "Mathematical irreversibility: A 512-dim embedding is a one-way mathematical projection. It is mathematically impossible to reconstruct a human face from a cosine vector.",
      "Cosine distance matching: Verification compares vectors using cosine similarity (threshold 0.94), never pixel matching.",
    ],
  },
  {
    id: "encryption",
    icon: Lock,
    category: "encryption",
    title: "2. Military-Grade Cryptographic Encryption",
    tag: "AES-256 & TLS 1.3 Enforced",
    badgeColor: "text-spotify border-spotify/30 bg-spotify/10",
    description:
      "All persistent data, transmission channels, and dynamic verification tokens utilize industry-standard cryptographic primitives.",
    details: [
      "Data in transit: Enforced TLS 1.3 with modern cipher suites for all edge-to-cloud sync and browser communications.",
      "Data at rest: AES-256 encryption across all PostgreSQL pgvector tables, edge SQLite WAL caches, and backup snapshots.",
      "HMAC-SHA256 rotating QR: Anti-proxy classroom QR codes rotate every 30 seconds with unique cryptographic salt, defeating forwarded screenshots.",
      "Zero client secrets: Secrets live exclusively in isolated server environment variables with zero bundle exposure.",
    ],
  },
  {
    id: "liveness",
    icon: Radar,
    category: "liveness",
    title: "3. Face Recognition Security & Liveness Detection",
    tag: "Passive 3D Anti-Spoofing (PAD)",
    badgeColor: "text-accent2 border-accent2/30 bg-accent2/10",
    description:
      "Advanced Presentation Attack Detection (PAD) algorithms verify biological vitality before any match is accepted.",
    details: [
      "Anti-screen protection: Detects digital pixel pitch, moiré distortion, and screen refresh flickering to block smartphone/tablet replays.",
      "Anti-print detection: Analyzes surface specular reflection and micro-textures to detect printed paper or photo cutouts.",
      "3D contour verification: Evaluates 3D facial depth contour maps, rejecting silicone masks, prosthetics, and static props.",
      "Strict FAR & FRR benchmarks: Calibrated to achieve False Acceptance Rate (FAR) < 0.001% and False Rejection Rate (FRR) < 0.2%.",
    ],
  },
  {
    id: "rbac",
    icon: KeyRound,
    category: "rbac",
    title: "4. Role-Based Access Control (RBAC)",
    tag: "Principle of Least Privilege",
    badgeColor: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    description:
      "Campus access is segmented across five independent, strictly isolated permission matrices with granular access controls.",
    details: [
      "Student Portal: Read-only access to personal attendance timestamps, streak badges, and Nexa AI study recommendations.",
      "Teacher Portal: Section-scoped access for starting lecture sessions, projecting rotating QR codes, and manual roster adjustments.",
      "Admin Sentinel: Institutional command center for gate telemetry, edge node health, enrollment calibration, and fraud alerts.",
      "Parent Portal: Restricted exclusively to their verified enrolled child's arrival timestamps and digital leave submission.",
      "Super Admin: Multi-tenant tenant configuration, institutional license management, and platform-wide configuration.",
    ],
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    category: "biometrics",
    title: "5. Data Privacy & Sovereignty",
    tag: "Edge-First Architecture",
    badgeColor: "text-spotify border-spotify/30 bg-spotify/10",
    description:
      "SmartFace is engineered with privacy-by-design, keeping sensitive operational data under institutional sovereign control.",
    details: [
      "On-premise edge computing: Biometric vector matching runs locally on campus kiosks, eliminating constant cloud roundtrips.",
      "Strict data residency: Cloud tenants reside in geographically sovereign data centers adhering to national data boundaries.",
      "Zero AI training use: Your campus vectors and attendance logs are never used to train public LLMs or proprietary third-party models.",
      "Zero commercial monetization: Student and faculty data is never sold, licensed, or shared with data brokers or advertising networks.",
    ],
  },
  {
    id: "consent",
    icon: UserCheck,
    category: "compliance",
    title: "6. Consent Management & Right to Erasure",
    tag: "GDPR & DPDP Act Ready",
    badgeColor: "text-accent border-accent/30 bg-accent/10",
    description:
      "Institutions maintain complete legal consent lifecycle controls for all campus constituents.",
    details: [
      "Digital opt-in onboarding: Explicit consent collected upon initial enrollment with clear notice regarding vector embedding usage.",
      "Minor student consent: Automated parent/guardian co-approval flows for K-12 and underage collegiate students.",
      "Right to be forgotten: Authorised administrators can permanently delete any profile and associated vector embeddings with immediate effect.",
      "Alternative check-in provisions: Non-biometric fallbacks (rotating QR code or manual teacher check-in) available for any opting-out individuals.",
    ],
  },
  {
    id: "audit",
    icon: FileCheck,
    category: "encryption",
    title: "7. Tamper-Evident Audit Logging",
    tag: "Cryptographic Audit Chain",
    badgeColor: "text-accent2 border-accent2/30 bg-accent2/10",
    description:
      "Every check-in, administrative modification, and roster override is recorded with forensic accountability.",
    details: [
      "Append-only architecture: Audit logs cannot be modified, back-dated, or overwritten, even by institutional administrators.",
      "Granular attribution: Logs capture exact timestamp, gate ID, camera terminal, operator ID, and verification confidence score.",
      "Legal and accreditation defensibility: Provides verifiable attendance proof for NAAC, NBA, ABET, and university board inspections.",
      "Real-time intrusion alerts: Flagged anomalies (e.g., simultaneous gate punches across campus) trigger instant sentinel notifications.",
    ],
  },
  {
    id: "statutory",
    icon: Scale,
    category: "compliance",
    title: "8. Statutory Compliance Practices",
    tag: "Statutory Legal Frameworks",
    badgeColor: "text-spotify border-spotify/30 bg-spotify/10",
    description:
      "Engineered from the ground up to comply with global and national student privacy and biometric regulations.",
    details: [
      "India DPDP Act 2023: Complies with statutory data fiduciary requirements, purpose limitation, and child privacy safeguards.",
      "US FERPA Aligned: Complies with student educational record confidentiality and parental disclosure guidelines.",
      "ISO/IEC 27001 Aligned: Follows established information security management policies, vulnerability scanning, and access controls.",
      "SOC 2 Type II Readiness: Built on audit-logged microservices, zero-trust network policies, and automated security monitoring.",
    ],
  },
];

export default function SecurityPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [pilotOpen, setPilotOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SecurityCategory>("all");
  const [activeVectorIndex, setActiveVectorIndex] = useState(14);
  const reduceMotion = useReducedMotion();
  const headlineRef = useRef<HTMLHeadingElement>(null);

  // Kinetic Hero Text Animation matching ByTune Space
  useEffect(() => {
    const lines = headlineRef.current?.querySelectorAll<HTMLElement>("[data-hero-line]");
    if (!lines?.length) return;

    if (reduceMotion) {
      lines.forEach((line) => {
        line.style.transform = "none";
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(lines, {
        y: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.12,
        delay: 0.1,
      });
    }, headlineRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  // Vector Matrix cycling animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVectorIndex((prev) => (prev + 1) % 64);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const filteredPillars =
    activeFilter === "all"
      ? PILLARS
      : PILLARS.filter((p) => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-bg0 text-mid selection:bg-accent/30 selection:text-white">
      <SiteHeader onOpenDemo={() => setDemoOpen(true)} onOpenPilot={() => setPilotOpen(true)} />

      <main className="relative pb-32 pt-28 sm:pt-36">
        {/* ===================================================================
         * Ambient Ambient Lighting & Grid Glow (ByTune Spec)
         * =================================================================== */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-[0.2]" />
          <div
            className="absolute -top-[140px] left-1/2 -translate-x-1/2 h-[560px] w-[950px] rounded-full opacity-35 blur-[140px] pointer-events-none animate-glow-breathe"
            style={{
              background:
                "radial-gradient(circle, rgba(143,139,255,0.35) 0%, rgba(111,216,255,0.18) 50%, transparent 75%)",
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
          {/* Back to Home Navigation Pill */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-mid transition hover:border-white/20 hover:text-hi shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Platform Home
            </Link>
          </div>

          {/* ===================================================================
           * Hero Header — ByTune Kinetic Stagger Typography & Live Pulse
           * =================================================================== */}
          <div className="max-w-4xl">
            {/* Live Cryptographic Heartbeat Pill */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--hairline)] bg-[rgba(16,16,22,0.85)] backdrop-blur-md px-3.5 py-1.5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_20px_rgba(0,0,0,0.4)] mb-6">
              <span className="flex h-3.5 items-end gap-[2.5px]" aria-hidden>
                {[0, 1, 2, 3].map((bar) => (
                  <span
                    key={bar}
                    className="w-[2.5px] origin-bottom rounded-full bg-spotify"
                    style={{
                      height: "100%",
                      animation: `LiveCount_eq 1.05s var(--ease-in-out) ${bar * 0.14}s infinite`,
                    }}
                  />
                ))}
              </span>
              <span className="font-mono text-[11px] tabular-nums tracking-wide text-mid">
                <span className="text-hi font-medium">Zero-Photo Vector Guard</span> · Active
              </span>
              <span className="h-3 w-px bg-white/15" aria-hidden />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-400">
                DPDP & FERPA Compliant
              </span>
            </div>

            {/* Kinetic Section Headline */}
            <h1
              ref={headlineRef}
              className="font-display text-[2.75rem] font-medium leading-[1.02] tracking-[-0.035em] text-hi sm:text-[3.75rem] lg:text-[4.75rem] xl:text-[80px] xl:leading-[84px] xl:tracking-[-2.8px]"
            >
              <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
                <span
                  data-hero-line
                  style={{ transform: "translateY(112%)" }}
                  className="block will-change-transform text-hi"
                >
                  Security & Biometric
                </span>
              </span>
              <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
                <span
                  data-hero-line
                  style={{ transform: "translateY(112%)" }}
                  className="block will-change-transform text-shimmer-accent font-medium"
                >
                  Data Governance.
                </span>
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-[16px] sm:text-[18px] leading-[28px] text-mid">
              SmartFace treats identity as an immutable mathematical trust. Our zero-photo storage architecture, edge-first inference nodes, and cryptographic verification ensure that student biometrics remain irreversible numbers, never exposed images.
            </p>
          </div>

          {/* ===================================================================
           * Interactive ByTune Vector Matrix & Live Liveness Simulator Card
           * =================================================================== */}
          <div className="mt-14 card-bytune rounded-[24px] p-6 sm:p-10 border border-white/10 bg-[#0e0e14]/90 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-12 items-center">
              {/* Left Column: 512-dim ArcFace Live Matrix Representation */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-accent" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-hi font-semibold">
                      ArcFace 512-dim Mathematical Vector Matrix
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-spotify bg-spotify/10 border border-spotify/20 px-2 py-0.5 rounded-full">
                    Cosine 0.962 (Verified)
                  </span>
                </div>

                <p className="text-[13px] text-mid leading-relaxed">
                  Every face becomes a 512-float coordinate array. Verification matches cosine distance in RAM; zero photographs are ever saved to disk.
                </p>

                {/* 64-Cell Vector Display Grid */}
                <div
                  aria-hidden
                  className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5 p-3 rounded-xl border border-white/[0.08] bg-black/60 shadow-inner"
                >
                  {Array.from({ length: 64 }, (_, index) => {
                    const isLit = index === activeVectorIndex || (index + 12) % 64 === activeVectorIndex;
                    const baseOpacity = 0.15 + (((index * 41) % 13) / 13) * 0.65;
                    return (
                      <span
                        key={index}
                        className="aspect-square rounded-[3px] transition-all duration-150"
                        style={{
                          backgroundColor: isLit ? "#6fd8ff" : "#8f8bff",
                          opacity: isLit ? 1 : baseOpacity,
                          transform: isLit ? "scale(1.25)" : "scale(1)",
                          boxShadow: isLit ? "0 0 10px #6fd8ff" : "none",
                        }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between font-mono text-[11px] text-faint">
                  <span>Input: Volatile RAM (&lt;180ms)</span>
                  <span className="text-spotify">Purged on extraction</span>
                </div>
              </div>

              {/* Right Column: Presentation Attack Detection (PAD) Response */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Radar className="h-4 w-4 text-accent2" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-hi font-semibold">
                    Passive 3D Liveness Detection (PAD) Response
                  </span>
                </div>

                {[
                  {
                    attack: "Printed Photo Cutout",
                    defense: "Surface Specular Texture Mismatch",
                    status: "Blocked (0.04 Vitality)",
                    passed: false,
                  },
                  {
                    attack: "4K Smartphone / Tablet Screen",
                    defense: "Pixel Pitch & Moiré Frequency Detected",
                    status: "Blocked (0.11 Vitality)",
                    passed: false,
                  },
                  {
                    attack: "Contoured Human Face (3D Vitality)",
                    defense: "Depth Parallax & Micro-Blink Verified",
                    status: "Verified (0.98 Vitality)",
                    passed: true,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-[13px] ${item.passed
                        ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                        : "border-red-500/20 bg-red-950/15 text-red-300"
                      }`}
                  >
                    <div>
                      <span className="font-semibold block text-hi">{item.attack}</span>
                      <span className="font-mono text-[11px] text-mid mt-0.5">{item.defense}</span>
                    </div>
                    <span
                      className={`font-mono text-[10.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full ${item.passed
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===================================================================
           * Domain Filtering Pills (ByTune Chip Button Recipe)
           * =================================================================== */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "all", label: "All Governance Pillars" },
              { id: "biometrics", label: "Zero-Photo Biometrics" },
              { id: "encryption", label: "AES-256 Encryption" },
              { id: "liveness", label: "Anti-Spoofing Liveness" },
              { id: "rbac", label: "Role-Based Isolation" },
              { id: "compliance", label: "DPDP & Statutory Compliance" },
            ].map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveFilter(chip.id as SecurityCategory)}
                  className={`rounded-full h-9 px-4 text-[12.5px] font-medium transition-all cursor-pointer ${isActive
                      ? "bg-white text-black font-semibold shadow-md"
                      : "chip-bytune hover:text-hi hover:border-white/20"
                    }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* ===================================================================
           * Governance Pillars Grid — ByTune Floating Glass Cards
           * =================================================================== */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {filteredPillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <motion.div
                    key={pillar.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.28 }}
                  >
                    <SpotlightCard
                      spotlightColor="rgba(143, 139, 255, 0.18)"
                      className="card-bytune rounded-[22px] p-6 sm:p-8 h-full flex flex-col justify-between border border-white/10 bg-surface/90 shadow-xl"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                          <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-accent">
                              <Icon className="h-5 w-5" strokeWidth={1.8} />
                            </span>
                            <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint font-semibold">
                              Section 0{idx + 1}
                            </span>
                          </div>

                          <span
                            className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${pillar.badgeColor}`}
                          >
                            {pillar.tag}
                          </span>
                        </div>

                        <h2 className="mt-4 font-display text-xl sm:text-[22px] font-medium tracking-tight text-hi">
                          {pillar.title}
                        </h2>

                        <p className="mt-2 text-[14.5px] leading-[24px] text-mid">
                          {pillar.description}
                        </p>

                        <div className="mt-6 space-y-2.5">
                          {pillar.details.map((point, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-start gap-2.5 p-3 rounded-xl border border-white/[0.04] bg-white/[0.015] text-[13px] text-mid leading-relaxed"
                            >
                              <Shield className="h-3.5 w-3.5 text-accent shrink-0 mt-1" />
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ===================================================================
           * Statutory Compliance Badge Strip (ByTune Style)
           * =================================================================== */}
          <div className="mt-20 card-bytune rounded-[22px] p-8 border border-white/10 bg-[#0e0e14]/90 backdrop-blur-xl">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-spotify font-semibold">
                Legally Defensible Attendance
              </span>
              <h2 className="mt-2 font-display text-2xl font-medium text-hi">
                Accreditation & Statutory Frameworks
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: "India DPDP Act 2023", desc: "Digital Personal Data Protection fiduciary rules" },
                { title: "FERPA Compliant", desc: "US Family Educational Rights & Privacy Act" },
                { title: "ISO/IEC 27001 Aligned", desc: "Information security management controls" },
                { title: "NAAC / NBA Ready", desc: "Tamper-evident audit trail exports in 1-click" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center space-y-1.5"
                >
                  <CheckCircle2 className="h-5 w-5 text-spotify mx-auto" />
                  <h3 className="font-display text-[14px] font-semibold text-hi">{item.title}</h3>
                  <p className="font-mono text-[10.5px] text-faint leading-normal">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ===================================================================
           * Executive Legal Inquiry CTA Banner (ByTune Card 2)
           * =================================================================== */}
          <div className="mt-20 card-bytune rounded-[24px] p-8 sm:p-12 border border-white/10 bg-gradient-to-r from-accent/15 via-surface to-spotify/15 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div>
              <div className="inline-flex items-center gap-2 chip-bytune mb-3">
                <ShieldCheck className="h-3.5 w-3.5 text-spotify" />
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-mid">
                  Institutional DPIA & Security Pack
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                Request Campus Legal & DPIA Documentation
              </h2>
              <p className="mt-2 max-w-xl text-[14.5px] text-mid">
                Our collegiate legal and cryptographic architecture team can provide your university ethics board with Data Protection Impact Assessments (DPIA), architecture blueprints, and source audits.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="btn-pill-accent w-full sm:w-auto h-11 px-6 text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_24px_rgba(143,139,255,0.35)]"
              >
                <Sparkles className="h-4 w-4" />
                Schedule Security Review
              </button>
              <button
                type="button"
                onClick={() => setPilotOpen(true)}
                className="btn-pill-glass w-full sm:w-auto h-11 px-5 text-[14px] font-medium border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-hi flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Request Pilot Trial
              </button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter onOpenDemo={() => setDemoOpen(true)} onOpenPilot={() => setPilotOpen(true)} />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
      <PilotModal isOpen={pilotOpen} onClose={() => setPilotOpen(false)} />
    </div>
  );
}
