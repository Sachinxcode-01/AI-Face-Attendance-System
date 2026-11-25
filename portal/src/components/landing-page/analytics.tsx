"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;
const STORAGE_KEY = "smartface-cookie-consent";

function hasAllConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.level === "all";
  } catch {
    return false;
  }
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (
    typeof window !== "undefined" &&
    typeof window.gtag === "function" &&
    GA_MEASUREMENT_ID &&
    hasAllConsent()
  ) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

export function Analytics() {
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    setConsentGranted(hasAllConsent());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setConsentGranted(hasAllConsent());
      }
    };

    const handleConsentChange = () => {
      setConsentGranted(hasAllConsent());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("smartface-consent-change", handleConsentChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("smartface-consent-change", handleConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = !consentGranted;
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: consentGranted ? "granted" : "denied",
      });
    }
  }, [consentGranted]);

  if (!GA_MEASUREMENT_ID || !consentGranted) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true
            });
          `,
        }}
      />
    </>
  );
}
