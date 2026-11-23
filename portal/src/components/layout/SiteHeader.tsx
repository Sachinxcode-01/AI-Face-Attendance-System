"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Menu,
  ScanFace,
  X,
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Presentation,
  ShieldCheck,
  Users,
  ExternalLink,
} from "lucide-react";

export const NAV_LINKS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#smart-attendance", label: "Smart Attendance" },
  { href: "#anti-proxy-craft", label: "Anti-Proxy Tech" },
  { href: "#role-gateway", label: "Role Portals" },
  { href: "#faq", label: "FAQ & Specs" },
];

export const PORTAL_ROLES = [
  {
    key: "student",
    label: "Student",
    title: "Student Portal",
    path: "/student",
    href: "/student",
    description: "Check in with face or rotating QR, track streaks, and view attendance stats.",
    icon: GraduationCap,
  },
  {
    key: "teacher",
    label: "Teacher",
    title: "Teacher Portal",
    path: "/teacher",
    href: "/teacher",
    description: "Start biometric attendance sessions, project dynamic QR, and approve leaves.",
    icon: Presentation,
  },
  {
    key: "admin",
    label: "Admin",
    title: "Admin Sentinel",
    path: "/admin",
    href: "/admin",
    description: "Campus telemetry, ArcFace calibration, security alerts, and full audit logs.",
    icon: ShieldCheck,
  },
  {
    key: "parent",
    label: "Parent",
    title: "Parent Portal",
    path: "/parent",
    href: "/parent",
    description: "Real-time attendance notifications, leave submissions, and security status.",
    icon: Users,
  },
] as const;

const LANDING_URL =
  process.env.NEXT_PUBLIC_LANDING_URL || "https://ai-face-attendance-beta.vercel.app";
const GITHUB_REPO_URL =
  "https://github.com/Sachinxcode-01/AI-Face-Attendance-System";

export function SiteHeader() {
  const [portalOpen, setPortalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalTriggerRef = useRef<HTMLButtonElement>(null);
  const splitBtnRef = useRef<HTMLDivElement>(null);
  const mobileCardRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const brandLinkRef = useRef<HTMLAnchorElement>(null);
  const prevMobileOpen = useRef(mobileOpen);

  // Dynamic Scroll Progress Bar calculation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(1, Math.max(0, scrollY / totalHeight)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Split pill button mouse radial glow
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!splitBtnRef.current) return;
    const rect = splitBtnRef.current.getBoundingClientRect();
    splitBtnRef.current.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    splitBtnRef.current.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setPortalOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPortalOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Auto-close mobile drawer when switching to desktop
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileOpen(false);
      }
    };
    mediaQuery.addEventListener("change", handleBreakpoint);
    return () => {
      mediaQuery.removeEventListener("change", handleBreakpoint);
    };
  }, []);

  // Restore focus to toggle button when mobile drawer is dismissed
  useEffect(() => {
    if (prevMobileOpen.current && !mobileOpen) {
      toggleButtonRef.current?.focus();
    }
    prevMobileOpen.current = mobileOpen;
  }, [mobileOpen]);

  // Move focus into the drawer on open
  useEffect(() => {
    if (!mobileOpen) return;
    const focusTimer = window.setTimeout(() => {
      if (!mobileCardRef.current) return;
      const focusable = mobileCardRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        mobileCardRef.current.focus();
      }
    }, 50);
    return () => window.clearTimeout(focusTimer);
  }, [mobileOpen]);

  // Make background controls inert while mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;

    const inertTargets: HTMLElement[] = [];
    const mainEl = document.getElementById("main");
    if (mainEl) inertTargets.push(mainEl);

    const footerEl = document.querySelector("footer");
    if (footerEl) inertTargets.push(footerEl as HTMLElement);

    if (brandLinkRef.current) inertTargets.push(brandLinkRef.current);
    if (dropdownRef.current) inertTargets.push(dropdownRef.current);

    inertTargets.forEach((el) => {
      el.setAttribute("inert", "");
      (el as unknown as { inert: boolean }).inert = true;
    });

    return () => {
      inertTargets.forEach((el) => {
        el.removeAttribute("inert");
        (el as unknown as { inert: boolean }).inert = false;
      });
    };
  }, [mobileOpen]);

  // Contain Tab and Shift+Tab navigation within the mobile drawer dialog
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (!mobileCardRef.current) return;
      const focusable = mobileCardRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (
          document.activeElement === first ||
          !mobileCardRef.current.contains(document.activeElement)
        ) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (
          document.activeElement === last ||
          !mobileCardRef.current.contains(document.activeElement)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Top Floating ByTune Capsule Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center py-2.5 sm:py-3.5 px-3 pointer-events-none">
        <div className="pointer-events-auto relative flex items-center justify-between w-full max-w-[1020px] h-[52px] sm:h-[56px] px-3 sm:px-4 md:px-5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(14,14,18,0.85)] backdrop-blur-[16px] shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_16px_36px_-12px_rgba(0,0,0,0.6)] transition-all duration-300">
          {/* Scroll Progress Bar along bottom rim of capsule */}
          <div
            style={{ transform: `scaleX(${scrollProgress})` }}
            className="absolute bottom-0 inset-x-0 h-[2px] rounded-b-full origin-left bg-gradient-to-r from-accent via-accent2 to-spotify pointer-events-none z-30 transition-transform duration-75 ease-out"
          />

          {/* Brand Logo & Title */}
          <Link
            ref={brandLinkRef}
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 text-hi shrink-0 cursor-pointer text-decoration-none group"
            aria-label="SmartFace Portal home"
          >
            <span className="relative grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-surface group-hover:border-accent/40 transition-colors">
              <ScanFace
                className="h-4 w-4 text-accent transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.8}
              />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-spotify ring-2 ring-bg0" />
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[15px] font-semibold tracking-tight text-hi group-hover:text-white transition-colors">
                SmartFace
              </span>
              <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-[13.5px] font-medium text-mid transition duration-150 hover:bg-white/[0.06] hover:text-hi"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions on Right */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Telemetry Pill */}
            <div className="hidden sm:inline-flex items-center gap-2 chip-bytune h-7 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10.5px]">ArcFace: Online</span>
            </div>

            {/* GitHub Pill Button (Desktop) */}
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              title="View on GitHub"
              className="hidden md:inline-flex items-center gap-1.5 h-[34px] px-3 rounded-full border border-white/10 bg-white/[0.03] text-xs font-medium text-mid hover:text-hi hover:bg-white/[0.07] hover:border-white/20 transition-all duration-150"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67.21 2.2.82a7.42 7.42 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
              </svg>
              <span>GitHub</span>
            </a>

            {/* Split Pill Button (Desktop): Sign In / Roles Dropdown */}
            <div
              ref={dropdownRef}
              className="relative hidden sm:block"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setPortalOpen(false);
                  portalTriggerRef.current?.focus();
                }
              }}
            >
              <div
                ref={splitBtnRef}
                onMouseMove={handleMouseMove}
                className="relative inline-flex items-center h-[38px] rounded-full bg-white text-[#0a0a0c] font-semibold text-[13.5px] shadow-[0_1px_3px_rgba(0,0,0,0.25)] overflow-hidden transition-transform duration-150 active:scale-98"
                style={
                  {
                    "--glow-d": "450px",
                    "--mx": "50%",
                    "--my": "50%",
                  } as React.CSSProperties
                }
              >
                <div
                  className="absolute inset-0 rounded-full pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "radial-gradient(var(--glow-d, 450px) circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.4), transparent 70%)",
                  }}
                />
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 px-4 h-full text-[#0a0a0c] hover:opacity-90 transition-opacity text-[13.5px] font-semibold"
                >
                  Sign In
                </Link>
                <button
                  ref={portalTriggerRef}
                  type="button"
                  onClick={() => setPortalOpen((open) => !open)}
                  aria-expanded={portalOpen}
                  aria-label="Portal role options"
                  className="inline-flex items-center justify-center px-2.5 h-full border-l border-[rgba(10,10,12,0.12)] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-[#0a0a0c] transition-transform duration-200 ${
                      portalOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Portal Roles Dropdown Card */}
              <div
                hidden={!portalOpen}
                className={`absolute right-0 mt-2 w-72 rounded-[22px] border border-white/10 bg-[#16161d] p-2 shadow-2xl backdrop-blur-xl transition-all duration-200 origin-top-right ${
                  portalOpen
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "opacity-0 translate-y-2 scale-95 pointer-events-none"
                }`}
              >
                <p className="px-3 pb-2 pt-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">
                  Unified Portal · Roles
                </p>
                {PORTAL_ROLES.map((role) => {
                  const Icon = role.icon;
                  return (
                    <Link
                      key={role.key}
                      href={role.href}
                      onClick={() => setPortalOpen(false)}
                      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition duration-200 hover:bg-white/[0.06]"
                    >
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        strokeWidth={1.8}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-hi">
                          {role.title}
                          <ArrowUpRight className="h-3.5 w-3.5 text-faint opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[10px] text-faint">
                          {role.path}
                        </span>
                      </span>
                    </Link>
                  );
                })}
                <div className="mt-1 pt-1 border-t border-white/[0.06]">
                  <a
                    href={LANDING_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setPortalOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-xs text-mid hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    <span>Visit Landing Website</span>
                    <ExternalLink className="h-3.5 w-3.5 text-faint" />
                  </a>
                </div>
              </div>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              ref={toggleButtonRef}
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-haspopup="dialog"
              aria-controls="mobile-nav-dialog"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-hi transition active:scale-95 hover:bg-white/[0.08] lg:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Drawer (ByTune / Linear Dropdown Card) */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-200 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <div
        ref={mobileCardRef}
        id="mobile-nav-dialog"
        role="dialog"
        aria-modal={mobileOpen ? "true" : undefined}
        aria-label="Mobile Navigation"
        tabIndex={-1}
        hidden={!mobileOpen}
        className={`fixed inset-x-3.5 top-[64px] sm:top-[70px] z-50 mx-auto max-w-[400px] max-h-[calc(100vh-80px)] overflow-y-auto rounded-[22px] border border-[var(--hairline-strong)] bg-[#0e0e14]/95 p-4 sm:p-5 shadow-[0_24px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl lg:hidden outline-none transition-all duration-200 origin-top ${
          mobileOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-2 scale-98 pointer-events-none"
        }`}
      >
        {/* Navigation Links */}
        <nav aria-label="Mobile Navigation" className="flex flex-col gap-0.5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-hi transition hover:bg-white/[0.06] hover:text-white active:bg-white/[0.08]"
            >
              <span>{link.label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-faint" />
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="mt-3.5 border-t border-[var(--hairline)] pt-3.5 space-y-2.5">
          <Link
            href="/auth/login"
            onClick={() => setMobileOpen(false)}
            className="btn-pill-white w-full h-[40px] text-[13.5px] font-semibold flex items-center justify-center gap-2"
          >
            Sign In to Portal
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href="#role-gateway"
            onClick={() => setMobileOpen(false)}
            className="btn-pill-accent w-full h-[40px] text-[13.5px] font-semibold flex items-center justify-center gap-2"
          >
            Launch Role Portals
            <ArrowRight className="h-4 w-4" />
          </a>

          <a
            href={LANDING_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileOpen(false)}
            className="btn-pill-glass w-full h-[40px] text-[13.5px] font-medium flex items-center justify-center gap-2 text-mid hover:text-white"
          >
            <span>Visit Landing Website</span>
            <ExternalLink className="h-3.5 w-3.5 text-accent" />
          </a>
        </div>
      </div>
    </>
  );
}
