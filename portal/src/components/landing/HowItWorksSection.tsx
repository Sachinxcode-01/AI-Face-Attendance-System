'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';

interface StepDetail {
  number: string;
  title: string;
  roleBadge: string;
  description: string;
  specs: { label: string; value: string }[];
  codeLog: string;
}

const STEPS: StepDetail[] = [
  {
    number: '01',
    title: 'Session start & HMAC-SHA256 QR generation',
    roleBadge: 'TEACHER PORTAL',
    description:
    'Faculty opens a scheduled session from the teacher dashboard. The backend issues an HMAC-SHA256 signed QR payload with a 20-second validity window (plus 5-second clock-skew tolerance) and optional classroom geofencing.',
    specs: [
      { label: 'Token validity window', value: '20s (+5s clock skew)' },
      { label: 'Signing algorithm', value: 'HMAC-SHA256 (timingSafeEqual)' },
      { label: 'Geofence boundary', value: 'Optional (100m default)' },
      { label: 'Access control', value: 'Authenticated faculty session' },
    ],
    codeLog: '[SAMPLE] SESSION_ID: "cs401-20261116-0900"\nHMAC_SIG: "e3b0c44298fc1c149afbf4c8"\nWINDOW: 20s (+5s tolerance)\nSTATUS: Active session',
  },
  {
    number: '02',
    title: 'ArcFace 512-dimension vector matching',
    roleBadge: 'FASTAPI AI SERVICE',
    description:
    'A verification frame is decoded in volatile memory, aligned via RetinaFace (det_10g), and encoded by InsightFace ArcFace (buffalo_l, ResNet-50) into an L2-normalized 512-float embedding for cosine similarity matching (0.60 default threshold).',
    specs: [
      { label: 'AI timeout budget', value: '15s inference / 18s gateway' },
      { label: 'Vector dimensions', value: '512 floats (L2-normalized)' },
      { label: 'Liveness support', value: 'Client-assisted (IR optional)' },
      { label: 'Decision cutoff', value: '0.60 default Cosine (config.)' },
    ],
    codeLog: '[SAMPLE] MODEL: "InsightFace buffalo_l (R50)"\nCOSINE_SIMILARITY: 0.874\nDECISION: Match confirmed (Threshold >= 0.60)\nFRAME_MEMORY: Released after extraction',
  },
  {
    number: '03',
    title: 'Replay guards, rate limits & cooldowns',
    roleBadge: 'SECURITY SENTINEL',
    description:
    'To narrow proxy sharing and brute-force attempts, the backend enforces single-use session attendance records, timing-safe QR verification, strict API rate limits (15/min on face verification), and a 2-minute cooldown after 3 failures.',
    specs: [
      { label: 'Failure backoff', value: '2 min lock after 3 failures' },
      { label: 'Replay prevention', value: 'Duplicate check-in & token guards' },
      { label: 'AI rate limit', value: '15 req/min (concurrency 2)' },
      { label: 'Session check-in', value: '1 verified record per session' },
    ],
    codeLog: '[SAMPLE] QR_VERIFICATION: "timingSafeEqual PASS"\nRBAC_SCOPE: "Student role verified"\nATTEMPT_COUNT_THIS_SESSION: 1\nDUPLICATE_FILTER: Clear',
  },
  {
    number: '04',
    title: 'Ledger commit & automated guardian alerts',
    roleBadge: 'MONGODB & NOTIFICATIONS',
    description:
    'Verified check-ins commit to MongoDB (with optional PostgreSQL/pgvector analytics sync or AES-256 encrypted Hive mobile buffering when offline). Faculty rosters refresh and configured guardian notifications dispatch via Email, SMS, or push.',
    specs: [
      { label: 'Primary persistence', value: 'MongoDB (+ optional pgvector)' },
      { label: 'Guardian delivery channel', value: 'Email, SMS & push (config.)' },
      { label: 'Offline mobile buffer', value: 'AES-256 Hive (500 records max)' },
      { label: 'Deterministic tallies', value: 'Integer basis-point math' },
    ],
    codeLog: '[SAMPLE] COMMIT_TIMESTAMP: "09:02:14 UTC+5:30"\nGATE_LOCATION: "Sample Classroom Gate"\nNOTIFY_LOG: "Arrival update queued"\nCALC_MODE: "Deterministic percentage"',
  },
];

export function HowItWorksSection() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = STEPS[activeStepIndex];

  return (
    <section id="how-it-works" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32">
      <div className="mx-auto max-w-[var(--wide)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Verification Pipeline"
          title="How SmartFace Works"
          description="Faculty opens a session, InsightFace ArcFace (buffalo_l) matches against the configured cosine threshold, and guardian alerts plus rosters update automatically."
        />

        {/* Structured Editorial 4-Step Layout */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Numbered Step List */}
          <div className="lg:col-span-5 space-y-3">
            {STEPS.map((step, idx) => {
              const isSelected = activeStepIndex === idx;
              return (
                <Reveal key={step.number} delay={idx * 0.05} direction="up" distance={16}>
                  <button
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    className={`w-full text-left cursor-pointer rounded-[18px] p-4 sm:p-5 transition-all border ${isSelected
                      ? 'card-bytune border-accent/40 shadow-lg shadow-accent/10'
                      : 'card-surface border-white/[0.06] hover:border-white/15'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-accent font-semibold">
                        Step {step.number}
                      </span>
                      <span className="chip-bytune font-mono text-[10px] text-faint">
                        {step.roleBadge}
                      </span>
                    </div>
                    <h3 className="font-display text-[15px] font-medium text-hi">
                      {step.title}
                    </h3>
                  </button>
                </Reveal>
              );
            })}
          </div>

          {/* Right Column: Active Phase Specs & Telemetry Log */}
          <Reveal delay={0.12} direction="up" className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="card-bytune rounded-[22px] p-6 sm:p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
                  <div>
                    <span className="text-xs font-mono text-accent">Phase {activeStep.number}</span>
                    <h3 className="font-display text-lg font-medium text-hi mt-0.5">
                      {activeStep.title}
                    </h3>
                  </div>
                  <span className="chip-bytune font-mono text-[10.5px] text-mid">
                    {activeStep.roleBadge}
                  </span>
                </div>

                <p className="text-[14.5px] leading-[23.9px] text-mid mb-6">
                  {activeStep.description}
                </p>

                {/* Technical Specifications Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {activeStep.specs.map((item, i) => (
                    <div key={i} className="rounded-[14px] bg-[#050507] border border-white/[0.06] p-3.5">
                      <span className="text-[11px] text-faint block">{item.label}</span>
                      <span className="text-xs font-mono font-semibold text-hi mt-0.5 block">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Clean Code/Telemetry Log */}
                <div className="rounded-[16px] bg-[#050507] border border-white/[0.08] p-4 font-mono text-[11.5px] text-accent2 leading-relaxed whitespace-pre overflow-x-auto">
                  {activeStep.codeLog}
                </div>
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
