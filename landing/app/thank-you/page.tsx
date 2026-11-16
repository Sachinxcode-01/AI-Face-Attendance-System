import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock, ShieldCheck, Video } from "lucide-react";
import { PORTAL_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Demo Request Confirmed",
  description:
    "Thank you for requesting a SmartFace campus walkthrough. Our enterprise team will be in touch shortly.",
  robots: {
    index: false,
    follow: true,
  },
};

const NEXT_STEPS = [
  {
    icon: Clock,
    title: "1. Confirmation in < 4 Hours",
    description: "Our solutions architect will review your campus size and verify compatibility.",
  },
  {
    icon: Video,
    title: "2. 30-Minute Live Session",
    description: "Experience the kiosk latency, anti-proxy rotating QR, and admin sentinel live.",
  },
  {
    icon: ShieldCheck,
    title: "3. Proof of Concept Deployment",
    description: "Option to pilot one gate or lecture hall with zero upfront infrastructure cost.",
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
              Request Dispatched
            </span>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-hi sm:text-4xl">
              You&apos;re on the record.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-mid">
              We have received your campus demo request. A SmartFace enterprise architect has been
              assigned to prepare your personalized walkthrough environment.
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
              Explore Live Portal
              <ArrowUpRight className="h-4 w-4 text-accent" />
            </a>
          </div>

          <div className="mt-8 border-t border-[var(--hairline)] pt-4 text-center">
            <p className="text-[12px] text-faint">
              Direct developer inquiry? Email{" "}
              <a href="mailto:kalinganavarsachin@gmail.com" className="text-accent underline">
                kalinganavarsachin@gmail.com
              </a>{" "}
              or call/WhatsApp <span className="text-mid font-medium">+91 98807 62623</span> (Sachin K, Gadag, Karnataka, India).
            </p>
          </div>
        </div>
      </div>
      );
}
