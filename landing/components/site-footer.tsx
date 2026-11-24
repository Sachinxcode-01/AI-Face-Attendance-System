"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Github,
  Lock,
  ScanFace,
  Shield,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { COMPANY_CONTACT, DEMO_MAILTO } from "@/lib/constants";
import { NAV_LINKS, ROLES } from "@/lib/content";

import { Reveal } from "./ui/reveal";
import { SpotlightCard } from "./ui/spotlight-card";

interface SiteFooterProps {
  onOpenDemo?: () => void;
  onOpenPilot?: () => void;
}

  export function SiteFooter({ onOpenDemo, onOpenPilot }: SiteFooterProps) {
    return (
      <footer className="relative border-t border-[var(--hairline)] bg-bg0 pt-16 pb-32 sm:pt-20 sm:pb-36 lg:pb-16">
        <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
          {/* ===================================================================
         * Top CTA Banner — ByTune Card 2 Specification with Spotlight Glow
         * =================================================================== */}
          <Reveal direction="up" duration={0.8}>
            <SpotlightCard
              spotlightColor="rgba(143, 139, 255, 0.25)"
              className="relative mb-16 overflow-hidden p-7 sm:p-10 lg:p-14 shadow-2xl backdrop-blur-xl"
            >
              {/* Subtle background grid & radial glow */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-grid opacity-20 pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute -top-24 -right-24 h-72 w-72 rounded-full card-glow-bg opacity-75 blur-2xl pointer-events-none animate-glow-breathe"
              />

              <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
                <div>
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 chip-bytune mb-5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
                    </span>
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-mid">
                      Ready to Deploy · Sub-300ms Verification
                    </span>
                  </div>

                  {/* Headline */}
                  <h2 className="text-balance font-display text-3xl font-medium leading-[1.08] tracking-[-0.028em] text-hi sm:text-[40px] lg:text-[48px]">
                    Put your campus on the record.
                  </h2>

                  {/* Subtext */}
                  <p className="mt-4 max-w-xl text-[15px] sm:text-[16px] leading-[25.6px] text-mid">
                    Walk through a live session, test touchless kiosk check-in, and inspect the real-time admin sentinel.
                    Open-source biometric attendance with zero proxy loopholes and edge-first privacy.
                  </p>

                  {/* Value stats */}
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-6 sm:grid-cols-4 font-mono text-[12px]">
                    <div>
                      <span className="block font-semibold text-hi text-[17px]">99.8%</span>
                      <span className="text-[10px] uppercase tracking-wider text-faint">ArcFace Accuracy</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-spotify text-[17px]">192ms</span>
                      <span className="text-[10px] uppercase tracking-wider text-faint">Edge Inference</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-accent text-[17px]">30s</span>
                      <span className="text-[10px] uppercase tracking-wider text-faint">HMAC Rotation</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-accent2 text-[17px]">100%</span>
                      <span className="text-[10px] uppercase tracking-wider text-faint">Offline Capable</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3.5 sm:flex-row lg:flex-col lg:items-stretch lg:justify-center">
                  {onOpenDemo ? (
                    <button
                      type="button"
                      onClick={onOpenDemo}
                      className="btn-pill-accent h-[48px] text-[14px] font-semibold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(143,139,255,0.3)] transition-transform hover:scale-[1.02] active:scale-98"
                    >
                      Request a Campus Demo
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <a
                      href={DEMO_MAILTO}
                      className="btn-pill-accent h-[48px] text-[14px] font-semibold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(143,139,255,0.3)] transition-transform hover:scale-[1.02] active:scale-98"
                    >
                      Request a Campus Demo
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  )}

                  {onOpenPilot && (
                    <button
                      type="button"
                      onClick={onOpenPilot}
                      className="btn-pill-glass h-[48px] text-[14px] font-medium flex items-center justify-center gap-2 border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-hi transition-transform hover:scale-[1.02] active:scale-98"
                    >
                      Apply for Pilot Program
                      <ArrowUpRight className="h-4 w-4 text-spotify" />
                    </button>
                  )}

                  <a
                    href={COMPANY_CONTACT.github}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-pill-glass h-[48px] text-[14px] font-medium flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-98"
                  >
                    <Github className="h-4 w-4" />
                    View on GitHub
                    <ArrowUpRight className="h-3.5 w-3.5 text-faint" />
                  </a>

                  <p className="text-center font-mono text-[10px] text-faint">
                    Free & open source under MIT · Zero vendor lock-in
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* ===================================================================
         * Main Footer Grid (Brand + Navigation Columns)
         * =================================================================== */}
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
            {/* Brand & Description (2 cols on lg) */}
            <div className="sm:col-span-2 lg:col-span-2 space-y-4">
              <Link href="#top" className="inline-flex items-center gap-2.5 group">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-[#050507] transition-transform duration-200 group-hover:scale-105">
                  <ScanFace className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <div className="flex flex-col">
                  <span className="font-display text-[19px] font-semibold tracking-[-0.02em] text-hi">
                    SmartFace
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
                    Biometric Engine
                  </span>
                </div>
              </Link>

              <p className="max-w-sm text-[13.5px] leading-[22px] text-mid">
                Touchless facial attendance, dynamic anti-proxy QR rotation, and decentralized edge intelligence.
                Built for universities, high-traffic classrooms, and mission-critical campus security.
              </p>

              {/* Status indicator */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface px-3 py-1 font-mono text-[10px] text-mid">
                <span className="h-1.5 w-1.5 rounded-full bg-spotify animate-ping" />
                <span>All Systems Operational</span>
                <span className="text-faint">·</span>
                <span className="text-faint">ArcFace v2.4</span>
              </div>
            </div>

            {/* Column 1: Platform & Architecture */}
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                Platform
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-mid transition-colors hover:text-hi"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#edge"
                    className="text-mid transition-colors hover:text-hi"
                  >
                    Edge Nodes
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Campus Portals */}
            < div >
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                Portals
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                {ROLES.map((role) => (
                  <li key={role.key}>
                    <a
                      href={role.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-mid transition-colors hover:text-hi"
                    >
                      {role.title}
                      <ArrowUpRight className="h-3 w-3 text-faint" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Trust & Legal */}
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                Trust & Legal
              </h3>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                <li>
                  <Link
                    href="/security"
                    className="text-mid transition-colors hover:text-hi flex items-center gap-1.5"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-spotify" />
                    Security & Compliance
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-mid transition-colors hover:text-hi"
                  >
                    Pricing & Plans
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-mid transition-colors hover:text-hi"
                  >
                    Privacy Architecture
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-mid transition-colors hover:text-hi"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <a
                    href={COMPANY_CONTACT.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-mid transition-colors hover:text-hi"
                  >
                    GitHub Source
                    < ArrowUpRight className="h-3 w-3 text-faint" />
                  </a >
                </li >
                <li>
                  <a
                    href={DEMO_MAILTO}
                    className="text-mid transition-colors hover:text-hi"
                  >
                    Security Contact
                  </a>
                </li>
              </ul >
            </div >
          </div >

          {/* ===================================================================
         * Divider & Bottom Bar
         * =================================================================== */}
          <div className="mt-12 pt-8 border-t border-[var(--hairline)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[12px] text-faint">
            <div>
              <span>© {new Date().getFullYear()} SmartFace Systems.</span>{" "}
              <span className="hidden sm:inline">All rights reserved.</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span>
                Built by{" "}
                <a
                  href={COMPANY_CONTACT.github}
                  target="_blank"
                  rel="noreferrer"
                  className="text-mid hover:text-accent transition-colors underline underline-offset-4 decoration-white/20"
                >
                  {COMPANY_CONTACT.developer}
                </a>{" "}
                ({COMPANY_CONTACT.address}, India)
              </span>
            </div>
          </div >

          {/* Data Governance / Privacy Notice */}
          < div className="mt-6 rounded-[14px] border border-white/[0.05] bg-white/[0.015] p-3.5 sm:p-4 text-[11.5px] leading-relaxed text-faint font-mono" >
            <p>
              <strong className="text-mid font-semibold">Data Governance Notice:</strong> Attendance verification frames are processed ephemerally in memory at edge kiosks, and identity matching relies on 512-dimensional mathematical embeddings. Enrollment image datasets and audit snapshots are restricted to authorized institutional storage, and admins maintain full autonomy to purge or re-calibrate biometric profiles at any time.
            </p>
          </div >
        </div >
      </footer >
    );
  }
