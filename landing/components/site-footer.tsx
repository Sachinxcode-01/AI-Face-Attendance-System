import { ArrowRight, ArrowUpRight, ScanFace } from "lucide-react";
import { DEMO_MAILTO, PORTAL_URL } from "@/lib/constants";
import { NAV_LINKS, ROLES } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/[0.06]">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-600/25 blur-3xl"
          />
          <div aria-hidden className="absolute inset-0 bg-grid mask-radial opacity-30" />

          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-300">
                Ready when you are
              </p>
              <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-[-0.03em] text-ink sm:text-[2.6rem] sm:leading-[1.1]">
                Put your campus on the record.
              </h2>
              <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-ink-muted">
                Walk through a live session, a kiosk check-in and the admin sentinel with our team.
                30 minutes, your scenarios, no install required.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <a
                href={DEMO_MAILTO}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-6 text-[14px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(79,70,229,0.9)] transition hover:brightness-110"
              >
                Request a Campus Demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href={PORTAL_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-6 text-[14px] font-medium text-ink transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Launch Portal
                <ArrowUpRight className="h-4 w-4 text-brand-300" />
              </a>
              <p className="text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-faint lg:text-left">
                30-minute walkthrough · No install
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-b border-white/[0.06] pb-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-brand-500/25 to-brand-600/5">
                <ScanFace className="h-5 w-5 text-brand-300" strokeWidth={1.6} />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-surface" />
              </span>
              <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
                SmartFace
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink-muted">
              Touchless biometric attendance, anti-proxy session integrity and campus security — one
              platform, four portals.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              ArcFace v2.4 · all systems live
            </p>
          </div>

          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[13px] text-ink-muted transition hover:text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">
              Portals
            </p>
            <ul className="mt-4 space-y-2.5">
              {ROLES.map((role) => (
                <li key={role.key}>
                  <a
                    href={role.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted transition hover:text-ink"
                  >
                    {role.title}
                    <ArrowUpRight className="h-3 w-3 text-ink-faint" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-ink-faint">
            © {new Date().getFullYear()} SmartFace. All rights reserved.
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
            ArcFace v2.4 · ONNX runtime · Edge verified
          </p>
        </div>
      </div>
    </footer>
  );
}
