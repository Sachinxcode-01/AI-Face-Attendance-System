'use client';

import React, { useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

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
    title: 'Session start & cryptographic salt generation',
    roleBadge: 'TEACHER PORTAL',
    description:
      'Faculty selects a scheduled lecture slot on their dashboard. The server generates an HMAC-SHA256 session token with a 30-second rotating salt, locked to the classroom GPS coordinates within a 45-meter radius.',
    specs: [
      { label: 'Token drift window', value: '30 seconds' },
      { label: 'Signing algorithm', value: 'HMAC-SHA256' },
      { label: 'Geofence boundary', value: '45m classroom perimeter' },
      { label: 'Access control', value: 'Teacher session host key' },
    ],
    codeLog: 'SESSION_ID: "cs401-20261116-0900"\nROTATING_SALT: "e3b0c44298fc1c149afbf4c8"\nEXPIRY: 00:28s remaining\nSTATUS: Active broadcast',
  },
  {
    number: '02',
    title: 'ArcFace 512-dimension vector inference',
    roleBadge: 'EDGE KIOSK / MOBILE',
    description:
      'The student presents their face to the kiosk camera or mobile scanner. ArcFace localizes 106 facial fiducials and generates a 512-float embedding in under 120ms. Simultaneously, passive liveness analyzes skin micro-textures to reject photos, tablet screens, or silicone masks.',
    specs: [
      { label: 'Inference latency', value: '<120ms' },
      { label: 'Vector dimensions', value: '512 floats' },
      { label: 'Liveness method', value: 'Specular skin reflectance' },
      { label: 'Decision cutoff', value: '0.82 Cosine similarity' },
    ],
    codeLog: 'POINTS_DETECTED: 106 landmarks\nCOSINE_SIMILARITY: 0.964\nDECISION: Match confirmed (Threshold >= 0.82)\nANTI_SPOOF: Passed (No screen glare)',
  },
  {
    number: '03',
    title: 'Single-device enclave check',
    roleBadge: 'SECURITY SENTINEL',
    description:
      'To prevent screenshot forwarding, the system verifies hardware UUID signatures and network BSSID data. Each hardware token is bound to one student record per lecture, eliminating duplicate punches and proxy check-ins.',
    specs: [
      { label: 'Device binding', value: '1 hardware token per student' },
      { label: 'Replay prevention', value: 'One-time token consumption' },
      { label: 'Network verification', value: 'Campus Wi-Fi BSSID match' },
      { label: 'Proxy rejection rate', value: '100% on forwarded QR' },
    ],
    codeLog: 'DEVICE_UUID: "dev-89a1-43ef-992a"\nHARDWARE_ATTESTATION: Verified\nATTEMPT_COUNT_THIS_SESSION: 1\nDOUBLE_PUNCH_FILTER: Clear',
  },
  {
    number: '04',
    title: 'Ledger commit & automated parent alerts',
    roleBadge: 'SYNCHRONOUS DISPATCH',
    description:
      'The attendance record is written to the central database in under 24ms. Student streaks update immediately, the teacher live roster reflects the check-in, and parents receive an SMS and push notification containing the gate name, timestamp, and verification score.',
    specs: [
      { label: 'Database write latency', value: '<24ms' },
      { label: 'Parent delivery channel', value: 'SMS & mobile push' },
      { label: 'Student streak update', value: '+1 day Golden Blaze' },
      { label: 'Faculty roster sync', value: 'Instant WebSocket update' },
    ],
    codeLog: 'COMMIT_TIMESTAMP: "09:02:14 UTC+5:30"\nGATE_LOCATION: "Main Campus Gate A"\nPARENT_SMS: "Alice Smith marked present in CS-401 at 09:02 AM"\nSTREAK: 14 days active',
  },
];

export function HowItWorksSection() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = STEPS[activeStepIndex];

  return (
    <section id="how-it-works" className="relative scroll-mt-24 border-t border-white/[0.08] py-20 bg-[#050507]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Left-Aligned Section Header - No pill badges */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono uppercase tracking-wider text-[#8F8BFF] mb-2">
            Verification Pipeline
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#F5F5F8]">
            How SmartFace Works
          </h2>
          <p className="mt-3 text-sm text-[#B6B6C2] leading-relaxed">
            Faculty opens a session, the ArcFace engine verifies each student in under 120ms, and parents receive arrival timestamps directly on their phones.
          </p>
        </div>

        {/* Structured Editorial 4-Step Layout (Replaced the 4 icon-card grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Numbered Step List */}
          <div className="lg:col-span-5 space-y-3">
            {STEPS.map((step, idx) => {
              const isSelected = activeStepIndex === idx;
              return (
                <div
                  key={step.number}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`cursor-pointer rounded-xl p-4 transition-colors border ${
                    isSelected
                      ? 'bg-[#0D0F17] border-white/20'
                      : 'bg-[#090A10] border-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-[#8F8BFF] font-semibold">
                      Step {step.number}
                    </span>
                    <span className="font-mono text-[10px] text-[#8A8A97] px-2 py-0.5 rounded bg-white/[0.04]">
                      {step.roleBadge}
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-semibold text-[#F5F5F8]">
                    {step.title}
                  </h3>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Phase Specs & Telemetry Log */}
          <div className="lg:col-span-7 portal-card p-6 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
              <div>
                <span className="text-xs font-mono text-[#8F8BFF]">Phase {activeStep.number}</span>
                <h3 className="font-display text-lg font-semibold text-[#F5F5F8] mt-0.5">
                  {activeStep.title}
                </h3>
              </div>
              <span className="rounded bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[11px] font-mono text-[#B6B6C2]">
                {activeStep.roleBadge}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#B6B6C2] leading-relaxed mb-6">
              {activeStep.description}
            </p>

            {/* Technical Specifications Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {activeStep.specs.map((item, i) => (
                <div key={i} className="rounded-lg bg-[#050507] border border-white/[0.06] p-3">
                  <span className="text-[11px] text-[#8A8A97] block">{item.label}</span>
                  <span className="text-xs font-mono font-semibold text-[#F5F5F8] mt-0.5 block">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Clean Code/Telemetry Log (No traffic light dots) */}
            <div className="rounded-lg bg-[#050507] border border-white/[0.08] p-4 font-mono text-[11.5px] text-[#6FD8FF] leading-relaxed whitespace-pre overflow-x-auto">
              {activeStep.codeLog}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
