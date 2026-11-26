"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  GraduationCap,
  Presentation,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

type Stakeholder = "teachers" | "administrators" | "parents" | "students";

  /**
   * Illustrative stakeholder perspectives and deployment demonstration scenarios.
   * These are sample scenarios designed to show intended workflows, not verified customer endorsements.
   */
  const SCENARIO_VIEWS = {
    teachers: [
      {
        name: "Faculty Workflow Scenario",
        role: "Illustrative Department Lecture Use Case",
        quote:
        "Instead of spending the opening minutes of a 50-minute class calling names, faculty start a session, project the 20-second rotating QR code, and review exceptions or manual overrides from the live roster.",
        metric: "Session QR + Override",
      },
      {
        name: "Lab & Practical Assessment Scenario",
        role: "Illustrative High-Enrollment Lab Use Case",
        quote:
        "Short-lived HMAC-SHA256 QR tokens paired with optional classroom geofencing and duplicate check-in locks help deter forwarded-screenshot check-ins during large lecture sessions.",
        metric: "20s Token + Geofence",
      },
      {
        name: "Dispute & Leave Review Scenario",
        role: "Illustrative Faculty Administration Use Case",
        quote:
        "When camera lighting or occlusion causes a recognition failure, students submit a correction dispute with reason categories, and faculty resolve or override records with an audit trail.",
        metric: "Audit-Logged Overrides",
      },
    ],
    administrators: [
      {
        name: "Accreditation Audit Scenario",
        role: "Illustrative Registrar & Quality Cell Use Case",
        quote:
        "Administrators export attendance summaries and detailed ledgers in CSV, Excel, JSON, or HTML formats with reference IDs and audit-log attribution for internal and accreditation reviews.",
        metric: "CSV / Excel / JSON Export",
      },
      {
        name: "Security & Sentinel Scenario",
        role: "Illustrative Campus Security Desk Use Case",
        quote:
        "When local kiosk camera monitoring detects sustained unrecognized faces, SecurityLog captures the event, broadcasts WebSocket alerts to authorized admins, and sends configured email notices.",
        metric: "WebSocket + Email Alerts",
      },
      {
        name: "Privacy Governance Scenario",
        role: "Illustrative Institutional IT & Ethics Review",
        quote:
        "By converting live check-in uploads to 512-D embeddings in memory and supporting consent toggles plus template deletion via /auth/biometric, institutions can align workflows with campus privacy policies.",
        metric: "Consent & Template Delete",
      },
    ],
    parents: [
      {
        name: "Verified Guardian Access Scenario",
        role: "Illustrative Parent Portal Use Case",
        quote:
        "Once linked with student or administrator confirmation, guardians view their ward's attendance percentage, recent check-ins, and leave status directly in the Parent Portal.",
        metric: "Verified Ward Linking",
      },
      {
        name: "Absence Notice & Leave Scenario",
        role: "Illustrative Guardian Communication Use Case",
        quote:
        "Parents can submit absence notices directly through the portal, creating a tracked Pending leave record for faculty review instead of relying on informal phone calls.",
        metric: "Digital Absence Notice",
      },
    ],
    students: [
      {
        name: "Multi-Modal Check-In Scenario",
        role: "Illustrative Student Campus Experience",
        quote:
        "Students can mark attendance touchlessly via face verification or fall back to the rotating QR code if they prefer non-biometric check-in or face poor lighting.",
        metric: "Biometric or QR Choice",
      },
      {
        name: "Deterministic Standing & Nexa AI Scenario",
        role: "Illustrative Student Academic Tracking",
        quote:
        "Students view exact basis-point attendance calculations, subject heatmaps, and streak progress, and ask Nexa AI questions answered from their recorded database figures.",
        metric: "75% Threshold Planner",
      },
    ],
  };

  const CASE_STUDIES = [
    {
      college: "Demonstration Scenario A: Large Lecture Hall",
      size: "Illustrative · ~3,000 Students",
      challenge:
      "Manual paper attendance in 120-seat halls consumes instructional time and makes screenshot or sheet-signing proxies difficult to audit.",
      solution:
      "Demonstrates Teacher Portal 20-second rotating HMAC-SHA256 QR projection paired with optional Haversine classroom geofencing and per-session duplicate locks.",
      results: [
        "Deterministic roster updates over WebSockets",
        "Time-boxed 20s QR tokens (+5s skew tolerance)",
        "Faculty manual override & student correction disputes",
      ],
      badge: "Demonstration Scenario",
    },
    {
      college: "Demonstration Scenario B: Multi-Campus Governance",
      size: "Illustrative · Multi-College Trust",
      challenge:
      "Institutions operating multiple constituent colleges need tenant-scoped user directories, role isolation, and standardized attendance exports.",
      solution:
      "Demonstrates Super Admin multi-tenant college configuration (`/admin/super-admin`), RBAC across five roles, and CSV/Excel/JSON/HTML reporting.",
      results: [
        "Tenant-scoped sessions, rosters, and security logs",
        "Centralized accuracy monitoring & failure breakdown",
        "OneRoster 1.2 CSV validation support",
      ],
      badge: "Demonstration Scenario",
    },
    {
      college: "Demonstration Scenario C: Intermittent Campus Wi-Fi",
      size: "Illustrative · Mobile & Hybrid Campus",
      challenge:
      "Areas with spotty cellular or Wi-Fi connectivity can stall student mobile check-in workflows during peak transition periods.",
      solution:
      "Demonstrates the Flutter mobile client's AES-256 encrypted Hive offline queue (`OfflineQueueService`) that buffers up to 500 HMAC-signed records locally for reconnect sync.",
      results: [
        "AES-256 encrypted local storage via HiveAesCipher",
        "Per-record HMAC-SHA256 integrity checks",
        "Automatic background reconciliation on reconnect",
      ],
      badge: "Demonstration Scenario",
    },
  ];

  export function SocialProof() {
    const [activeTab, setActiveTab] = useState<Stakeholder>("teachers");

  const tabs: { id: Stakeholder; label: string; icon: typeof Presentation }[] = [
  { id: "teachers", label: "Faculty Workflows", icon: Presentation },
  { id: "administrators", label: "Admin Workflows", icon: ShieldCheck },
  { id: "parents", label: "Parent Workflows", icon: Users },
  { id: "students", label: "Student Workflows", icon: GraduationCap },
];

return (
  <section
    id="social-proof"
    className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32 lg:py-36"
  >
    <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
      <SectionHeading
        eyebrow="Illustrative Use Cases"
        title="Designed Around Five Campus Stakeholders"
        description="The scenarios below are illustrative demonstration workflows based on implemented platform capabilities—not fabricated customer testimonials or audited deployment results."
      />

      {/* Stakeholder Selector Tabs */}
      <div className="mt-12 flex justify-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full border border-white/10 bg-surface/80 backdrop-blur-md">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all cursor-pointer ${isActive
                    ? "bg-white text-black shadow-md font-semibold"
                    : "text-mid hover:text-hi hover:bg-white/[0.04]"
                  }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-black" : "text-accent"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="mt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25 }}
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
              {
                SCENARIO_VIEWS[activeTab].map((scenario, i) => (
                  <SpotlightCard
                    key={i}
                    spotlightColor="rgba(143, 139, 255, 0.18)"
                    className="flex flex-col justify-between p-6 sm:p-7"
                  >
                    <div>
                      <div className="flex items-center justify-between text-faint mb-4">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-accent bg-accent/10 border border-accent/25 px-2.5 py-0.5 rounded-full">
                          Demo Scenario
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-spotify bg-spotify/10 border border-spotify/20 px-2 py-0.5 rounded-full">
                          {scenario.metric}
                        </span>
                      </div>

                        <p className="text-[14px] leading-relaxed text-mid">
                          {scenario.quote}
                        </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                      <div>
                        <h4 className="font-display text-[14.5px] font-semibold text-hi">
                          {scenario.name}
                        </h4>
                        <p className="font-mono text-[11px] text-faint mt-0.5">{scenario.role}</p>
                      </div>
                    </div>
                  </SpotlightCard>
                ))
              }
            </motion.div>
        </AnimatePresence>
      </div>

      {/* Illustrative Deployment Scenarios */}
      <div className="mt-24">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-spotify">
            Demonstration Scenarios
          </p>
          <h3 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
            Illustrative Campus Deployment Blueprints
          </h3>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {CASE_STUDIES.map((study, idx) => (
            <Reveal key={study.college} delay={idx * 0.1} direction="up">
              <div className="card-bytune rounded-[22px] p-6 sm:p-7 h-full flex flex-col justify-between border border-white/10 bg-surface/90 shadow-xl">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent font-semibold">
                      {study.badge}
                    </span>
                    <span className="font-mono text-[11px] text-faint">{study.size}</span>
                  </div>

                  <h4 className="mt-4 font-display text-lg font-medium text-hi">
                    {study.college}
                  </h4>

                  <div className="mt-4 space-y-3 text-[13px]">
                    <div>
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-red-400 font-semibold block">
                        Problem Addressed
                      </span>
                      <p className="text-mid mt-0.5">{study.challenge}</p>
                    </div>

                    <div>
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent block font-semibold">
                        Implemented Architecture
                      </span>
                      <p className="text-mid mt-0.5">{study.solution}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.08] space-y-2">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-spotify font-semibold block">
                    Verified Capabilities Demonstrated
                  </span>
                  {study.results.map((res, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2 text-[12.5px] text-hi">
                      <CheckCircle className="h-3.5 w-3.5 text-spotify shrink-0 mt-0.5" />
                      <span>{res}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);
}
