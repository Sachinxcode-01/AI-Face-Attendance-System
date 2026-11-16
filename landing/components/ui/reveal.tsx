"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Scroll-reveal wrapper, progressive-enhancement style:
 * - SSR / no-JS / crawlers: content is fully visible (CSS default).
 * - With JS: the `js` class arms the hidden state, and an
 *   IntersectionObserver adds `.reveal-in` when the block scrolls
 *   into view, running the ByTune ease-out rise animation.
 * - prefers-reduced-motion: transitions disabled globally in CSS.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    // Arm the animation system once per session.
    if (!document.documentElement.classList.contains("js")) {
      document.documentElement.classList.add("js");
    }

    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.05 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "reveal-in" : ""} ${className ?? ""}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
