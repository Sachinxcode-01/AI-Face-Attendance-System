"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Camera,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Layers,
  Lock,
  Network,
  Radio,
  Server,
  Shield,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

export function TrustArchitecture() {
  const stats = [
    { value: "99.8%", label: "Recognition Precision", sub: "ArcFace cosine distance >= 0.94" },
    { value: "1.28M+", label: "Attendances Processed", sub: "Across collegiate client fleets" },
    { value: "99.98%", label: "System Uptime SLA", sub: "Edge-resilient architecture" },
    { value: "184ms", label: "Edge Inference Latency", sub: "INT8 on-device ONNX runtime" },
  ];

  const badges = [
    { name: "DPDP Act 2023", desc: "India Biometric Privacy Aligned" },
    { name: "FERPA Aligned", desc: "US Educational Records Safe" },
    { name: "ISO 27001 Aligned", desc: "Information Security Controls" },
    { name: "Zero-Photo Storage", desc: "512-Dim Vector Math Only" },
    { name: "AES-256 Encrypted", desc: "At Rest & TLS 1.3 In Transit" },
    { name: "Passive 3D Liveness", desc: "Presentation Attack Resistant" },
  ];

  const techStack = [
    { category: "Biometrics & AI", items: ["ArcFace v2.4 (ResNet100)", "RetinaFace 68-Landmark Alignment", "INT8 Quantized Weights"] },
    { category: "Edge Inference", items: ["ONNX Runtime (x86 & ARM64)", "SQLite WAL Local Queue Buffer", "Sub-300ms Execution"] },
    { category: "Cloud & APIs", items: ["FastAPI Python Async Microservices", "PostgreSQL pgvector HNSW Index", "Next.js 15 App Router"] },
    { category: "Security & Anti-Proxy", items: ["HMAC-SHA256 30s Token Rotation", "AES-256 Vector Encryption", "Append-Only Audit Chain"] },
  ];

  return (
    <section
      id="trust-architecture"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32 lg:py-36 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(143,139,255,0.09),transparent)]"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Platform Trust & Infrastructure"
          title="Engineered for Institutional Reliability"
          description="High-throughput edge intelligence meets defense-grade privacy. Built to process thousands of student check-ins simultaneously without cloud latency bottlenecks."
        />

        {/* 1. Live Platform Statistics */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
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
          ))}
        </div>

        {/* 2. Security Badges Strip */}
        <div className="mt-14 card-bytune rounded-[22px] p-6 sm:p-8 border border-white/10 bg-[#0e0e14]/90 backdrop-blur-xl">
          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-spotify font-semibold">
              Statutory Compliance & Security Standards
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {badges.map((b, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center space-y-1"
              >
                <CheckCircle2 className="h-4 w-4 text-spotify mx-auto mb-1" />
                <h4 className="font-display text-[12.5px] font-semibold text-hi">{b.name}</h4>
                <p className="font-mono text-[9.5px] text-faint">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Deployment Architecture Diagram (ByTune Style) */}
        <div className="mt-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-[11px] uppercase tracking-widest text-accent font-semibold">
              Edge-First Hybrid Topology
            </span>
            <h3 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
              Hardware-Agnostic Deployment Architecture
            </h3>
            <p className="mt-2 text-[14px] text-mid">
              Runs smoothly on your existing campus CCTV streams, USB webcams, or tablets without turnkey hardware vendor monopolies.
            </p>
          </div>

          <div className="card-bytune rounded-[24px] p-6 sm:p-10 border border-white/10 bg-surface/95 shadow-2xl relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />

            {/* Architecture Multi-Tier Layout */}
            <div className="relative z-10 grid gap-6 lg:grid-cols-3 items-stretch">
              {/* Tier 1: Campus Gate Hardware */}
              <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
                      Layer 1 · Campus Periphery
                    </span>
                    <Camera className="h-4 w-4 text-accent2" />
                  </div>
                  <h4 className="mt-3 font-display text-lg font-medium text-hi">
                    Gate & Classroom Terminals
                  </h4>
                  <p className="mt-1 text-[13px] text-mid leading-relaxed">
                    Flexible capture devices operating at campus gates, department turnstiles, and lecture podiums.
                  </p>

                  <ul className="mt-4 space-y-2 text-[12.5px] font-mono text-mid">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                      Existing RTSP IP Cameras
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                      Touchless Tablet Kiosks
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent2" />
                      Teacher Podium Rotating QRs
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/[0.08] text-[11px] font-mono text-spotify">
                  No proprietary turnstile locks
                </div>
              </div>

              {/* Tier 2: Local Edge Inference Node */}
              <div className="p-6 rounded-2xl border border-accent/40 bg-[rgba(16,16,28,0.9)] space-y-4 shadow-[0_0_24px_rgba(143,139,255,0.15)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold">
                      Layer 2 · Campus Local Edge
                    </span>
                    <Cpu className="h-4 w-4 text-accent" />
                  </div>
                  <h4 className="mt-3 font-display text-lg font-medium text-hi">
                    SmartFace Edge Node Hub
                  </h4>
                  <p className="mt-1 text-[13px] text-mid leading-relaxed">
                    Executes INT8 ONNX ArcFace inference on local mini-PCs or GPU nodes inside your campus network.
                  </p>

                  <ul className="mt-4 space-y-2 text-[12.5px] font-mono text-mid">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Sub-300ms Vector Embedding
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Offline SQLite WAL Buffer
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Zero Raw Photos Retained
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/[0.08] text-[11px] font-mono text-accent">
                  Works 100% during internet outages
                </div>
              </div>

              {/* Tier 3: Master Cloud or Air-Gapped Master */}
              <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-faint font-semibold">
                      Layer 3 · Central Master
                    </span>
                    <Server className="h-4 w-4 text-spotify" />
                  </div>
                  <h4 className="mt-3 font-display text-lg font-medium text-hi">
                    Cloud / Air-Gapped Sentinel
                  </h4>
                  <p className="mt-1 text-[13px] text-mid leading-relaxed">
                    Central PostgreSQL pgvector database, Admin Sentinel radar, parent SMS dispatch, and ERP connectors.
                  </p>

                  <ul className="mt-4 space-y-2 text-[12.5px] font-mono text-mid">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-spotify" />
                      pgvector Cosine HNSW Index
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-spotify" />
                      Real-Time Parent Alert Dispatch
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-spotify" />
                      NAAC / NBA Audit Exports
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/[0.08] text-[11px] font-mono text-spotify">
                  Sovereign regional data residency
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Technology Stack Deep Dive */}
        <div className="mt-16">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint font-semibold">
              Modern Open-Source Engine
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
