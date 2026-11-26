"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Eye,
  FileCheck,
  Fingerprint,
  KeyRound,
  Lock,
  Radar,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoModal } from "@/components/demo-modal";
import { PilotModal } from "@/components/pilot-modal";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { PRODUCT_SPECS } from "@/lib/content";

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
    title: "1. Biometric Data & Upload Lifecycle",
    tag: `${PRODUCT_SPECS.aiEngine} · 512-D`,
    badgeColor: "text-accent border-accent/30 bg-accent/10",
    description:
    "SmartFace converts facial images into 512-dimension L2-normalized float vectors for matching, with distinct lifecycles across API verification and local batch tools.",
    details: [
      "Live API verification (/v1/face/verify): Uploads (≤ 5 MB) are validated via magic bytes, decoded in memory, and cleared via del image_bytes in the finally block.",
      "Stored embeddings: BiometricProfile stores a 512-float array in MongoDB. Embeddings are sensitive biometric data (not anonymous or impossible to reconstruct) and are never exposed in /auth/privacy/export.",
      "Optional image storage paths: Legacy batch dataset training (data/dataset/) and local OpenCV intruder monitoring (data/Intruders/ or SecurityLog.image_base64) store images only when enabled by the institution.",
      "Cosine similarity matching: Default threshold is 0.60 (configurable 0.60–0.85 per policy) using 1:1 matching against the authenticated user's profile or 1:N legacy fallback.",
    ],
  },
  {
    id: "encryption",
    icon: Lock,
    category: "encryption",
    title: "2. Transport, Credential & Token Cryptography",
    tag: "TLS · Bcrypt 12 · HMAC-SHA256",
    badgeColor: "text-spotify border-spotify/30 bg-spotify/10",
    description:
    "Authentication, session rotation, and mobile offline queues use standard cryptographic primitives implemented across Node.js and Flutter.",
    details: [
      "Transport & storage: Production deployments use HTTPS/TLS in transit; encryption at rest relies on database/infrastructure configuration (e.g., MongoDB Atlas) and AES-256 HiveAesCipher on the Flutter offline queue.",
      "Password & session security: Passwords hash with bcrypt (cost 12). Access JWTs default to 15-minute expiry paired with httpOnly refresh cookies (7 days standard, 30 days remember-me) tracked in UserSession.",
      "Rotating QR tokens: Classroom QR tokens use timing-safe HMAC-SHA256 signatures valid for 20 seconds (+5s clock-skew tolerance) and require an active session.",
      "HTTP & API hardening: Express disables X-Powered-By, applies Helmet-style CSP/X-Frame-Options/nosniff/HSTS headers, strips NoSQL $/. keys, and uses strict production CORS allowlists.",
    ],
  },
  {
    id: "liveness",
    icon: Radar,
    category: "liveness",
    title: "3. Presentation Attack Controls & Known Limits",
    tag: "Single-Face + Rate Cooldowns",
    badgeColor: "text-accent2 border-accent2/30 bg-accent2/10",
    description:
    "SmartFace combines multi-layer software checks to deter spoofing and replay attacks, while documenting software-only RGB limitations honestly.",
    details: [
      "Single-face enforcement: Verification rejects frames with 0 faces or multiple faces (HTTP 422) and enforces 5 MB / 16 MP upload bounds.",
      "Rate limiting & cooldowns: FastAPI limits /v1/face/verify to 15 requests/min per IP under concurrency semaphore; Node enforces a 2-minute cooldown after 3 consecutive face failures.",
      "QR replay & proximity deterrents: 20-second HMAC tokens, unique { student_email, session_id } DB indexes, and optional Haversine classroom geofencing (100–150m default).",
      "Known limitation: Core software uses RGB camera input with lighting/multi-angle heuristics and is NOT ISO/IEC 30107-3 PAD certified. High-risk gates should combine physical supervision or optional IR/depth hardware.",
    ],
  },
  {
    id: "rbac",
    icon: KeyRound,
    category: "rbac",
    title: "4. Role-Based Access Control & Tenant Scoping",
    tag: "5 Core Roles + Hierarchy",
    badgeColor: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    description:
    "Every API route validates JWT sessions against UserSession and enforces role and institutional boundaries.",
    details: [
      "Student Portal: Scoped to personal attendance, heatmaps, leave requests, correction disputes, biometric opt-in/deletion, and Nexa AI.",
      "Teacher Portal: Session creation/QR generation, live roster monitoring, manual overrides, leave approvals, and dispute resolution.",
      "Admin Sentinel: Campus directory, dataset upload/training triggers, department analytics, and SecurityLog / AttendanceAuditLog review.",
      "Parent & Super Admin: Parent access requires confirmed ward linking; Super Admin governs multi-college tenants and global platform analytics.",
    ],
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    category: "biometrics",
    title: "5. Consent, Opt-Out Alternatives & AI Privacy",
    tag: "Opt-In · Non-Biometric Fallback",
    badgeColor: "text-spotify border-spotify/30 bg-spotify/10",
    description:
    "Biometric attendance is opt-in with non-biometric alternatives and PII-minimized AI assistant prompts.",
    details: [
      "Explicit consent & deletion: POST /auth/register-biometric records consent_given and consent_timestamp; DELETE /auth/biometric immediately deletes the BiometricProfile template.",
      "Non-biometric alternatives: Students who opt out can check in using rotating QR tokens or teacher/admin manual attendance recording.",
      "Nexa AI PII minimization: ai.js strips direct email, phone, and student IDs before sending prompts to Groq and grounds replies on deterministic MongoDB totals.",
      "Data export & deletion requests: Users can export profile/leave/dispute records via GET /auth/privacy/export and log deletion requests via POST /auth/privacy/delete-request.",
    ],
  },
  {
    id: "audit",
    icon: FileCheck,
    category: "encryption",
    title: "6. Audit Logging, Backups & Vulnerability Reporting",
    tag: "AttendanceAuditLog · BackupMetadata",
    badgeColor: "text-accent2 border-accent2/30 bg-accent2/10",
    description:
    "Security-relevant actions and attendance overrides are logged with actor, role, IP, and timestamp metadata.",
    details: [
      "Audit trail: AttendanceAuditLog records check-ins, biometric enrollment/deletion, disputes, and login/password events.",
      "Backups & DR scripts: Repository includes scripts/db_backup.py, scripts/supabase_backup.py, and BackupMetadata tracking.",
      "Incident & vulnerability reporting: Suspected security vulnerabilities can be reported directly to kalinganavarsachin@gmail.com for coordinated triage.",
      "Rate limiting: Auth, OTP, registration, password change, and demo routes are capped at 5 requests per 15 minutes per IP (60/min general API), returning HTTP 429 + Retry-After.",
    ],
  },
  {
    id: "statutory",
    icon: Scale,
    category: "compliance",
    title: "7. Regulatory Alignment vs. Formal Certifications",
    tag: "Self-Assessed Readiness",
    badgeColor: "text-spotify border-spotify/30 bg-spotify/10",
    description:
    "SmartFace implements technical controls intended to support privacy and accreditation workflows, while clearly distinguishing controls from formal third-party certifications.",
    details: [
      "No unverified certifications claimed: The SmartFace project does NOT currently hold an independent third-party ISO/IEC 27001, SOC 2 Type II, or ISO/IEC 30107-3 audit certificate.",
      "India DPDP Act 2023 & FERPA readiness: Consent tracking, template deletion, data export, and RBAC are implemented to support institutional compliance—final legal compliance depends on the deploying institution's DPIA and policies.",
      "Protection of minors: Parent portal linking requires student or admin confirmation; institutions enrolling minors must collect verifiable guardian consent under local law.",
      "NAAC / NBA audit exports: CSV, Excel, JSON, and HTML exports include reference IDs and timestamps to assist institutional accreditation reporting.",
    ],
  },
];

export default function SecurityPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [pilotOpen, setPilotOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SecurityCategory>("all");
  const [activeVectorIndex, setActiveVectorIndex] = useState(14);
  const [activeLifecycleStage, setActiveLifecycleStage] = useState(0);
  const reduceMotion = useReducedMotion();
  const headlineRef = useRef<HTMLHeadingElement>(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVectorIndex((prev) => (prev + 1) % 64);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setActiveLifecycleStage((prev) => (prev + 1) % 4);
    }, 2200);
    return () => clearInterval(stageTimer);
  }, []);

  const filteredPillars =
    activeFilter === "all"
      ? PILLARS
      : PILLARS.filter((p) => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-bg0 text-mid selection:bg-accent/30 selection:text-white">
      <SiteHeader onOpenDemo={() => setDemoOpen(true)} onOpenPilot={() => setPilotOpen(true)} />

      <main className="relative pb-32 pt-28 sm:pt-36">
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
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-mid transition hover:border-white/20 hover:text-hi shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Platform Home
            </Link>
          </div>

          <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2.5 rounded-full border border-[var(--hairline)] bg-[rgba(16,16,22,0.85)] backdrop-blur-md px-3.5 py-1.5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_20px_rgba(0,0,0,0.4)] mb-6"
                >
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
                    <span className="text-hi font-medium">Implemented Controls</span> · SmartFace {PRODUCT_SPECS.version}
                  </span>
                  <span className="h-3 w-px bg-white/15" aria-hidden />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-400">
                    Consent &amp; Deletion Ready
                  </span>
                </motion.div>

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
                      Security &amp; Biometric
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
                Transparent documentation of SmartFace&apos;s actual authentication, encryption, biometric vector lifecycle, and known security boundaries—without exaggerated claims or unverified certifications.
              </p>
          </div>

          {/* Interactive Vector Matrix & Live Verification Walkthrough (Illustrative Preview) */}
          <div className="mt-14 card-bytune rounded-[24px] p-6 sm:p-10 border border-white/10 bg-[#0e0e14]/90 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div aria-hidden className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
            <div className="absolute inset-x-0 -top-full h-full bg-gradient-to-b from-transparent via-accent/[0.04] to-transparent pointer-events-none animate-laser-scan" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-12 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-accent" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-hi font-semibold">
                      512-D Vector Visualization (Demo)
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-spotify bg-spotify/10 border border-spotify/20 px-2.5 py-0.5 rounded-full">
                    Threshold ≥ 0.60
                  </span>
                </div>

                <p className="text-[13px] text-mid leading-relaxed">
                  InsightFace `buffalo_l` (ResNet-50) computes an L2-normalized 512-float embedding. Live API verification clears the uploaded image buffer after inference; stored templates are still governed as sensitive biometric data.
                </p>

                <div
                  aria-hidden
                  className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5 p-3.5 rounded-xl border border-white/[0.08] bg-black/60 shadow-inner relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/[0.08] to-transparent pointer-events-none animate-loading-slide" />

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
                          transform: isLit ? "scale(1.3)" : "scale(1)",
                          boxShadow: isLit ? "0 0 12px #6fd8ff" : "none",
                        }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between font-mono text-[11px] text-faint">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Live verify: In-memory `image_bytes`
                  </span>
                  <span className="text-spotify font-medium flex items-center gap-1">
                    <Trash2 className="h-3 w-3" />
                    Cleared in `finally` block
                  </span>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Radar className="h-4 w-4 text-accent2 animate-spin-slow" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-hi font-semibold">
                      Implemented Anti-Abuse Gates
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-accent2 uppercase tracking-widest bg-accent2/10 border border-accent2/20 px-2 py-0.5 rounded-full">
                    Software Controls
                  </span>
                </div>

                    {[
                      {
                        attack: "Multiple Faces or Empty Frames",
                        defense: "FastAPI rejects len(faces) != 1 with HTTP 422",
                        level: 100,
                        status: "Enforced in Adapter",
                        passed: false,
                      },
                      {
                        attack: "Forwarded QR Screenshot After 20s",
                        defense: "HMAC-SHA256 20s window (+5s skew) + duplicate lock",
                        level: 85,
                        status: "Time-Boxed Token",
                        passed: false,
                      },
                      {
                        attack: "Single Live Enrolled User (≥0.60 Cosine)",
                        defense: "1:1 BiometricProfile match + optional geofence",
                        level: 92,
                        status: "Verified Flow",
                        passed: true,
                      },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.015, x: 2, transition: { duration: 0.2 } }}
                    className={`p-3.5 rounded-xl border flex flex-col gap-2 text-[13px] transition-all relative overflow-hidden ${item.passed
                            ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.12)]"
                            : "border-amber-500/20 bg-amber-950/15 text-amber-200"
                          }`}
                      >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold block text-hi">{item.attack}</span>
                              <span className="font-mono text-[11px] text-mid mt-0.5">{item.defense}</span>
                            </div>
                            <span
                              className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 ${item.passed
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-200 border border-amber-500/30"
                                }`}
                            >
                              {item.status}
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-0.5">
                      <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.level}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.15 }}
                              className={`h-full rounded-full ${item.passed
                                  ? "bg-gradient-to-r from-emerald-500 to-spotify"
                                  : "bg-gradient-to-r from-amber-500 to-amber-300"
                                }`}
                            />
                          </div>
                      </motion.div>
                    ))}
            </div>
          </div>
        </div>

              {/* API Verification Request Lifecycle */}
              <div className="mt-16 card-bytune rounded-[24px] p-6 sm:p-8 border border-white/10 bg-[#0c0c12]/90 backdrop-blur-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-white/[0.08]">
                  <div>
                    <span className="font-mono text-[10.5px] uppercase tracking-widest text-spotify font-semibold flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 animate-pulse" />
                      Live Verification Request Lifecycle
                    </span>
                    <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium text-hi">
                      How `/attendance/mark/face` &amp; `/v1/face/verify` Process Frames
                    </h2>
                  </div>
                  <span className="font-mono text-[11px] text-faint px-3 py-1 rounded-full border border-white/10 bg-white/[0.02]">
                    Timeout: <span className="text-white font-medium">15s AI / 18s Gateway</span>
                  </span>
                </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              {[
                                {
                                  step: "01",
                                  time: "Upload & Auth",
                                  title: "Memory Upload & Magic Bytes",
                                  desc: "Multer memoryStorage accepts ≤ 5 MB JPEG/PNG/WebP; FastAPI validates magic signatures and IP rate limits.",
                                  icon: Eye,
                                  color: "text-accent",
                                },
                                {
                                  step: "02",
                                  time: "Detection",
                                  title: "RetinaFace Single-Face Gate",
                                  desc: "InsightFace buffalo_l detects faces under concurrency semaphore and rejects 0 or >1 faces.",
                                  icon: Radar,
                                  color: "text-accent2",
                                },
                                {
                                  step: "03",
                                  time: "Embedding",
                                  title: "512-D Cosine Match",
                                  desc: "ResNet-50 extracts an L2-normalized 512-float vector and matches against BiometricProfile (≥ 0.60).",
                                  icon: Cpu,
                                  color: "text-amber-400",
                                },
                                {
                                  step: "04",
                                  time: "Cleanup",
                                  title: "Buffer Cleanup & Audit",
                                  desc: "image_bytes is deleted in FastAPI's finally block; Express writes Attendance and AttendanceAuditLog.",
                                  icon: Trash2,
                                  color: "text-spotify",
                                },
                              ].map((stage, sIdx) => {
                                const Icon = stage.icon;
                                const isActive = activeLifecycleStage === sIdx;
                                return (
                                  <motion.div
                                    key={sIdx}
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    onClick={() => setActiveLifecycleStage(sIdx)}
                                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative ${isActive
                                        ? "border-accent/60 bg-accent/[0.08] shadow-[0_0_20px_rgba(143,139,255,0.2)]"
                                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.05]">
                                        <Icon className={`h-4 w-4 ${stage.color}`} />
                                      </span>
                                      <div>
                                        <span className="font-mono text-[10px] text-faint uppercase block">
                                          Stage {stage.step}
                                        </span>
                                            <span className="font-mono text-[10.5px] text-white/80 font-medium">
                                              {stage.time}
                                            </span>
                                        </div>
                                      </div>

                            <h3 className="font-display text-[15px] font-semibold text-hi mb-1">
                              {stage.title}
                            </h3>
                            <p className="text-[12px] text-mid leading-relaxed">
                              {stage.desc}
                            </p>
                          </motion.div>
                        );
              })}
                      </div>
          </div>

          {/* Domain Filtering Pills */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "all", label: "All Governance Pillars" },
              { id: "biometrics", label: "Biometrics & Consent" },
              { id: "encryption", label: "Cryptography & Audit" },
              { id: "liveness", label: "Anti-Spoofing & Limits" },
              { id: "rbac", label: "Role-Based Access" },
              { id: "compliance", label: "Compliance Transparency" },
            ].map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveFilter(chip.id as SecurityCategory)}
                  className={`relative rounded-full h-9 px-4 text-[12.5px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-black font-semibold shadow-md"
                      : "chip-bytune hover:text-hi hover:border-white/20"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

                    {/* Governance Pillars Grid */ }
                    <div className="mt-10 grid gap-6 md:grid-cols-2">
                      <AnimatePresence mode="popLayout">
                        {filteredPillars.map((pillar, idx) => {
                          const Icon = pillar.icon;
                          return (
                            <motion.div
                              key={pillar.id}
                              layout
                              initial={{ opacity: 0, y: 18 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              whileHover={{ y: -6, transition: { duration: 0.2 } }}
                              className="h-full"
                            >
                              <SpotlightCard
                                spotlightColor="rgba(143, 139, 255, 0.22)"
                                className="card-bytune rounded-[22px] p-6 sm:p-8 h-full flex flex-col justify-between border border-white/10 bg-surface/90 shadow-xl group hover:border-white/25 transition-all duration-300"
                              >
                                <div>
                                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                                    <div className="flex items-center gap-3">
                                      <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-accent group-hover:scale-110 group-hover:border-accent/40 transition-all duration-300">
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

                                  <h2 className="mt-4 font-display text-xl sm:text-[22px] font-medium tracking-tight text-hi group-hover:text-accent transition-colors">
                                    {pillar.title}
                                  </h2>

                                  <p className="mt-2 text-[14.5px] leading-[24px] text-mid">
                                    {pillar.description}
                                  </p>

                                  <div className="mt-6 space-y-2.5">
                                    {pillar.details.map((point, pIdx) => (
                                      <motion.div
                                        key={pIdx}
                                        whileHover={{ x: 3, transition: { duration: 0.15 } }}
                                        className="flex items-start gap-2.5 p-3 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/[0.08] text-[13px] text-mid leading-relaxed transition-colors"
                                      >
                                        <Shield className="h-3.5 w-3.5 text-accent shrink-0 mt-1" />
                                        <span>{point}</span>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </SpotlightCard>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {/* Compliance Distinction Strip */ }
          <div className="mt-20 card-bytune rounded-[22px] p-8 border border-white/10 bg-[#0e0e14]/90 backdrop-blur-xl relative overflow-hidden">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-spotify font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Compliance &amp; Certification Transparency
              </span>
              <h2 className="mt-2 font-display text-2xl font-medium text-hi">
                Technical Readiness vs. Formal Third-Party Certification
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "DPDP Act 2023 (Controls)",
                  desc: "Consent capture, template deletion & export APIs implemented; campus legal review required.",
                },
                {
                  title: "FERPA (Institutional Scope)",
                  desc: "RBAC & verified ward linking support student record controls; governed by campus policy.",
                },
                {
                  title: "ISO 27001 / SOC 2 Status",
                  desc: "Security headers, rate limits & audit logs implemented; NO formal third-party audit certificate held.",
                },
                {
                  title: "NAAC / NBA Exports",
                  desc: "CSV, Excel, JSON & HTML reports with timestamps & audit logs to support accreditation prep.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
                  className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center space-y-1.5 hover:border-spotify/30 hover:bg-spotify/[0.03] transition-all cursor-default group"
                >
                  <div className="relative inline-flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-spotify group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-display text-[14px] font-semibold text-hi">{item.title}</h3>
                  <p className="font-mono text-[10.5px] text-faint leading-normal">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <motion.div
            whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
            className="mt-20 card-bytune rounded-[24px] p-8 sm:p-12 border border-white/10 bg-gradient-to-r from-accent/15 via-surface to-spotify/15 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 chip-bytune mb-3">
                <ShieldCheck className="h-3.5 w-3.5 text-spotify" />
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-mid">
                  Architecture &amp; Source Audit
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                Review the Codebase or Request a Security Walkthrough
              </h2>
              <p className="mt-2 max-w-xl text-[14.5px] text-mid">
                Because SmartFace is open source under MIT, your institutional IT and privacy teams can inspect every controller, schema, and model adapter directly prior to deployment.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setDemoOpen(true)}
                className="btn-pill-accent w-full sm:w-auto h-11 px-6 text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_24px_rgba(143,139,255,0.35)]"
              >
                <Sparkles className="h-4 w-4" />
                Schedule Walkthrough
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setPilotOpen(true)}
                className="btn-pill-glass w-full sm:w-auto h-11 px-5 text-[14px] font-medium border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-hi flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Request Pilot Trial
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>

      <SiteFooter onOpenDemo={() => setDemoOpen(true)} onOpenPilot={() => setPilotOpen(true)} />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
      <PilotModal isOpen={pilotOpen} onClose={() => setPilotOpen(false)} />
    </div>
                );
}
