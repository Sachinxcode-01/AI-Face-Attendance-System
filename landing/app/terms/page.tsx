import type { Metadata } from "next";
import { Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms that govern use of the SmartFace platform — acceptable use, service levels, data ownership, and liability.",
};

const SECTIONS = [
  {
    heading: "1. The agreement",
    body: [
      "These terms govern access to and use of the SmartFace platform, including the marketing site, the unified portal, and the edge verification software. By creating an account or deploying a gateway, your institution agrees to these terms and to the Privacy Policy.",
    ],
  },
  {
    heading: "2. What you own",
    body: [
      "Your institution owns its enrollment data, attendance records, and audit logs outright. SmartFace claims no license over them beyond operating the service you contracted for. On termination, we export everything in open formats and delete residual copies within 30 days.",
    ],
  },
  {
    heading: "3. Acceptable use",
    body: [
      "Do not use the platform to surveil people outside the campus population you enrolled, to build profiles unrelated to attendance, or to bypass liveness and anti-proxy controls. Do not probe, scan, or stress the service without written permission.",
      "Biometric enrollment requires the informed consent of the person enrolled, or of their guardian where local law requires it. The institution is responsible for obtaining and recording that consent.",
    ],
  },
  {
    heading: "4. Service levels",
    body: [
      "We target 99.9% monthly availability for the verification API and publish status in real time. Scheduled maintenance is announced at least 72 hours ahead. If we miss the target, the remedy is service credit as set out in your order form — this is the exclusive remedy for downtime.",
    ],
  },
  {
    heading: "5. Security responsibilities",
    body: [
      "We secure the platform: encryption in transit and at rest, SSO with role-based access, append-only audit trails, and coordinated disclosure for vulnerabilities reported to security@smartface.pro.",
      "You secure your side: camera placement that respects the people it covers, credential hygiene for admin accounts, and timely offboarding of staff who leave the institution.",
    ],
  },
  {
    heading: "6. Liability",
    body: [
      "SmartFace is an attendance and security tool, not a life-safety system. To the maximum extent permitted by law, our aggregate liability is limited to the fees paid in the 12 months before the claim. We are not liable for indirect or consequential loss.",
    ],
  },
  {
    heading: "7. Changes and contact",
    body: [
      "We may update these terms with 30 days' notice for material changes. Continued use after the effective date is acceptance. Questions go to legal@smartface.pro.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="relative min-h-screen pb-28 pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[150px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[46rem] px-6">
        <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
          <Scale className="h-4 w-4" strokeWidth={1.8} />
          Legal
        </p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.03em] text-hi sm:text-5xl">
          Terms &amp; Conditions
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-mid">
          Last updated: November 15, 2026 · The short version, written for humans.
        </p>

        <div className="mt-12 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-xl font-medium tracking-tight text-hi">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="mt-3 text-[15px] leading-relaxed text-mid">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
