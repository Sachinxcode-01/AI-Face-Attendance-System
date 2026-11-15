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
      <div
        aria-hidden
        className={`absolute -inset-8 rounded-[40px] blur-2xl transition-colors duration-700 ${
          matched ? "bg-success/10" : "bg-brand-600/20"
        }`}
      />

      <div className="relative rounded-[26px] border border-white/10 bg-white/[0.045] p-2 shadow-[0_50px_90px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#080C18]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_#10B981]" />
              Live · Gate B
            </span>
            <span>ArcFace · ONNX</span>
          </div>

          <div className="relative aspect-[4/3.3] overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-grid opacity-40" />
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/25 blur-3xl"
            />

            <div aria-hidden className="absolute left-1/2 top-[46%] h-40 w-32 -translate-x-1/2 -translate-y-1/2 sm:h-44 sm:w-36">
              <div className="absolute left-1/2 top-0 h-24 w-20 -translate-x-1/2 rounded-[45%] bg-gradient-to-b from-slate-400/40 to-slate-600/20 ring-1 ring-white/10" />
              <div className="absolute bottom-0 left-1/2 h-20 w-32 -translate-x-1/2 rounded-t-[3rem] bg-gradient-to-b from-slate-500/30 to-slate-700/10" />
            </div>

            <div
              className={`absolute left-1/2 top-1/2 h-[56%] w-[44%] -translate-x-1/2 -translate-y-1/2 transition-colors duration-500 ${
                matched ? "text-success" : "text-brand-400"
              }`}
            >
              <div
                className={`absolute -top-6 left-0 flex items-center gap-1.5 rounded border px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] backdrop-blur ${
                  matched
                    ? "border-success/30 bg-success/10 text-emerald-300"
                    : "border-white/10 bg-black/50 text-ink-faint"
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

            {matched ? null : (
              <div
                key={runId}
                aria-hidden
                className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-success/20 to-transparent"
              />
            )}

            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md border border-white/10 bg-black/40 px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink-faint backdrop-blur">
              <Wifi className="h-3 w-3" />
              Edge node · 12ms
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md border border-success/25 bg-success/10 px-2 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-emerald-300 backdrop-blur">
              Liveness 0.98
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">
                  Match confidence
                </p>
                <p
                  className={`mt-1 font-display text-3xl font-semibold tabular-nums transition-colors ${
                    matched ? "text-success" : "text-ink"
                  }`}
                >
                  {score.toFixed(1)}
                  <span className="text-lg text-ink-faint">%</span>
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
                <Flame className="h-4 w-4 text-amber-400" />
                <span className="text-[12px] font-medium text-ink">14-day streak</span>
                <span className="font-mono text-[8.5px] uppercase tracking-wider text-ink-faint">
                  Diamond
                </span>
              </div>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ${
                  matched
                    ? "bg-gradient-to-r from-success/50 to-success"
                    : "bg-brand-500/60"
                }`}
                style={{ width: `${score}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
              <div className="flex min-w-0 items-center gap-2 text-[11.5px] text-ink-muted">
                {matched ? (
                  <>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
                    <span className="truncate">Identity verified · synced 0.2s ago</span>
                  </>
                ) : (
                  <>
                    <ScanFace className="h-4 w-4 shrink-0 animate-pulse text-brand-300" />
                    <span className="truncate">Matching 512-d embedding…</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={run}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] text-ink-faint transition hover:bg-white/5 hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Replay
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-5 top-1/3 hidden animate-float items-center gap-2 rounded-xl border border-white/10 bg-surface/90 px-3 py-2 shadow-xl shadow-black/50 backdrop-blur lg:flex">
        <ShieldCheck className="h-4 w-4 text-success" />
        <span className="text-[11px] font-medium text-ink">Proxy blocked</span>
        <span className="font-mono text-[9px] text-ink-faint">QR expired</span>
      </div>
    </div>
  );
}
