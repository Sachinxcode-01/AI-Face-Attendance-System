import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock, ShieldCheck, Video } from "lucide-react";
import { COMPANY_CONTACT, PORTAL_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Request Confirmed",
  description:
  "Thank you for submitting a SmartFace demo or pilot inquiry. Review your next steps and explore the unified portal.",
  robots: {
    index: false,
    follow: true,
  },
};

const NEXT_STEPS = [
  {
    icon: Clock,
    title: "1. Inquiry Review",
    description: "We review your campus student/faculty size, camera setup, and preferred deployment mode.",
  },
  {
    icon: Video,
    title: "2. 30-Minute Walkthrough",
    description: "Inspect the five role portals, InsightFace ArcFace verification, 20s rotating QR, and exports.",
  },
  {
    icon: ShieldCheck,
    title: "3. Controlled Pilot Scoping",
    description: "Scope a single-department pilot with consent workflows and hardware compatibility checks.",
  },
];

export default function ThankYouPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg0 px-6 py-20 font-sans">
        <div className="relative z-10 mx-auto w-full max-w-2xl rounded-[22px] card-bytune p-8 sm:p-12 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-spotify/30 bg-spotify/10">
            <CheckCircle2 className="h-8 w-8 text-spotify" />
          </div>

          <div className="mt-6 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9fe0b6]">
              Request Recorded
            </span>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-hi sm:text-4xl">
              Thank you for reaching out.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-mid">
              We have received your campus request. In the meantime, you can explore the unified portal or inspect the source architecture on GitHub.
            </p>
          </div>

        <div className="mt-10 space-y-4 rounded-md border border-[var(--hairline)] bg-bg0 p-6 text-left">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            What Happens Next
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {NEXT_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-accent" />
                    <span className="text-[13px] font-semibold text-hi">{step.title}</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-mid">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="group btn-pill-accent h-11 w-full sm:w-auto px-6 text-[14px] font-semibold inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to Homepage
          </Link>

          <a
            href={PORTAL_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-pill-glass h-11 w-full sm:w-auto px-6 text-[14px] font-medium inline-flex items-center justify-center gap-2"
          >
            Explore Unified Portal
            <ArrowUpRight className="h-4 w-4 text-accent" />
          </a>
        </div>

        <div className="mt-8 border-t border-[var(--hairline)] pt-4 text-center">
          <p className="text-[12px] text-faint">
            Direct inquiry:{" "}
            <a href={`mailto:${COMPANY_CONTACT.email}`} className="text-accent underline">
              {COMPANY_CONTACT.email}
            </a>{" "}
            or <span className="text-mid font-medium">{COMPANY_CONTACT.phoneFormatted}</span> ({COMPANY_CONTACT.developer}, {COMPANY_CONTACT.address}, India).
          </p>
        </div>
      </div>
          </div>
          );
}
