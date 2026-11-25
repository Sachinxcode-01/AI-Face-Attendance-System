"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import {
  Activity,
  ChevronDown,
  Menu,
  ScanFace,
  Sparkles,
  X,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { NAV_LINKS, ROLES } from "@/lib/content";
import { PORTAL_LINKS } from "@/lib/constants";
import { GitHubButton } from "./github-button";

let activeHeaderScrollLocks = 0;
function acquireHeaderScrollLock(): () => void {
  activeHeaderScrollLocks++;
  if (activeHeaderScrollLocks === 1) {
    document.body.style.overflow = "hidden";
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeHeaderScrollLocks = Math.max(0, activeHeaderScrollLocks - 1);
    if (activeHeaderScrollLocks === 0) {
      document.body.style.overflow = "";
    }
  };
}

interface SiteHeaderProps {
  onOpenDemo?: () => void;
  onOpenPilot?: () => void;
}

export function SiteHeader({ onOpenDemo, onOpenPilot }: SiteHeaderProps) {
  const [portalOpen, setPortalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalTriggerRef = useRef<HTMLButtonElement>(null);
  const splitBtnRef = useRef<HTMLDivElement>(null);
  const mobileCardRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const brandLinkRef = useRef<HTMLAnchorElement>(null);
  const prevMobileOpen = useRef(mobileOpen);
  const closedByBreakpoint = useRef(false);
  const closedByAction = useRef(false);

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
    if (!mobileOpen) return;
    const release = acquireHeaderScrollLock();
    return () => {
      release();
    };
  }, [mobileOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) {
        closedByBreakpoint.current = true;
        setMobileOpen(false);
      }
    };
    mediaQuery.addEventListener("change", handleBreakpoint);
    return () => {
      mediaQuery.removeEventListener("change", handleBreakpoint);
    };
  }, []);

  // Restore focus when modal drawer is dismissed
  useEffect(() => {
    if (prevMobileOpen.current && !mobileOpen) {
      if (closedByAction.current) {
        closedByAction.current = false;
      } else if (closedByBreakpoint.current) {
        closedByBreakpoint.current = false;
        brandLinkRef.current?.focus();
      } else {
        toggleButtonRef.current?.focus();
      }
    }
    prevMobileOpen.current = mobileOpen;
  }, [mobileOpen]);

  // Move focus into the drawer modal on open
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

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center py-2.5 sm:py-3.5 px-3 pointer-events-none">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto relative flex items-center justify-between w-full max-w-[1260px] h-[52px] sm:h-[56px] px-3 sm:px-4 md:px-5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(14,14,18,0.85)] backdrop-blur-[16px] shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_16px_36px_-12px_rgba(0,0,0,0.6)]"
        >
          {/* Scroll Progress Bar at the bottom of the capsule */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <motion.div
              style={{ scaleX }}
              className="absolute bottom-0 inset-x-0 h-[2px] origin-left bg-gradient-to-r from-accent via-accent2 to-spotify pointer-events-none z-30"
            />
          </div>

          {/* Background header controls wrapped for inert handling during drawer open */}
          <div
            {...({ inert: mobileOpen ? "" : undefined } as any)}
            className="flex items-center justify-between flex-1 min-w-0"
          >
            {/* Brand */}
            <Link
              ref={brandLinkRef}
              href="/"
              className="flex items-center gap-2 sm:gap-2.5 text-hi shrink-0 cursor-pointer text-decoration-none group whitespace-nowrap"
              aria-label="SmartFace home"
            >
              <span className="relative grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-surface group-hover:border-accent/40 transition-colors shrink-0">
                <ScanFace className="h-4 w-4 text-accent transition-transform duration-300 group-hover:scale-110" strokeWidth={1.8} />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-spotify ring-2 ring-bg0" />
              </span>
              <span className="font-display text-[15px] font-semibold tracking-tight text-hi group-hover:text-white transition-colors">
                SmartFace
              </span>
            </Link>

            {/* Desktop Nav Links - Single Line Straight Layout */}
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

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* GitHub Star Button with Star Icon */}
              <div className="hidden md:block shrink-0">
                <GitHubButton />
              </div>

              {/* Book Demo Action Button */}
              {onOpenDemo && (
                <button
                  type="button"
                  onClick={onOpenDemo}
                  className="hidden sm:inline-flex btn-pill-accent h-[36px] px-3.5 text-[12.5px] font-semibold items-center gap-1.5 shadow-[0_0_16px_rgba(143,139,255,0.3)] transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span>Book Demo</span>
                </button>
              )}

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
                    href={PORTAL_LINKS.login}
                    className="inline-flex items-center gap-1.5 px-3.5 h-full text-[#0a0a0c] hover:opacity-90 transition-opacity text-[13px] font-semibold whitespace-nowrap shrink-0"
                  >
                    Launch Portal
                  </Link>
                  <button
                    ref={portalTriggerRef}
                    type="button"
                    onClick={() => setPortalOpen((open) => !open)}
                    aria-expanded={portalOpen}
                    aria-label="Portal role options"
                    className="inline-flex items-center justify-center px-2 h-full border-l border-[rgba(10,10,12,0.12)] hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-[#0a0a0c] transition-transform duration-200 ${
                        portalOpen ? "rotate-180" : ""
                      }`}
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
                        Unified Portal · Roles
                      </p>
                      {ROLES.map((role) => {
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
                        <Link
                          href={PORTAL_LINKS.login}
                          onClick={() => setPortalOpen(false)}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-[12px] font-semibold text-accent hover:bg-accent/10 transition-colors"
                        >
                          <span>Unified Sign In</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle Button (kept outside inert wrapper so it remains operable) */}
          <div className="flex items-center lg:hidden pl-2">
            <button
              ref={toggleButtonRef}
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-haspopup="dialog"
              aria-controls="mobile-nav-dialog"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-hi transition active:scale-95 hover:bg-white/[0.08]"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Drawer Navigation Modal */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />

            <motion.div
              ref={mobileCardRef}
              id="mobile-nav-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Menu"
              tabIndex={-1}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-3 top-16 z-50 rounded-[22px] border border-white/10 bg-[#101016]/95 p-5 shadow-2xl backdrop-blur-xl lg:hidden max-h-[calc(100dvh-5rem)] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <ScanFace className="h-5 w-5 text-accent" />
                  <span className="font-display font-semibold text-hi text-[15px]">SmartFace Suite</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-mid transition hover:bg-white/[0.08] hover:text-hi"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav aria-label="Mobile Navigation" className="flex flex-col gap-0.5">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-hi transition hover:bg-white/[0.06] hover:text-white active:bg-white/[0.08]"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-faint" />
                  </a>
                ))}
              </nav>

              {/* Role Portals Direct Links */}
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="px-3 pb-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">
                  Role Portals
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <Link
                        key={role.key}
                        href={role.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-[12px] font-medium text-hi hover:bg-white/[0.06] transition"
                      >
                        <Icon className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span className="truncate">{role.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 border-t border-[var(--hairline)] pt-3.5 space-y-2.5">
                <Link
                  href={PORTAL_LINKS.login}
                  onClick={() => setMobileOpen(false)}
                  className="btn-pill-white w-full h-[40px] text-[13.5px] font-semibold flex items-center justify-center gap-2"
                >
                  Sign In to Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {onOpenDemo ? (
                  <button
                    type="button"
                    onClick={() => {
                      closedByAction.current = true;
                      setMobileOpen(false);
                      onOpenDemo();
                    }}
                    className="btn-pill-accent w-full h-[40px] text-[13.5px] font-semibold flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Book Campus Demo
                  </button>
                ) : null}

                {onOpenPilot ? (
                  <button
                    type="button"
                    onClick={() => {
                      closedByAction.current = true;
                      setMobileOpen(false);
                      onOpenPilot();
                    }}
                    className="btn-pill-glass w-full h-[40px] text-[13.5px] font-medium flex items-center justify-center gap-2 border border-white/15 bg-white/[0.04] text-hi"
                  >
                    <Activity className="h-4 w-4 text-spotify" />
                    Apply for Pilot
                  </button>
                ) : null}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
