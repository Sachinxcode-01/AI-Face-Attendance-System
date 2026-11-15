import { ArrowRight, ArrowUpRight, ScanFace } from "lucide-react";
import { DEMO_MAILTO, PORTAL_URL } from "@/lib/constants";
import { NAV_LINKS, ROLES } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-[var(--hairline)]">
      <div className="mx-auto w-full max-w-[var(--container)] px-6 py-16 lg:px-8 lg:py-20">
        {/* CTA band */}
        <div className="glass-card relative overflow-hidden !rounded-[22px] !p-10 sm:!p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
          />
          <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />

          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                Ready when you are
              </p>
              <h2 className="mt-3 text-balance font-display text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-hi sm:text-[2.6rem]">
                Put your campus on the record.
              </h2>
              <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-mid">
                Walk through a live session, a kiosk check-in and the admin sentinel with our team.
                30 minutes, your scenarios, no install required.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <a
                href={DEMO_MAILTO}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-accent to-[#6a66e8] px-6 text-[14px] font-semibold text-[#0a0a0c] shadow-[0_18px_40px_-18px_rgba(143,139,255,0.9)] transition duration-200 hover:brightness-110"
              >
                Request a Campus Demo
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <a
                href={PORTAL_URL}
                target="_blank"
                rel="noreferrer"
                className="button-primary inline-flex h-12 items-center justify-center gap-2 px-6 transition-colors duration-200 hover:bg-[var(--glass-strong)]"
              >
                Launch Portal
                <ArrowUpRight className="h-4 w-4 text-accent" />
              </a>
              <p className="text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint lg:text-left">
                30-minute walkthrough · No install
              </p>
            </div>
          </div>
        </div>

        {/* Link columns */}
        <div className="mt-14 grid gap-10 border-b border-[var(--hairline)] pb-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-accent/25 to-accent/5">
                <ScanFace className="h-5 w-5 text-accent" strokeWidth={1.6} />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#1ed760] shadow-[0_0_8px_#1ed760] ring-2 ring-bg0" />
              </span>
              <span className="font-display text-[15px] font-semibold tracking-tight text-hi">
                SmartFace
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-mid">
              Touchless biometric attendance, anti-proxy session integrity and campus security — one
              platform, four portals.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[var(--hairline)] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1ed760]" />
              ArcFace v2.4 · all systems live
            </p>
          </div>

          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[13px] text-mid transition duration-200 hover:text-hi"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">Portals</p>
            <ul className="mt-4 space-y-2.5">
              {ROLES.map((role) => (
                <li key={role.key}>
                  <a
                    href={role.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] text-mid transition duration-200 hover:text-hi"
                  >
                    {role.title}
                    <ArrowUpRight className="h-3 w-3 text-faint" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-faint">
            © {new Date().getFullYear()} SmartFace. All rights reserved.
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
            ArcFace v2.4 · ONNX runtime · Edge verified
          </p>
        </div>
      </div>
    </footer>
  );
}
