"use client";

import Link from "next/link";
import { Github, ScanFace } from "lucide-react";
import { COMPANY_CONTACT, DEMO_MAILTO, PORTAL_LINKS } from "@/lib/constants";
import { NAV_LINKS, ROLES } from "@/lib/content";

interface SiteFooterProps {
  onOpenDemo?: () => void;
}

export function SiteFooter({ onOpenDemo }: SiteFooterProps) {
  return (
    <footer className="relative border-t border-[var(--hairline)] pt-16 pb-12">
      <style>{`
        .container.sp-e1 {
          box-sizing: border-box;
          color: rgb(245, 245, 248);
          font-family: Inter, "Inter Fallback", system-ui, -apple-system, "Segoe UI", sans-serif;
          font-size: 16px;
          line-height: 25.6px;
          margin-right: auto;
          margin-left: auto;
          max-width: 1180px;
          width: 100%;
          padding: 0 16px;
        }

        .sp-e2 {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 32px;
        }

        .sp-e3 {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 320px;
        }

        .sp-e4 {
          display: flex;
          align-items: center;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }

        .sp-e5 {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brand-icon-box {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #8f8bff;
          display: grid;
          place-items: center;
          color: #050507;
          font-weight: 700;
          font-size: 13px;
        }

        .brand-text {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #f5f5f8;
        }

        .sp-e8 {
          color: rgb(138, 138, 151);
          font-size: 13.5px;
          line-height: 21.6px;
        }

        .sp-e9 {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sp-e10 {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
        }

        .sp-e11 {
          display: block;
          color: rgb(182, 182, 194);
          font-size: 13.5px;
          line-height: 21.6px;
          padding: 8px 14px;
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s ease, background 0.15s ease;
          white-space: nowrap;
        }

        .sp-e11:hover {
          color: var(--text-hi);
          background: rgba(255, 255, 255, 0.05);
        }

        .sp-e12 {
          display: block;
          color: rgb(138, 138, 151);
          font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          line-height: 17.6px;
          letter-spacing: 1.32px;
          text-transform: uppercase;
          padding: 8px 6px 8px 14px;
        }

        .sp-e13 {
          display: flex;
          color: rgb(96, 96, 108);
          font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px;
          line-height: 17.6px;
          letter-spacing: 0.55px;
          margin-top: 44px;
          padding-top: 22px;
          border-top: 0.8px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 12px;
        }

        .sp-e14 {
          display: block;
        }

        .sp-e15 {
          color: inherit;
          text-decoration: underline rgba(255, 255, 255, 0.16);
          text-underline-offset: 3px;
          cursor: pointer;
        }

        .sp-e15:hover {
          color: #f5f5f8;
          text-decoration-color: #8f8bff;
        }

        .sp-e16 {
          color: rgb(96, 96, 108);
          font-size: 11.5px;
          line-height: 18.4px;
          margin-top: 14px;
          max-width: 489.6px;
        }

        @media (max-width: 720px) {
          .sp-e2 {
            flex-direction: column;
            gap: 24px;
          }
          .sp-e13 {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>

            {/* Main Container */}
            <div className="container sp-e1">
              {/* Top CTA banner */}
              <div className="relative mb-14 overflow-hidden rounded-lg border border-[var(--hairline)] bg-surface p-8 sm:p-10 shadow-sm">
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
                    </a>
                  </div>
                </div>
              </div>

                  {/* ByTune-structured Footer Top */}
                  <div className="Footer_top__b4wwC sp-e2">
                    <div className="Footer_brandCol__HhVKt sp-e3">
                      <a href="#top" className="Footer_brand___zP6t sp-e4" aria-label="SmartFace, back to top">
                        <span className="BrandLockup_lockup__x0MoE sp-e5" aria-hidden="true">
                          <span className="relative grid h-7 w-7 place-items-center rounded-md bg-[#8f8bff] text-[#050507]">
                            <ScanFace className="h-4 w-4" strokeWidth={2.4} />
                          </span>
                          <span className="brand-text">SmartFace</span>
                        </span>
                      </a>
                      <p className="Footer_tagline__EtMBR sp-e8">
                        Enterprise face recognition, anti-proxy rotating codes, and instant campus alerts.
                        Sub-300ms verification at the edge.
                      </p>
                    </div>

                        <div className="Footer_navs__Vw7yd sp-e9">
                          <nav className="Footer_links__oDyjI sp-e10" aria-label="Footer">
                            {NAV_LINKS.map((link) => (
                              <a key={link.href} href={link.href} className="sp-e11">
                                {link.label}
                              </a>
                            ))}
                            <a href={COMPANY_CONTACT.github} target="_blank" rel="noreferrer" className="sp-e11">
                              GitHub
                            </a>
                            <Link href="/privacy" className="sp-e11">
                              Privacy
                            </Link>
                              <Link href="/terms" className="sp-e11">
                                Terms
                              </Link>
                          </nav>
                          <nav className="Footer_links__oDyjI sp-e10" aria-label="Portals">
                            <span className="Footer_navLabel__dYO4V sp-e12" aria-hidden="true">Portals</span>
                            {ROLES.map((role) => (
                              <a key={role.key} href={role.href} target="_blank" rel="noreferrer" className="sp-e11">
                                {role.title}
                              </a>
                            ))}
                          </nav>
                        </div>
                    </div>

                    {/* ByTune-structured Footer Bottom */}
                    <div className="Footer_bottom__O5rKs sp-e13">
                      <span className="sp-e14">
                        © {new Date().getFullYear()} SmartFace Systems · ArcFace ONNX v2.4
                      </span>
                      <span className="sp-e14">Enterprise touchless biometric attendance.</span>
                      <span className="sp-e14">
                        Built by{" "}
                        <a
                          href={COMPANY_CONTACT.github}
                          target="_blank"
                          rel="noreferrer"
                          className="sp-e15"
                        >
                          {COMPANY_CONTACT.developer}
                        </a>{" "}
                        (Gadag, Karnataka, India).
                      </span>
                    </div>

                    <p className="Footer_artCredit__n3Cmv sp-e16">
                      Biometric templates are stored as 512-dimension mathematical embeddings; raw facial images are processed ephemerally at the edge and never retained on unencrypted storage.
                    </p>
                  </div>
                </footer>
                );
}
