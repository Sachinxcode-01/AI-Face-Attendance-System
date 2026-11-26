"use client";

import { motion } from "framer-motion";
import { BellRing, QrCode, ScanFace, ArrowRight, type LucideIcon } from "lucide-react";
import { ONBOARDING_WORKFLOW } from "@/lib/content";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

const STEPS: {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
  meta: string;
  accent: string;
  gradient: string;
}[] = [
    {
      number: "01",
      icon: QrCode,
      title: "Launch the session",
      body: "Faculty start a class session on the Teacher Portal. An HMAC-SHA256 token bound to the session rotates every 20 seconds (+5s skew tolerance), with optional classroom geofencing.",
      meta: "Teacher Portal · 20s HMAC QR",
      accent: "rgba(143, 139, 255, 0.2)",
      gradient: "from-accent to-accent2",
    },
    {
      number: "02",
      icon: ScanFace,
      title: "Verify identity",
      body: "Students check in via webcam, mobile camera, or campus kiosk. InsightFace ArcFace (buffalo_l, ResNet-50) compares a 512-D embedding against the enrolled vector (default ≥0.60 cosine).",
      meta: "ArcFace 512-D · ≥0.60 cosine",
      accent: "rgba(111, 216, 255, 0.25)",
      gradient: "from-accent2 to-spotify",
    },
    {
      number: "03",
      icon: BellRing,
      title: "Record, audit & notify",
      body: "Attendance writes to MongoDB with duplicate-session protection and an audit log entry. Real-time WebSocket updates, email/in-app alerts, and configured SMS notifications trigger automatically.",
      meta: "WebSocket + Audit Log",
      accent: "rgba(30, 215, 96, 0.2)",
      gradient: "from-spotify to-amber",
    },
  ];

const HARDWARE_TIERS = [
  {
    tier: "Minimum (Pilot / Single Room)",
    items: [
      "Modern browser (Chrome, Edge, Safari, Firefox) or Android 6+ / iOS mobile",
      "720p USB webcam or built-in laptop/phone camera",
      "Backend host: 4 vCPU, 8 GB RAM, 20 GB SSD (CPU ONNX fallback)",
    ],
  },
  {
    tier: "Recommended (Campus Production)",
    items: [
      "1080p USB or PoE IP camera (RTSP) with balanced frontal lighting",
      "AI service node with NVIDIA CUDA 11.8+ GPU + 16 GB RAM for fast batch/gate inference",
      "Managed MongoDB replica set + Redis cache + campus Wi-Fi/LAN",
    ],
  },
  {
    tier: "Optional / Extended Integrations",
    items: [
      "IR / 3D depth camera hardware for dedicated gate PAD evaluations",
      "Supabase PostgreSQL (pgvector HNSW) & Google Sheets sync",
      "Twilio / MSG91 SMS gateway & Resend / Brevo transactional email",
    ],
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 h-[350px] w-[800px] rounded-full opacity-15 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(143, 139, 255, 0.3) 0%, rgba(111, 216, 255, 0.15) 50%, transparent 75%)",
        }}
      />

      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Workflow Architecture"
          title="Three steps from session launch to verified record."
          description="Supports face verification, rotating QR check-in, and faculty manual overrides—with full audit logging."
        />

        {/* Steps Grid */}
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.number} delay={index * 0.1} direction="up" distance={24}>
                <SpotlightCard
                  spotlightColor={step.accent}
                  enableTilt
                  className="flex h-full flex-col justify-between p-7"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent transition-colors duration-300 group-hover:text-white group-hover:border-accent/50 group-hover:shadow-[0_0_20px_rgba(143,139,255,0.3)]"
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </motion.div>

                      <span className="font-display text-4xl font-semibold leading-none text-white/[0.08] group-hover:text-white/[0.22] transition-colors">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mt-6 font-display text-[20px] font-medium tracking-tight text-hi group-hover:text-white transition-colors">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 text-[14.5px] leading-[23.9px] text-mid">
                      {step.body}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="chip-bytune h-6 text-[10.5px] px-3 font-mono">
                      {step.meta}
                    </span>
                    {index < 2 && (
                      <span className="hidden md:flex items-center text-faint group-hover:text-accent transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>

        {/* Institutional Onboarding Sequence (11 Steps) */}
        <div className="mt-20 card-bytune rounded-[24px] p-6 sm:p-10 border border-white/10 bg-surface/90">
          <div className="max-w-2xl mb-8">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent font-semibold block">
              Campus Deployment Lifecycle
            </span>
            <h3 className="mt-2 font-display text-2xl font-medium text-hi">
              11-Stage Institutional Onboarding Workflow
            </h3>
            <p className="mt-2 text-[13.5px] text-mid">
              Actual rollout timelines depend on roster readiness, camera/network infrastructure, and institutional privacy/DPIA sign-off.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {ONBOARDING_WORKFLOW.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1.5"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-spotify font-semibold">
                  Stage {item.step}
                </span>
                <h4 className="font-display text-[14.5px] font-medium text-hi">{item.title}</h4>
                <p className="text-[12.5px] text-mid leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hardware & System Requirements */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {HARDWARE_TIERS.map((tier) => (
            <div key={tier.tier} className="card-surface rounded-[22px] p-6 space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold block">
                {tier.tier}
              </span>
              <ul className="space-y-2 text-[12.5px] text-mid leading-relaxed">
                {tier.items.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 rounded-full bg-spotify shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
