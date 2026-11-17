"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { Flame, RotateCcw, ScanFace, ShieldCheck, Wifi } from "lucide-react";

const CORNERS = [
  "left-0 top-0 rounded-tl-[8px] border-l-2 border-t-2",
  "right-0 top-0 rounded-tr-[8px] border-r-2 border-t-2",
  "bottom-0 left-0 rounded-bl-[8px] border-b-2 border-l-2",
  "bottom-0 right-0 rounded-br-[8px] border-b-2 border-r-2",
];

export function VerificationCard() {
  const reduceMotion = useReducedMotion();
  const [matched, setMatched] = useState(false);
  const [score, setScore] = useState(0);
  const [runId, setRunId] = useState(0);
  const counter = useRef({ value: 0 });
  const timeline = useRef<ReturnType<typeof gsap.timeline> | null>(null);

  const run = useCallback(() => {
    timeline.current?.kill();
    counter.current.value = 0;
    setScore(0);
    setMatched(false);
    setRunId((id) => id + 1);

    if (reduceMotion) {
      setMatched(true);
      setScore(99.4);
      return;
    }

    timeline.current = gsap
      .timeline()
      .to({}, { duration: 1.35 })
      .add(() => setMatched(true))
      .to(counter.current, {
        value: 99.4,
        duration: 0.9,
        ease: "power3.out",
        onUpdate: () => setScore(counter.current.value),
      });
  }, [reduceMotion]);

  useEffect(() => {
    run();
    return () => {
      timeline.current?.kill();
    };
  }, [run]);

  return (
    <div className="relative mx-auto w-full max-w-[430px]">
      {/* Outer Card using ByTune Recipe Card 2 (22px radius, blur 18px, inset highlight + deep shadow) */}
      <div className="card-bytune p-[18px]">
        {/* Inner feed container */}
        <div className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-bg1">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint bg-[rgba(16,16,22,0.6)]">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-spotify animate-pulse" />
              Live · Gate B
            </span>
            <span className="text-mid">ArcFace · ONNX</span>
          </div>

          <div className="relative aspect-[4/3.3] overflow-hidden bg-bg0">
            <img
              src="/hero-verification.jpg"
              alt="SmartFace live camera verification feed"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#101016]/80 via-transparent to-black/30 pointer-events-none" />

            <div
              className={`absolute left-1/2 top-1/2 h-[56%] w-[44%] -translate-x-1/2 -translate-y-1/2 transition-colors duration-500 ${matched ? "text-spotify" : "text-accent"
                }`}
            >
              <div
                className={`absolute -top-6 left-0 flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] backdrop-blur-sm ${matched
                  ? "border-spotify/30 bg-[#101016]/90 text-[#9fe0b6]"
                  : "border-white/10 bg-[#101016]/90 text-faint"
                  }`}
              >
                <ScanFace className="h-2.5 w-2.5" />
                {matched ? "Match 99.4%" : "Subject A-1942"}
              </div>
              {CORNERS.map((corner) => (
                <span
                  key={corner}
                  aria-hidden
                  className={`absolute h-5 w-5 border-current ${corner}`}
                />
              ))}
            </div>

            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#101016]/90 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-mid backdrop-blur-sm">
              <Wifi className="h-3 w-3 text-spotify" />
              Edge node · 12ms
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#101016]/90 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3 text-accent" />
              Liveness PASS
            </div>
          </div>

          {/* Card footer details */}
          <div className="flex items-center justify-between border-t border-[var(--hairline)] px-4 py-3 bg-[rgba(16,16,22,0.4)]">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium text-hi">
                {matched ? "Alex Rivera" : "Scanning subject..."}
              </p>
              <p className="font-mono text-[10px] text-faint">
                {matched ? "ID: STU-88219 · CS-301" : "Acquiring 512-dim embedding..."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="block font-mono text-[14px] font-medium text-spotify tabular-nums">
                  {score.toFixed(1)}%
                </span>
                <span className="block font-mono text-[8.5px] uppercase tracking-wider text-faint">
                  Confidence
                </span>
              </div>
              <button
                type="button"
                onClick={run}
                aria-label="Re-run verification animation"
                title="Re-run verification"
                className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-mid transition hover:border-white/20 hover:text-hi"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Status chip beneath inner feed */}
        <div className="mt-3 flex items-center justify-between px-1 text-[11px] font-mono text-mid">
          <span className={`flex items-center gap-1.5 ${matched ? "text-spotify" : "text-mid"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${matched ? "bg-spotify" : "bg-accent animate-pulse"}`} />
            {matched ? "Verified in 192ms" : "Matching in progress..."}
          </span>
          <span className="text-faint">ArcFace Embedding · 512-dim</span>
        </div>
      </div>
    </div>
  );
}
