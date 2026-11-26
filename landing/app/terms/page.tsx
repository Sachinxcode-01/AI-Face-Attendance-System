import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { COMPANY_CONTACT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
  "Terms governing SmartFace open-source evaluation, managed pilot services, institutional data ownership, biometric consent duties, and vulnerability reporting.",
};

const SECTIONS = [
  {
    heading: "1. Scope: Open-Source Codebase vs. Managed Services",
    body: [
      "The SmartFace source code repository is published under the MIT License for self-hosted evaluation and deployment. When you self-host the MIT codebase, you operate and secure your own infrastructure, databases, and third-party API keys.",
      "These Terms govern use of this website, the hosted evaluation portal, and any commercial pilot or managed hosting engagement arranged with SmartFace.",
    ],
  },
  {
    heading: "2. Institutional Data Ownership & Export",
    body: [
      "Your institution retains full ownership of its student and faculty rosters, biometric templates, attendance records, and audit logs. Upon termination or cancellation of a commercial engagement (subject to 30 days' written notice), institutions may export their attendance and profile records in CSV or JSON format before residual managed-host copies are deleted.",
    ],
  },
  {
    heading: "3. Acceptable Use & Biometric Consent Responsibilities",
    body: [
      "You may not use SmartFace to conduct unauthorized surveillance outside enrolled campus populations, attempt to bypass authentication or rate limits, or probe hosted endpoints without written authorization.",
      "Deploying institutions act as the data fiduciary/controller for their students and staff and are solely responsible for obtaining informed biometric consent, providing non-biometric alternatives (such as rotating QR or manual recording), obtaining guardian consent for minors, and completing applicable legal/privacy reviews prior to production deployment.",
    ],
  },
  {
    heading: "4. Service Availability & Pilot Evaluation",
    body: [
      "Public demonstration and evaluation environments are provided on an as-is, best-effort basis without contractual uptime guarantees. Any commercial service-level targets, support response commitments, and remedies apply only when explicitly set out in an executed institutional service agreement.",
    ],
  },
  {
    heading: "5. Security Responsibilities & Vulnerability Reporting",
    body: [
      `SmartFace implements transport encryption, role-based access controls, password hashing, rate limiting, and audit logging. Suspected security vulnerabilities should be reported privately to ${COMPANY_CONTACT.securityEmail}.`,
      "Institutions are responsible for securing campus cameras, local host servers, environment secrets (JWT, AI internal tokens, database credentials), and prompt offboarding of departing staff accounts.",
    ],
  },
  {
    heading: "6. Limitation of Liability",
    body: [
      "SmartFace is an administrative attendance and campus logging tool, not a life-safety or physical emergency system. To the maximum extent permitted by law, neither SmartFace nor its maintainers are liable for indirect, incidental, or consequential damages, and aggregate commercial liability under a paid order is limited to fees paid in the 12 months preceding a claim.",
    ],
  },
  {
    heading: "7. Changes & Contact",
    body: [
      `We may update these terms periodically and reflect changes via the Last Updated date below. Questions regarding licensing, commercial terms, or legal notices should be sent to ${COMPANY_CONTACT.legalEmail} (${COMPANY_CONTACT.developer}, ${COMPANY_CONTACT.location}, Phone: ${COMPANY_CONTACT.phoneFormatted}). Repository: ${COMPANY_CONTACT.github}.`,
    ],
  },
];

export default function TermsPage() {
  return (
        <main className="relative min-h-screen pb-28 pt-24 sm:pt-32">
          <div className="relative mx-auto w-full max-w-[46rem] px-6">
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-mid transition hover:border-white/20 hover:text-hi"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Home
              </Link>
            </div>

            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              <Scale className="h-4 w-4" strokeWidth={1.8} />
              Legal
            </p>
            <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.03em] text-hi sm:text-5xl">
              Terms &amp; Conditions
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-mid">
              Last updated: November 26, 2026 · Clear terms for open-source evaluation and institutional deployments.
            </p>

            <div className="mt-12 space-y-10">
              {SECTIONS.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-display text-xl font-medium tracking-tight text-hi">
                    {section.heading}
                  </h2>
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 28)} className="mt-3 text-[15px] leading-relaxed text-mid">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>

                <div className="mt-16 pt-8 border-t border-[var(--hairline)] flex items-center justify-between font-mono text-[11px] text-faint">
                  <Link href="/" className="hover:text-hi transition-colors">
                    ← Front door
                  </Link>
                  <div className="flex gap-4">
                    <Link href="/privacy" className="hover:text-hi transition-colors">
                      Privacy Policy →
                    </Link>
                  </div>
                </div>
            </div>
        </main>
        );
}
