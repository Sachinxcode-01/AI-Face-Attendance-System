"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Shield, X } from "lucide-react";

const STORAGE_KEY = "smartface-cookie-consent";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Small delay so it doesn't pop in abruptly on initial paint
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage access disabled or private browsing
    }
  }, []);

  const handleConsent = (level: "all" | "essential") => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ level, timestamp: Date.now() }));
    } catch {
      // noop
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg transition-all duration-300 sm:bottom-6 sm:left-6 sm:right-auto"
    >
      <div className="relative overflow-hidden rounded-md border border-[var(--hairline-strong)] bg-bg0 p-5 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-accent/30 bg-accent/10">
            <Cookie className="h-4 w-4 text-accent" />
          </div>

          <div className="flex-1">
            <p className="text-[13px] font-medium text-hi">Privacy & Telemetry Consent</p>
            <p className="mt-1 text-[12px] leading-relaxed text-mid">
              We use strictly essential session tokens and privacy-preserving performance metrics to
              guarantee kiosk connectivity. Read our{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleConsent("all")}
                className="inline-flex h-8 items-center justify-center rounded-md bg-accent px-3.5 text-[12px] font-semibold text-[#050507] transition hover:opacity-90"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={() => handleConsent("essential")}
                className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--hairline)] bg-white/[0.04] px-3 text-[12px] font-medium text-mid transition hover:bg-white/[0.08] hover:text-hi"
              >
                Essential Only
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleConsent("essential")}
            aria-label="Close cookie banner"
            className="text-faint hover:text-hi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
