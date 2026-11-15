"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { PORTAL_URL } from "@/lib/constants";

interface StickyMobileCtaProps {
  onOpenDemo: () => void;
}

export function StickyMobileCta({ onOpenDemo }: StickyMobileCtaProps) {
  const [visible, setVisible] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Show after scrolling past initial hero view (>280px)
    setVisible(latest > 280);
  });

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Quick mobile actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline-strong)] bg-bg0/90 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl lg:hidden"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex max-w-md items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenDemo}
          className="flex-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-accent to-[#6a66e8] px-3 text-[13px] font-semibold text-[#0a0a0c] shadow-[0_4px_16px_rgba(143,139,255,0.4)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Request Demo
        </button>

        <a
          href={PORTAL_URL}
          target="_blank"
          rel="noreferrer"
          className="flex-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--hairline)] bg-surface px-3 text-[13px] font-medium text-hi transition hover:bg-white/[0.08] active:scale-[0.98]"
        >
          Launch Portal
          <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
        </a>
      </div>
    </div>
  );
}
