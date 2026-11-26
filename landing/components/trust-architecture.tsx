"use client";

import { Camera, CheckCircle2, Cpu, Server } from "lucide-react";
import { FEATURE_AVAILABILITY_MATRIX, PRODUCT_SPECS } from "@/lib/content";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

export function TrustArchitecture() {
  const specs = [
    { value: "512-D", label: "ArcFace Vector Size", sub: `${PRODUCT_SPECS.aiEngine} · ResNet-50` },
    { value: "0.60", label: "Default Cosine Cutoff", sub: "Configurable 0.60–0.85 policy" },
    { value: "20s", label: "HMAC QR Token Window", sub: "SHA-256 + 5s clock-skew tolerance" },
    { value: "5 Roles", label: "RBAC Portal Architecture", sub: "Student, Teacher, Admin, Parent, Super Admin" },
  ];

  const controls = [
    { name: "Ephemeral Live Frames", desc: "Live verify uploads cleared from RAM" },
    { name: "TLS + Bcrypt (12)", desc: "15m JWT & httpOnly refresh cookies" },
    { name: "Rate Limited APIs", desc: "5/15m auth · 60/m API · 15/m AI verify" },
    { name: "Consent & Erasure", desc: "Opt-in toggle & /auth/biometric delete" },
    { name: "Audit Trail", desc: "Append-only AttendanceAuditLog & SecurityLog" },
    { name: "MIT Open Source", desc: "Self-hostable Express + FastAPI stack" },
  ];

  const techStack = [
    {
      category: "Biometrics & AI",
      items: [
        "InsightFace ArcFace (buffalo_l)",
        "ResNet-50 + RetinaFace detection",
        "ONNX Runtime (CPU or CUDA GPU)",
      ],
    },
    {
      category: "Clients & Mobile",
      items: [
        "Next.js 15 App Router portals",
        "Flutter Android & iOS client",
        "AES-256 Hive offline queue (mobile)",
      ],
    },
    {
      category: "Backend & Storage",
      items: [
        "Node.js Express REST & WebSockets",
        "FastAPI Python AI microservice",
        "MongoDB + optional Supabase pgvector",
      ],
    },
    {
      category: "Security & Controls",
      items: [
        "HMAC-SHA256 20s rotating QR",
        "Haversine classroom geofencing",
        "NoSQL key sanitizer & Helmet headers",
      ],
    },
  ];

  const statusTone = (status: string) => {
    if (status === "Operational") return "text-spotify border-spotify/30 bg-spotify/10";
    if (status === "Pilot-Configured") return "text-accent2 border-accent2/30 bg-accent2/10";
    if (status === "Beta") return "text-amber border-amber/30 bg-amber/10";
    return "text-mid border-white/15 bg-white/[0.04]";
  };

  return (
    <section
      id="trust-architecture"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32 lg:py-36 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(143,139,255,0.09),transparent)]"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Verified Technical Specifications"
          title="Engineered for Verifiable Campus Attendance"
          description="Every architecture detail below reflects the actual SmartFace v2.0 codebase—separating implemented controls, pilot integrations, and optional deployment hardware."
        />

        {/* 1. Core Verified Technical Metrics */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {
              specs.map((stat, idx) => (
                <Reveal key={stat.label} delay={idx * 0.08} direction="up">
                  <SpotlightCard
                    spotlightColor="rgba(143, 139, 255, 0.22)"
                    className="p-6 rounded-[22px] border border-white/10 bg-surface/90"
                  >
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                      {stat.label}
                    </span>
                    <div className="mt-2 font-display text-4xl font-semibold tracking-tight text-hi">
                      {stat.value}
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-mid/80">{stat.sub}</p>
                  </SpotlightCard>
                </Reveal>
              ))
            }
        </div>

        {/* 2. Implemented Controls Strip */}
        <div className="mt-14 card-bytune rounded-[22px] p-6 sm:p-8 border border-white/10 bg-[#0e0e14]/90 backdrop-blur-xl">
          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-spotify font-semibold">
              Implemented Technical &amp; Privacy Controls
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {
                controls.map((b, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center space-y-1"
                  >
                    <CheckCircle2 className="h-4 w-4 text-spotify mx-auto mb-1" />
                    <h4 className="font-display text-[12.5px] font-semibold text-hi">{b.name}</h4>
                    <p className="font-mono text-[9.5px] text-faint">{b.desc}</p>
                  </div>
                ))
              }
          </div>
        </div>

        {/* 3. Deployment Architecture Diagram */}
        <div className="mt-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-[11px] uppercase tracking-widest text-accent font-semibold">
              Distributed 3-Layer Topology
            </span>
            <h3 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
              Flexible Client, AI Service &amp; Persistence Architecture
            </h3>
            <p className="mt-2 text-[14px] text-mid">
              Deploy in the cloud or on a campus LAN using standard USB webcams, supported IP/RTSP streams, web browsers, or the Flutter mobile client.
            </p>
          </div>

          <div className="card-bytune rounded-[24px] p-6 sm:p-10 border border-white/10 bg-surface/95 shadow-2xl relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />

            <div className="relative z-10 grid gap-6 lg:grid-cols-3 items-stretch">
              {/* Layer 1 */}
              <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
                      Layer 1 · Capture &amp; Portals
                    </span>
                    <Camera className="h-4 w-4 text-accent2" />
                  </div>
                  <h4 className="mt-3 font-display text-lg font-medium text-hi">
                    Web, Mobile &amp; Kiosk Clients
                  </h4>
                  <p className="mt-1 text-[13px] text-mid leading-relaxed">
                    Role-based Next.js web portals, Flutter Android/iOS apps, and local OpenCV/Streamlit kiosks.
                  </p>

                  <ul className="mt-4 space-y-2 text-[12.5px] font-mono text-mid">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                      USB Webcams &amp; RTSP IP Feeds
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                      Flutter Encrypted Hive Offline Queue
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                      Teacher 20s Rotating QR Projector
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/[0.08] text-[11px] font-mono text-spotify">
                  Hardware-flexible capture endpoints
                </div>
              </div>

              {/* Layer 2 */}
              <div className="p-6 rounded-2xl border border-accent/40 bg-[rgba(16,16,28,0.9)] space-y-4 shadow-[0_0_24px_rgba(143,139,255,0.15)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold">
                      Layer 2 · API &amp; AI Services
                    </span>
                    <Cpu className="h-4 w-4 text-accent" />
                  </div>
                  <h4 className="mt-3 font-display text-lg font-medium text-hi">
                    Express Gateway &amp; FastAPI AI
                  </h4>
                  <p className="mt-1 text-[13px] text-mid leading-relaxed">
                    Node.js Express handles auth, RBAC, QR signing, and attendance rules; FastAPI executes InsightFace ONNX matching.
                  </p>

                  <ul className="mt-4 space-y-2 text-[12.5px] font-mono text-mid">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      512-D Cosine Similarity (≥0.60)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      X-Internal-Token &amp; Rate Limiting
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      In-Memory Frame Cleanup on Verify
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/[0.08] text-[11px] font-mono text-accent">
                  Supports CUDA GPU or CPU fallback
                </div>
              </div>

              {/* Layer 3 */}
              <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
                      Layer 3 · Persistence &amp; Audit
                    </span>
                    <Server className="h-4 w-4 text-spotify" />
                  </div>
                  <h4 className="mt-3 font-display text-lg font-medium text-hi">
                    MongoDB &amp; Optional Sync Targets
                  </h4>
                  <p className="mt-1 text-[13px] text-mid leading-relaxed">
                    Primary MongoDB ledger for users, vectors, attendance, disputes, and audit logs, with optional cloud sync.
                  </p>

                  <ul className="mt-4 space-y-2 text-[12.5px] font-mono text-mid">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-spotify" />
                      Unique Session Duplicate Lock
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-spotify" />
                      Optional Supabase pgvector &amp; Sheets
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-spotify" />
                      CSV / Excel / JSON / HTML Exports
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/[0.08] text-[11px] font-mono text-spotify">
                  Region-selectable deployment hosting
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Feature Availability Matrix */}
        <div className="mt-16 card-bytune rounded-[22px] p-6 sm:p-8 border border-white/10 bg-[#0e0e14]/90">
          <div className="mb-6">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent font-semibold block">
              Honest Product Scope
            </span>
            <h4 className="mt-1 font-display text-xl sm:text-2xl font-medium text-hi">
              Feature Availability Matrix
            </h4>
            <p className="mt-1 text-[13px] text-mid">
              Clear separation of capabilities currently operational in the codebase vs. pilot-configured integrations, beta connectors, and roadmap items.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[10.5px] uppercase tracking-wider text-faint">
                  <th className="py-3 pr-4">Module</th>
                  <th className="py-3 px-4">Capability</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4">Implementation Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {FEATURE_AVAILABILITY_MATRIX.map((row) => (
                  <tr key={row.capability}>
                    <td className="py-3 pr-4 font-mono text-[11.5px] text-hi whitespace-nowrap">{row.module}</td>
                    <td className="py-3 px-4 text-mid">{row.capability}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusTone(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-[12px] text-faint">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Technology Stack Deep Dive */}
        <div className="mt-16">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint font-semibold">
              Verified Open-Source Stack
            </span>
            <h4 className="mt-1 font-display text-xl font-medium text-hi">
              Full Technology Stack Breakdown
            </h4>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {techStack.map((tech, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-3"
              >
                <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold block">
                  {tech.category}
                </span>
                <ul className="space-y-1.5 text-[12.5px] text-mid">
                  {tech.items.map((it, iIdx) => (
                    <li key={iIdx} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-mid" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
