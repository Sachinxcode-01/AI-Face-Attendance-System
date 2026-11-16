import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SmartFace collects, stores and deletes face data: embeddings only, raw frames never persisted, every access audit-logged.",
};

const SECTIONS = [
  {
    heading: "1. What we collect",
    body: [
      "When a campus enrolls a student or staff member, SmartFace converts the captured face frame into a 512-dimension mathematical embedding. The raw photograph is used for that single enrollment moment and is then discarded: it is never stored, never backed up, and never sent to a third party.",
      "What persists is: the embedding, the attendance records it produces (gate, timestamp, confidence score), and the account details your institution provides (name, role, email).",
    ],
  },
  {
    heading: "2. What we never do",
    body: [
      "We never sell personal data. We never train models on your campus's embeddings. We never share records with advertisers, data brokers, or other institutions.",
      "Verification runs on your own edge node wherever possible; when a frame must travel, it travels over TLS to infrastructure in your chosen region.",
    ],
  },
  {
    heading: "3. Retention and deletion",
    body: [
      "Admins can delete or re-enroll any profile from the Admin Sentinel at any time. Deletion removes the embedding, the profile, and their attendance history within 30 days, with a confirmation written to the audit trail.",
      "Audit log entries are retained for the period your institution's policy requires, because they are the evidence that makes attendance records defensible.",
    ],
  },
  {
    heading: "4. Liveness and anti-spoofing",
    body: [
      "Liveness checks run before any match is accepted. Printed photos, replayed video, and flat masks fail. These checks are computed on-device where the hardware allows, and no biometric template leaves the campus network for the purpose.",
    ],
  },
  {
    heading: "5. Parent and student rights",
    body: [
      "Parents may request a copy of their child's attendance record at any time from the Parent Portal, and may request erasure of the underlying embedding through the institution's admin. Where local law requires consent, enrollment happens only after the institution obtains it.",
    ],
  },
  {
    heading: "6. Security",
    body: [
      "Access to the admin console requires SSO with role-based authorization. Every access to biometric or attendance data is written to an append-only audit trail. Passwords are hashed; secrets live in environment variables, never in client bundles.",
    ],
  },
  {
    heading: "7. Contact",
    body: [
      "Questions about this policy, data exports, or deletion requests go to kalinganavarsachin@gmail.com (Sachin K, Lead Developer, Gadag, Karnataka, India - 582103, Phone: +91 98807 62623). Project repository: https://github.com/Sachinxcode-01/AI-Face-Attendance-System.",
    ],
  },
];

export default function PrivacyPage() {
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
            <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
            Legal
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.03em] text-hi sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-mid">
            Last updated: November 15, 2026 · SmartFace is a biometric product; this page is written
            to be read, not filed away.
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

          <div className="mt-16 pt-8 border-t border-[var(--hairline)] flex items-center justify-between font-mono text-[11px] text-faint">
            <Link href="/" className="hover:text-hi transition-colors">
              ← Front door
            </Link>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-hi transition-colors">
                Terms & Conditions →
              </Link>
            </div>
          </div>
        </div>
      </main>
      );
}
