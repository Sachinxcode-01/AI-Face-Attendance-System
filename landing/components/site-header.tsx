"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, ScanFace, X } from "lucide-react";
import { NAV_LINKS, ROLES } from "@/lib/content";
import { PORTAL_URL } from "@/lib/constants";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 12));

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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || mobileOpen
          ? "border-white/[0.06] bg-canvas/80 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="SmartFace home">
          <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-brand-500/25 to-brand-600/5">
            <ScanFace className="h-5 w-5 text-brand-300" strokeWidth={1.6} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-canvas" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-semibold tracking-tight text-ink">SmartFace</span>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-faint">
              Biometric Attendance
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-muted transition hover:bg-white/[0.04] hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div ref={dropdownRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setPortalOpen((open) => !open)}
              aria-expanded={portalOpen}
              aria-haspopup="menu"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-[13px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(79,70,229,0.9)] transition hover:brightness-110"
            >
              Launch Portal
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${portalOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {portalOpen ? (
                <motion.div
                  role="menu"
                  aria-label="Launch a portal"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 bg-surface/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
                >
                  <p className="px-3 pb-2 pt-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">
                    Unified portal · Website 2
                  </p>
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <a
                        key={role.key}
                        role="menuitem"
                        href={role.href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setPortalOpen(false)}
                        className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[0.05]"
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" strokeWidth={1.8} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink">
                            {role.title}
                            <ArrowUpRight className="h-3.5 w-3.5 text-ink-faint opacity-0 transition group-hover:opacity-100" />
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[10px] text-ink-faint">
                            {role.path}
                          </span>
                        </span>
                      </a>
                    );
                  })}
                  <a
                    href={PORTAL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center justify-between rounded-xl border-t border-white/[0.06] px-3 py-2.5 text-[12px] text-ink-muted transition hover:text-ink"
                  >
                    Open portal home
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-ink lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto border-t border-white/[0.06] bg-canvas/95 px-6 py-8 backdrop-blur-xl lg:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3.5 text-[15px] font-medium text-ink transition hover:bg-white/[0.04]"
                >
                  {link.label}
                  <ArrowRight className="h-4 w-4 text-ink-faint" />
                </a>
              ))}
            </nav>

            <div className="mt-8 border-t border-white/[0.06] pt-6">
              <p className="px-3 font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-faint">
                Portals · Website 2
              </p>
              <div className="mt-3 space-y-1">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  return (
                    <a
                      key={role.key}
                      href={role.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.04]"
                    >
                      <Icon className="h-4 w-4 text-brand-300" strokeWidth={1.8} />
                      <span className="flex-1 text-[14px] text-ink">{role.title}</span>
                      <ArrowUpRight className="h-4 w-4 text-ink-faint" />
                    </a>
                  );
                })}
              </div>
              <a
                href={PORTAL_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 text-[14px] font-semibold text-white"
              >
                Go to Portal
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
