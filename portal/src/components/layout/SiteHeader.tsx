"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
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
  Crown,
  LogIn,
  UserPlus,
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
  {
    key: "super_admin",
    label: "Super Admin",
    title: "Super Admin Governance",
    path: "/admin/super-admin",
    href: "/admin/super-admin",
    description: "Multi-campus governance, policy administration, and global system oversight.",
    icon: Crown,
  },
] as const;

export function SiteHeader() {
  const [portalOpen, setPortalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalTriggerRef = useRef<HTMLButtonElement>(null);
  const splitBtnRef = useRef<HTMLDivElement>(null);
  const mobileCardRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const brandLinkRef = useRef<HTMLAnchorElement>(null);
  const prevMobileOpen = useRef(mobileOpen);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!splitBtnRef.current) return;
    const rect = splitBtnRef.current.getBoundingClientRect();
    splitBtnRef.current.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    splitBtnRef.current.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mediaQuery.addEventListener("change", handleBreakpoint);
    return () => mediaQuery.removeEventListener("change", handleBreakpoint);
  }, []);

  useEffect(() => {
    if (prevMobileOpen.current && !mobileOpen) {
      toggleButtonRef.current?.focus();
    }
    prevMobileOpen.current = mobileOpen;
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center py-2.5 sm:py-3.5 px-3 pointer-events-none">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto relative flex items-center justify-between w-full max-w-[1260px] h-[52px] sm:h-[56px] px-3 sm:px-4 md:px-5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(14,14,18,0.85)] backdrop-blur-[16px] shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_16px_36px_-12px_rgba(0,0,0,0.6)]"
          >
            {/* Scroll Progress Bar */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <motion.div
                style={{ scaleX }}
                className="absolute bottom-0 inset-x-0 h-[2px] origin-left bg-gradient-to-r from-accent via-accent2 to-spotify pointer-events-none z-30"
              />
            </div>

                <div className="flex items-center justify-between flex-1 min-w-0">
                  {/* Brand */}
                  <Link
                    ref={brandLinkRef}
                    href="/"
                    className="flex items-center gap-2 sm:gap-2.5 text-hi shrink-0 group whitespace-nowrap"
                    aria-label="SmartFace Portal home"
                  >
                    <span className="relative grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-surface group-hover:border-accent/40 transition-colors shrink-0">
                      <ScanFace className="h-4 w-4 text-accent transition-transform duration-300 group-hover:scale-110" strokeWidth={1.8} />
                      <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-spotify ring-2 ring-bg0" />
                    </span>
                    <span className="font-display text-[15px] font-semibold tracking-tight text-hi group-hover:text-white transition-colors">
                      SmartFace
                    </span>
                      <span className="hidden sm:inline-flex font-mono text-[9.5px] uppercase tracking-[0.16em] text-accent border border-accent/25 bg-accent/10 px-2 py-0.5 rounded-full">
                        Portal
                      </span>
                </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden items-center gap-0.5 xl:gap-1 lg:flex shrink-0" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium text-mid transition duration-150 hover:bg-white/[0.06] hover:text-hi"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Portal Actions: Sign In, Sign Up, Launch Portal Dropdown */ }
                    < div className = "flex items-center gap-2 sm:gap-2.5 shrink-0" >
                    <Link
                      href="/auth/login"
                      className="hidden md:inline-flex items-center gap-1.5 rounded-full px-3.5 h-[36px] text-[12.5px] font-medium text-mid border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:text-hi transition whitespace-nowrap shrink-0"
                    >
                <LogIn className="h-3.5 w-3.5 text-accent" />
                <span>Sign In</span>
            </Link>

              <Link
                  href="/auth/register"
                  className="hidden sm:inline-flex btn-pill-accent h-[36px] px-3.5 text-[12.5px] font-semibold items-center gap-1.5 shadow-[0_0_16px_rgba(143,139,255,0.3)] transition whitespace-nowrap shrink-0"
                >
              <UserPlus className="h-3.5 w-3.5 shrink-0" />
              <span>Sign Up</span>
            </Link>

              {/* Launch Portal Split Pill Button (Desktop) */}
              <div
                ref={dropdownRef}
                className="relative hidden sm:block shrink-0"
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
                  className="relative inline-flex items-center h-[36px] rounded-full bg-white text-[#0a0a0c] font-semibold text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.25)] overflow-hidden transition-transform duration-150 active:scale-98 whitespace-nowrap shrink-0"
                  style={{ "--glow-d": "450px", "--mx": "50%", "--my": "50%" } as React.CSSProperties}
                >
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "radial-gradient(var(--glow-d, 450px) circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.4), transparent 70%)",
                    }}
                  />
                  <a
                    href="#role-gateway"
                    className="inline-flex items-center gap-1.5 px-3.5 h-full text-[#0a0a0c] hover:opacity-90 transition-opacity text-[13px] font-semibold whitespace-nowrap shrink-0"
                  >
                    Launch Portal
                  </a>
                  <button
                    ref={portalTriggerRef}
                    type="button"
                    onClick={() => setPortalOpen((open) => !open)}
                    aria-expanded={portalOpen}
                    aria-label="Portal role options"
                    className="inline-flex items-center justify-center px-2 h-full border-l border-[rgba(10,10,12,0.12)] hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-[#0a0a0c] transition-transform duration-200 ${portalOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {/* Portal Roles Dropdown */}
                <AnimatePresence>
                  {portalOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-72 rounded-[22px] border border-white/10 bg-[#16161d] p-2 shadow-2xl backdrop-blur-xl z-50"
                    >
                      <p className="px-3 pb-2 pt-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">
                        Unified Portal · All 5 Roles
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
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-hi">
                                {role.title}
                                <ArrowUpRight className="h-3.5 w-3.5 text-faint opacity-0 transition group-hover:opacity-100" />
                              </span>
                              <span className="mt-0.5 block truncate font-mono text-[10px] text-faint">
                                {role.path}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                      <div className="mt-1.5 border-t border-white/[0.08] pt-2 px-2 pb-1 flex items-center justify-between text-[11px]">
                        <Link
                          href="/auth/login"
                          onClick={() => setPortalOpen(false)}
                          className="text-accent hover:underline font-medium"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/auth/register"
                          onClick={() => setPortalOpen(false)}
                          className="text-mid hover:text-hi font-medium"
                        >
                          Create Account
                        </Link>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Mobile Hamburger */}
              <button
                ref={toggleButtonRef}
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-mid transition duration-150 hover:text-hi lg:hidden cursor-pointer shrink-0"
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
        </div>
    </motion.div >
      </header >

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Portal Navigation"
          >
            <div className="fixed inset-0" onClick={() => setMobileOpen(false)} />
            <motion.div
              ref={mobileCardRef}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-4 mt-20 max-h-[82vh] overflow-y-auto rounded-[24px] border border-white/10 bg-[#14141b] p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                  Portal Navigation
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-1.5 text-mid hover:bg-white/10 hover:text-hi"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-hi hover:bg-white/[0.06]"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-faint" />
                  </a>
                ))}
              </div>

              <div className="mt-4 border-t border-white/[0.08] pt-4">
                <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  Role Dashboards
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {PORTAL_ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <Link
                        key={role.key}
                        href={role.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-mid hover:bg-white/[0.06] hover:text-hi"
                      >
                        <Icon className="h-4 w-4 text-accent" />
                        <span className="flex-1 font-medium text-hi">{role.title}</span>
                        <span className="font-mono text-[10px] text-faint">{role.path}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-white/[0.08] pt-4">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-pill-glass h-10 justify-center text-xs font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-pill-accent h-10 justify-center text-xs font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            </motion.div>
  </motion.div>
        ) : null}
      </AnimatePresence >
    </>
  );
}
