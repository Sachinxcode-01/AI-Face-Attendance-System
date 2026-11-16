"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--hairline-strong)] bg-bg0/95 backdrop-blur-xl px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] lg:hidden"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto flex max-w-md items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenDemo}
          className="flex-1 btn-pill-accent h-[42px] text-[13.5px]"
        >
          Request Demo
        </button>

        <a
          href={PORTAL_URL}
          target="_blank"
          rel="noreferrer"
          className="flex-1 btn-pill-glass h-[42px] text-[13.5px]"
        >
          Launch Portal
          <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
        </a>
      </div>
    </div>
  );
}
