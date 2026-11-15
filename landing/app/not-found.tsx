import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ScanFace } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found — SmartFace",
  description:
    "This page wandered off campus. Head back to the SmartFace landing page for touchless biometric attendance.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[140px]" />
        <div className="absolute inset-0 bg-grid mask-radial opacity-30" />
      </div>

      <div className="relative">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
          Error · 404 · Off the roster
        </p>
        <h1 className="mt-5 font-display text-[5rem] font-medium leading-none tracking-[-0.035em] text-hi sm:text-[7rem]">
          404
        </h1>
        <div className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-2xl border border-[var(--hairline)] bg-white/[0.03] text-accent">
          <ScanFace className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <p className="mx-auto mt-6 max-w-[420px] text-pretty text-[15.5px] leading-relaxed text-mid">
          We scanned the room and this page isn&apos;t on the roster. It may have moved, or the
          link was never enrolled.
        </p>
        <Link
          href="/"
          className="button-primary mt-9 inline-flex h-12 items-center gap-2 px-6 transition-colors duration-200 hover:bg-[var(--glass-strong)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to the front door
        </Link>
      </div>
    </main>
  );
}
