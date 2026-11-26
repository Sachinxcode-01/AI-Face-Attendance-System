"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, RefreshCw, ScanFace, ShieldCheck, Wifi } from "lucide-react";

const CORNERS = [
  "left-0 top-0 rounded-tl-[10px] border-l-2 border-t-2",
  "right-0 top-0 rounded-tr-[10px] border-r-2 border-t-2",
  "bottom-0 left-0 rounded-bl-[10px] border-b-2 border-l-2",
  "bottom-0 right-0 rounded-br-[10px] border-b-2 border-r-2",
];

// Illustrative facial alignment anchor points
const LANDMARKS = [
  { x: "38%", y: "42%", label: "L_EYE" },
  { x: "62%", y: "42%", label: "R_EYE" },
  { x: "50%", y: "54%", label: "NOSE" },
  { x: "42%", y: "68%", label: "MOUTH_L" },
  { x: "58%", y: "68%", label: "MOUTH_R" },
  { x: "50%", y: "73%", label: "CHIN" },
  { x: "32%", y: "56%", label: "CHEEK_L" },
  { x: "68%", y: "56%", label: "CHEEK_R" },
  { x: "50%", y: "32%", label: "GLABELLA" },
];

export function VerificationCard() {
  const reduceMotion = useReducedMotion();
  const [matched, setMatched] = useState(false);
  const [score, setScore] = useState(0);
  const [scanning, setScanning] = useState(true);
  const counter = useRef({ value: 0 });
  const timeline = useRef<ReturnType<typeof gsap.timeline> | null>(null);

  const runVerification = useCallback(() => {
    timeline.current?.kill();
    counter.current.value = 0;
    setScore(0);
    setMatched(false);
    setScanning(true);

    if (reduceMotion) {
      setMatched(true);
      setScore(0.86);
      setScanning(false);
      return;
    }

    timeline.current = gsap
      .timeline()
      .to({}, { duration: 1.4 })
      .add(() => {
        setMatched(true);
        setScanning(false);
      })
      .to(counter.current, {
        value: 0.86,
        duration: 0.8,
        ease: "power3.out",
        onUpdate: () => setScore(Number(counter.current.value.toFixed(2))),
      });
  }, [reduceMotion]);

  useEffect(() => {
    runVerification();
    return () => {
      timeline.current?.kill();
    };
  }, [runVerification]);

  return (
    <div className="relative mx-auto w-full max-w-[430px]">
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.25 } }}
        className="card-bytune relative p-4 sm:p-[18px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        <div className="relative overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-bg1">
          {/* Status Bar */}
          <div className="flex items-center justify-between border-b border-[var(--hairline)] px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint bg-[rgba(16,16,22,0.7)] backdrop-blur-md">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
              </span>
              <span className="text-hi font-medium">Demo Kiosk · Sample Feed</span>
            </span>
            <span className="chip-bytune h-5 text-[9px] px-2 text-accent border-accent/20 bg-accent/5">
              ArcFace buffalo_l
            </span>
          </div>

          {/* Camera Feed with HUD Overlay */}
          <div className="relative aspect-[4/3] overflow-hidden bg-bg0">
            <img
              src="/hero-verification.jpg"
              alt="Simulated SmartFace kiosk verification preview showing sample bounding reticle"
              className="absolute inset-0 h-full w-full object-cover object-center filter brightness-[0.92] contrast-[1.05]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#101016]/90 via-transparent to-black/40 pointer-events-none"
            />
            <div className="absolute inset-0 bg-grid opacity-25 pointer-events-none" />

            {scanning && !reduceMotion && (
              <div
                className="absolute inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#6fd8ff] to-transparent shadow-[0_0_15px_4px_rgba(111,216,255,0.7)] pointer-events-none animate-laser-scan z-20"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 font-mono text-[8px] text-[#6fd8ff] tracking-wider uppercase border border-[#6fd8ff]/40">
                  SIMULATED SCAN
                </div>
              </div>
            )}

            {/* Target Reticle Frame */}
            <div
              className={`absolute left-1/2 top-1/2 h-[60%] w-[48%] -translate-x-1/2 -translate-y-1/2 transition-all duration-500 z-10 ${matched ? "text-spotify" : "text-accent"
                }`}
            >
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={`absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] backdrop-blur-md shadow-lg transition-all duration-300 ${matched
                    ? "border-spotify/40 bg-[#101016]/95 text-[#9fe0b6]"
                    : "border-accent/40 bg-[#101016]/95 text-accent"
                  }`}
              >
                <ScanFace className="h-2.5 w-2.5 animate-pulse" />
                <span>{matched ? "DEMO MATCH" : "EXTRACTING 512-D"}</span>
              </div>

              {CORNERS.map((corner) => (
                <span
                  key={corner}
                  aria-hidden
                  className={`absolute h-6 w-6 border-current transition-colors duration-500 ${corner} ${matched ? "shadow-[0_0_10px_rgba(30,215,96,0.5)]" : "shadow-[0_0_10px_rgba(143,139,255,0.4)]"
                    }`}
                />
              ))}

              <div className="absolute inset-0 pointer-events-none">
                {LANDMARKS.map((lm, idx) => (
                  <motion.div
                    key={lm.label}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: matched ? 1 : [0.8, 1.2, 0.8],
                      opacity: matched ? 0.9 : 0.6,
                    }}
                    transition={{
                      duration: 1.6,
                      repeat: matched ? 0 : Infinity,
                      delay: idx * 0.08,
                    }}
                    style={{ left: lm.x, top: lm.y }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <span
                      className={`block h-1.5 w-1.5 rounded-full ${matched ? "bg-spotify shadow-[0_0_6px_#1ed760]" : "bg-accent shadow-[0_0_6px_#8f8bff]"
                        }`}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom Feed Overlay Badges */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20">
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#101016]/90 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-mid backdrop-blur-md">
                <Wifi className="h-3 w-3 text-spotify" />
                ONNX Runtime
              </span>
            </div>

            <div className="absolute bottom-3 right-3 z-20">
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#101016]/90 px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#9fe0b6] backdrop-blur-md">
                <ShieldCheck className="h-3 w-3 text-spotify" />
                1-Face Guard
              </span>
            </div>
          </div>

          {/* Telemetry Footer */}
          <div className="border-t border-[var(--hairline)] bg-[rgba(16,16,22,0.85)] p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  Illustrative Demo Profile
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="font-display text-[15px] font-semibold text-hi">
                    Alex Rivera (Sample)
                  </h4>
                  <span className="font-mono text-[11px] text-mid">· CS-301</span>
                </div>
              </div>

              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  Sample Cosine
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="font-display text-lg font-semibold tabular-nums text-spotify">
                    {score.toFixed(2)}
                  </span>
                  <CheckCircle2
                    className={`h-4 w-4 text-spotify transition-transform duration-300 ${matched ? "scale-100 opacity-100" : "scale-50 opacity-0"
                      }`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3">
              <span className="font-mono text-[10.5px] text-mid flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-spotify" />
                Threshold: ≥0.60 · Vector: 512-D
              </span>
              <button
                type="button"
                onClick={runVerification}
                className="chip-bytune h-7 text-[10.5px] px-3 gap-1.5 text-mid hover:text-hi hover:border-white/20 transition-all active:scale-95"
                title="Replay simulated verification"
              >
                <RefreshCw className={`h-3 w-3 ${scanning ? "animate-spin text-accent" : ""}`} />
                <span>Replay Demo</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
