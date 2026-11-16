"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { Flame, RotateCcw, ScanFace, ShieldCheck, Wifi } from "lucide-react";

const CORNERS = [
  "left-0 top-0 rounded-tl-md border-l-2 border-t-2",
  "right-0 top-0 rounded-tr-md border-r-2 border-t-2",
  "bottom-0 left-0 rounded-bl-md border-b-2 border-l-2",
  "bottom-0 right-0 rounded-br-md border-b-2 border-r-2",
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
      <div className="relative rounded-lg border border-[var(--hairline)] bg-surface p-2 shadow-sm">
        <div className="overflow-hidden rounded-md border border-[var(--hairline)] bg-bg1">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1ed760]" />
              Live · Gate B
            </span>
            <span>ArcFace · ONNX</span>
          </div>

          <div className="relative aspect-[4/3.3] overflow-hidden bg-bg0">
            <img
              src="/mobile-screen.png"
              alt="SmartFace live verification interface"
              className="absolute inset-0 h-full w-full object-cover object-top opacity-75"
            />
            <div aria-hidden className="absolute inset-0 bg-black/40" />

            <div
              className={`absolute left-1/2 top-1/2 h-[56%] w-[44%] -translate-x-1/2 -translate-y-1/2 transition-colors duration-500 ${matched ? "text-[#1ed760]" : "text-accent"
                }`}
            >
              <div
                className={`absolute -top-6 left-0 flex items-center gap-1.5 rounded border px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] ${matched
                  ? "border-[#1ed760]/30 bg-[#101016] text-[#9fe0b6]"
                  : "border-white/10 bg-[#101016] text-faint"
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

            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-sm border border-white/10 bg-[#101016] px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">
              <Wifi className="h-3 w-3" />
              Edge node · 12ms
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-sm border border-[#1ed760]/25 bg-[#101016] px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#9fe0b6]">
              Liveness 0.98
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  Match confidence
                </p>
                <p
                  className={`mt-1 font-display text-3xl font-medium tabular-nums transition-colors ${matched ? "text-[#9fe0b6]" : "text-hi"
                    }`}
                >
                  {score.toFixed(1)}
                  <span className="text-lg text-faint">%</span>
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
                <Flame className="h-4 w-4 text-amber-400" />
                <span className="text-[12px] font-medium text-hi">14-day streak</span>
                <span className="font-mono text-[8.5px] uppercase tracking-wider text-faint">
                  Diamond
                </span>
              </div>
            </div>

            <div className="h-1.5 overflow-hidden rounded-sm bg-white/[0.06]">
              <div
                className={`h-full rounded-sm transition-[width] duration-200 ${matched ? "bg-[#1ed760]" : "bg-accent"
                  }`}
                style={{ width: `${score}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[var(--hairline)] pt-3">
              <div className="flex min-w-0 items-center gap-2 text-[11.5px] text-mid">
                {matched ? (
                  <>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#1ed760]" />
                    <span className="truncate">Identity verified · synced 0.2s ago</span>
                  </>
                ) : (
                  <>
                    <ScanFace className="h-4 w-4 shrink-0 animate-pulse text-accent" />
                    <span className="truncate">Matching 512-d embedding…</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={run}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] text-faint transition duration-200 hover:bg-white/5 hover:text-hi"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Replay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
