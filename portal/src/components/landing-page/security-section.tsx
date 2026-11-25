"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Fingerprint,
  Lock,
  Radar,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

interface SecuritySectionProps {
  onOpenDemo?: () => void;
  onOpenPilot?: () => void;
}

export function SecuritySection({ onOpenDemo, onOpenPilot }: SecuritySectionProps) {
  const [activeCell, setActiveCell] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCell((prev) => (prev + 1) % 64);
    }, 140);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="security-governance"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32 lg:py-36 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(30,215,96,0.06),transparent)]"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Biometric Data Governance"
          title="Zero Raw Photos Stored for Routine Attendance. Mathematical Vectors Only."
          description="Face recognition without routine photo storage. SmartFace translates landmarks into 512-dimension mathematical embeddings—processing routine camera frames in memory without persisting raw attendance photos."
        />

        {/* ByTune Interactive Visual Matrix & Features */}
        <div className="mt-14 grid gap-6 lg:grid-cols-12 items-stretch">
          {/* Card 1: Vector Irreversibility Engine */}
          <Reveal className="lg:col-span-7" direction="up" delay={0.05}>
            <SpotlightCard
              spotlightColor="rgba(143, 139, 255, 0.22)"
              className="card-bytune rounded-[24px] p-6 sm:p-8 h-full flex flex-col justify-between border border-white/10 bg-surface/90 shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
                    <Fingerprint className="h-3.5 w-3.5 text-accent" />
                    ArcFace v2.4 ResNet100 INT8
                  </span>
                  <span className="font-mono text-[10px] uppercase text-spotify bg-spotify/10 border border-spotify/20 px-2.5 py-0.5 rounded-full">
                    Protected Vector Storage
                  </span>
                </div>

                <h3 className="mt-4 font-display text-2xl font-medium tracking-tight text-hi">
                  Mathematical Embeddings Replace Physical Photos
                </h3>

                <p className="mt-2 text-[14px] leading-relaxed text-mid">
                  During enrollment and routine verification, camera frames are processed in volatile memory and are not persisted as raw attendance photos. Only 512-dim numerical embeddings and consent records are stored for attendance matching under role-gated access controls; incident security alerts are logged separately in security logs.
                </p>

                {/* Animated 64-vector matrix visual */}
                <div
                  aria-hidden
                  className="mt-6 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-black/50"
                >
                  {Array.from({ length: 64 }, (_, index) => {
                    const isLit = index === activeCell || (index + 12) % 64 === activeCell;
                    const baseOpacity = 0.15 + (((index * 37) % 11) / 11) * 0.7;
                    return (
                      <span
                        key={index}
                        className="aspect-square rounded-[3px] transition-all duration-150"
                        style={{
                          backgroundColor: isLit ? "#6fd8ff" : "#8f8bff",
                          opacity: isLit ? 1 : baseOpacity,
                          transform: isLit ? "scale(1.2)" : "scale(1)",
                          boxShadow: isLit ? "0 0 8px #6fd8ff" : "none",
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-faint">
                <span>Vector Dimension: 512 float32</span>
                <span className="text-spotify">In-Memory Frame Processing</span>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* Card 2: Statutory Compliance & Anti-Spoofing */}
          <Reveal className="lg:col-span-5" direction="up" delay={0.12}>
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div className="p-6 rounded-[22px] border border-white/10 bg-surface/85 backdrop-blur-md space-y-3 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(30,215,96,0.08)]">
                <div className="flex items-center gap-2 text-spotify">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spotify opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-spotify" />
                  </span>
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
                    DPDP Act 2023 & FERPA Ready
                  </span>
                </div>
                <h4 className="font-display text-lg font-medium text-hi">
                  Institutional Sovereign Data Governance
                </h4>
                <p className="text-[13px] text-mid leading-relaxed">
                  Meets statutory requirements for student biometric privacy. Admins retain full autonomy to purge profiles with instant one-click deletion and verifiable audit timestamps.
                </p>
              </div>

              <div className="p-6 rounded-[22px] border border-white/10 bg-surface/85 backdrop-blur-md space-y-3 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(111,216,255,0.08)]">
                <div className="flex items-center gap-2 text-accent2">
                  <Radar className="h-4 w-4 animate-spin-slow" />
                  <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
                    Passive 3D Liveness Detection
                  </span>
                </div>
                <h4 className="font-display text-lg font-medium text-hi">
                  Presentation Attack Resistant
                </h4>
                <p className="text-[13px] text-mid leading-relaxed">
                  Evaluates depth konturs and screen pixel moiré patterns. Printed paper photographs, smartphone replays, and silicone masks are instantly rejected at the gate.
                </p>
                <div className="pt-1 flex items-center justify-between font-mono text-[11px] text-faint">
                  <span>FAR: &lt;0.001%</span>
                  <span className="text-emerald-400 font-medium">FRR: &lt;0.2%</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/security"
                  className="w-full h-11 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25 text-hi text-[13.5px] font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm group"
                >
                  <span>Explore Full Security Architecture & DPIA Docs</span>
                  <ArrowRight className="h-4 w-4 text-accent group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
