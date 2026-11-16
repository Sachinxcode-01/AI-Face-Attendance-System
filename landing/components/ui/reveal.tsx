"use client";

import { useEffect, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Entrance-animation wrapper (ByTune load-time motion model).
 *
 * Visibility rules:
 * - No-JS / crawlers / preview tools: content is fully visible — the
 *   hidden state only exists when <html> carries the `.js` class, which
 *   is set by an inline blocking script in the document <head>.
 * - With JS: mounts hidden, then flips to `.reveal-in` on the next
 *   frame so the fade/rise transition always plays exactly once.
 * - prefers-reduced-motion: transitions are globally disabled in CSS.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`reveal ${mounted ? "reveal-in" : ""} ${className ?? ""}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
