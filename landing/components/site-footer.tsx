import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Github,
  Mail,
  MapPin,
  Phone,
  ScanFace,
  User,
} from "lucide-react";
import { COMPANY_CONTACT, DEMO_MAILTO, PORTAL_URL } from "@/lib/constants";
import { NAV_LINKS, ROLES } from "@/lib/content";

interface SiteFooterProps {
  onOpenDemo?: () => void;
}

export function SiteFooter({ onOpenDemo }: SiteFooterProps) {
  return (
    <footer className="relative border-t border-[var(--hairline)]">
      <div className="mx-auto w-full max-w-[var(--container)] px-6 py-16 lg:px-8 lg:py-20">
        {/* CTA band */}
          <div className="relative overflow-hidden rounded-lg border border-[var(--hairline)] bg-surface p-8 sm:p-10 shadow-sm">
            <div aria-hidden="true" className="absolute inset-0 bg-grid opacity-20" />

            <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                  <h2 className="text-balance font-display text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-hi sm:text-[2.6rem]">
                    Put your campus on the record.
                  </h2>
                  <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-mid">
                    Walk through a live session, a kiosk check-in and the admin sentinel with our team.
                    Open-source biometric attendance engine with sub-300ms verification.
                  </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                {onOpenDemo ? (
                  <button
                    type="button"
                    onClick={onOpenDemo}
                    className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-[14px] font-semibold text-[#050507] transition hover:opacity-90"
                  >
                    Request a Campus Demo
                  </button>
                ) : (
                  <a
                    href={DEMO_MAILTO}
                    className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-[14px] font-semibold text-[#050507] transition hover:opacity-90"
                  >
                    Request a Campus Demo
                  </a>
                )}
                <a
                  href={COMPANY_CONTACT.github}
                  target="_blank"
                  rel="noreferrer"
                  className="button-primary inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-[14px] transition-colors duration-200 hover:bg-white/[0.04]"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                  <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
                </a>
                <p className="text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint lg:text-left">
                  Developed by Sachin K · Karnataka, India
                </p>
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="mt-14 grid gap-10 border-b border-[var(--hairline)] pb-12 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand info */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3">
                  <span className="relative grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-surface">
                    <ScanFace className="h-5 w-5 text-accent" strokeWidth={1.6} />
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#1ed760] ring-2 ring-bg0" />
                  </span>
                  <span className="font-display text-[15px] font-semibold tracking-tight text-hi">
                    SmartFace
                  </span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-mid">
                Touchless biometric attendance, anti-proxy session integrity and campus security: one
                platform, four portals.
              </p>

              {/* Developer pill & status */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-surface px-2.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1ed760]" />
                    ArcFace v2.4 · All Systems Live
                  </span>
                  <a
                    href={COMPANY_CONTACT.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-accent/20 bg-accent/5 px-2.5 py-1.5 font-mono text-[9.5px] text-accent hover:border-accent/40 transition"
                  >
                    <Github className="h-3 w-3" />
                    {COMPANY_CONTACT.githubRepo}
                  </a>
              </div>
            </div>

            {/* Navigation Links */}
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

            {/* Portals */}
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

            {/* Developer & Contact Info */}
            <div>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-faint">Developer & Contact</p>
              <div className="mt-4 space-y-3 text-[12.5px] text-mid">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="font-medium text-hi">{COMPANY_CONTACT.developer}</span>
                  <span className="text-[11px] text-faint font-mono">Developer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <a href={`mailto:${COMPANY_CONTACT.email}`} className="hover:text-hi transition break-all">
                    {COMPANY_CONTACT.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <a href={`tel:${COMPANY_CONTACT.phone}`} className="hover:text-hi transition">
                    {COMPANY_CONTACT.phoneFormatted}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>
                    {COMPANY_CONTACT.location}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Github className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <a
                    href={COMPANY_CONTACT.github}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline flex items-center gap-1 text-[12px]"
                  >
                    GitHub Repository
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar with Copyright & Legal Links */}
          <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11.5px] text-faint">
              © {new Date().getFullYear()} {COMPANY_CONTACT.name} · Developed by{" "}
              <a href={COMPANY_CONTACT.github} target="_blank" rel="noreferrer" className="text-hi hover:text-accent font-medium">
                {COMPANY_CONTACT.developer}
              </a>{" "}
              (Gadag, Karnataka, India).
            </p>

            <div className="flex flex-wrap items-center gap-5 text-[12px] text-mid">
              <Link href="/privacy" className="hover:text-hi transition">
                Privacy Policy
              </Link>
              <span className="text-faint">·</span>
              <Link href="/terms" className="hover:text-hi transition">
                Terms & Conditions
              </Link>
              <span className="text-faint">·</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                ArcFace v2.4 · ONNX Runtime · PIN: 582103
              </span>
            </div>
          </div>
        </div>
    </footer>
  );
}
