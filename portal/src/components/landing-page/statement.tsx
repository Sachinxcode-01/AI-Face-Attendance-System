"use client";

import { motion } from "framer-motion";
import { Reveal } from "./ui/reveal";

const LINES = [
  { text: "Attendance lives in a spreadsheet.", tone: "text-mid/70" },
  { text: "Camera feeds live in another tab.", tone: "text-mid/80" },
  { text: "Security alerts live in someone's inbox.", tone: "text-mid" },
  {
    text: "On SmartFace, the whole campus lives in one place.",
    tone: "text-shimmer font-medium",
    isAccent: true,
  },
];

export function Statement() {
  return (
    <section
      id="statement"
      className="relative overflow-hidden border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]"
    >
      {/* Ambient background glow orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full opacity-15 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(143, 139, 255, 0.4) 0%, rgba(111, 216, 255, 0.2) 50%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <div className="max-w-[840px]">
          {LINES.map((line, index) => (
            <Reveal
              key={line.text}
              delay={index * 0.1}
              duration={0.7}
              direction="up"
              distance={20}
            >
              <p
                className={`text-balance font-display text-[26px] sm:text-[38px] lg:text-[46px] leading-[1.15] tracking-[-0.025em] mb-2 sm:mb-3 ${
                  line.tone
                } ${line.isAccent ? "drop-shadow-[0_0_25px_rgba(143,139,255,0.25)]" : ""}`}
              >
                {line.text}
              </p>
            </Reveal>
          ))}

          <Reveal delay={0.45} duration={0.8} distance={16}>
            <div className="mt-10 flex items-start gap-4 border-l-2 border-accent/40 pl-5">
              <p className="max-w-[600px] text-[16px] sm:text-[19px] leading-[30.4px] tracking-[-0.015em] text-low">
                One identity graph, one session token, one audit trail: from the gate to the group
                chat.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
