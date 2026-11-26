"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Fingerprint,
  Radar,
  ShieldCheck,
} from "lucide-react";
import { PRODUCT_SPECS } from "@/lib/content";
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
          title="Embeddings for Live Verification. Explicit Controls for Everything Else."
          description="Live verification processes uploads in memory and clears the buffer after extracting a 512-D embedding—while protecting stored biometric templates, batch datasets, and security logs with access control and audit trails."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-12 items-stretch">
          {/* Card 1: Vector Lifecycle */}
          <Reveal className="lg:col-span-7" direction="up" delay={0.05}>
            <SpotlightCard
              spotlightColor="rgba(143, 139, 255, 0.22)"
              className="card-bytune rounded-[24px] p-6 sm:p-8 h-full flex flex-col justify-between border border-white/10 bg-surface/90 shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
                    <Fingerprint className="h-3.5 w-3.5 text-accent" />
                    {PRODUCT_SPECS.aiEngine} · ResNet-50
                  </span>
                  <span className="font-mono text-[10px] uppercase text-spotify bg-spotify/10 border border-spotify/20 px-2.5 py-0.5 rounded-full">
                    512-D Template Storage
                  </span>
                </div>

                <h3 className="mt-4 font-display text-2xl font-medium tracking-tight text-hi">
                  How Biometric Images &amp; Vectors Are Handled
                </h3>

                <p className="mt-2 text-[14px] leading-relaxed text-mid">
                  When verifying via the API (`/v1/face/verify`), uploaded frames stay in volatile memory and `image_bytes` is cleared in a `finally` block. Stored `BiometricProfile` records hold 512-D normalized float vectors—not anonymous data, and still governed as sensitive biometrics. Legacy batch training (`data/dataset/`) and local intruder snapshots (`data/Intruders/`) persist images only when an institution enables those local workflows.
                </p>

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
                <span>Vector Dimension: 512 normalized floats</span>
                <span className="text-spotify">User Deletion: DELETE /auth/biometric</span>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* Card 2: Governance & Known Limits */}
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
                      Consent, Alternatives &amp; Data Export
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-medium text-hi">
                    Institutional Governance Controls
                  </h4>
                  <p className="text-[13px] text-mid leading-relaxed">
                    Enrollment records explicit opt-in consent. Students can withdraw consent and delete their biometric template anytime, export account records, dispute errors, or check in via non-biometric rotating QR or faculty override. Deploying institutions must complete their own legal/DPIA review (e.g., DPDP Act or FERPA) before rollout.
                  </p>
                </div>

                <div className="p-6 rounded-[22px] border border-white/10 bg-surface/85 backdrop-blur-md space-y-3 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(111,216,255,0.08)]">
                  <div className="flex items-center gap-2 text-accent2">
                    <Radar className="h-4 w-4 animate-spin-slow" />
                    <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
                      Anti-Spoofing &amp; Known Limitations
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-medium text-hi">
                    Defense-in-Depth Without Absolute Claims
                  </h4>
                  <p className="text-[13px] text-mid leading-relaxed">
                    Core verification enforces single-face checks, cosine threshold gating (default 0.60), per-user failure cooldowns, and 20s HMAC QR tokens. Current software release is not ISO/IEC 30107-3 PAD certified; high-security gates should pair cameras with physical supervision or optional IR/depth hardware.
                  </p>
                  <div className="pt-1 flex items-center justify-between font-mono text-[11px] text-faint">
                    <span>Auth: 5 req / 15m</span>
                    <span className="text-emerald-400 font-medium">AI Verify: 15 req / min</span>
                  </div>
                </div>

          <div className="pt-2">
            <Link
              href="/security"
              className="w-full h-11 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25 text-hi text-[13.5px] font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm group"
            >
              <span>Explore Security Architecture &amp; Controls</span>
              <ArrowRight className="h-4 w-4 text-accent group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
      </div >
    </section >
  );
}
