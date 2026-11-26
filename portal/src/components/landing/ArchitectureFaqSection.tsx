'use client';

import React, { useState } from 'react';
import { ChevronDown, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeading } from '@/components/ui/section-heading';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Security & Anti-Proxy',
    question: 'How does SmartFace reduce proxy attendance and buddy punching?',
    answer:
    'SmartFace combines multiple layers: (1) Dynamic QR tokens signed with HMAC-SHA256 (20-second validity plus 5-second clock-skew tolerance); (2) Single-check-in session deduplication, optional classroom geofencing (100m default), and API rate limiting (15 req/min with a 2-minute cooldown after 3 failures); and (3) ArcFace cosine face matching with client-assisted liveness checks. Dedicated IR/3D camera hardware is recommended where high-assurance presentation attack detection is required.',
  },
  {
    category: 'Privacy & Compliance',
    question: 'Are student photos stored in the database?',
    answer:
    'Live verification frames sent to /v1/face/verify and /v1/face/enroll are decoded in memory to compute L2-normalized 512-D embeddings and explicitly released (del image_bytes). However, optional administrative dataset training (data/dataset/), user profile avatars (backend/data/avatars/), and desktop intruder alerts (data/Intruders/) store images when enabled. Embeddings remain regulated biometric personal data with RBAC, self-service export, and consent deletion workflows.',
  },
  {
    category: 'System Reliability',
    question: 'What happens if campus Wi-Fi or internet connection drops?',
    answer:
    'The Flutter mobile app buffers queued check-ins locally in an AES-256 encrypted Hive vault (signed with HMAC-SHA256, up to 500 records and 7-day automatic purge) for synchronization once connectivity restores. Live server-side face verification still requires reachable API and FastAPI AI nodes unless a local on-campus cluster is deployed.',
  },
  {
    category: 'AI & Performance',
    question: 'Which biometric model and decision thresholds are used?',
    answer:
    'SmartFace uses InsightFace ArcFace (buffalo_l, ResNet-50 backbone) with RetinaFace (det_10g) detection to extract 512-dimensional float vectors. Production cosine similarity defaults to 0.60 and is configurable per deployment, backed by a 15-second AI inference timeout budget and an 18-second API gateway timeout.',
  },
  {
    category: 'Student Portal & AI',
    question: 'What is Nexa AI Copilot in the student dashboard?',
    answer:
    'Nexa AI combines deterministic server-side attendance math (integer basis-point arithmetic to avoid floating-point rounding drift) with a PII-minimized Groq LLM assistant. It calculates exact class buffers against institutional eligibility thresholds such as 75% and explains what-if scenarios without exposing unrelated student records.',
  },
];

export function ArchitectureFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Technical Architecture"
          title="Frequently Answered Questions"
          description="Implemented AI model specifications, session token controls, and data governance parameters across SmartFace."
        />

        {/* Privacy Highlight Banner */}
        <Reveal delay={0.08} direction="up">
          <div className="mt-12 card-bytune rounded-[22px] p-6 mb-8 flex flex-col sm:flex-row items-center gap-5 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
              <EyeOff className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-display text-base font-semibold text-hi">Minimized Biometric Vector & RBAC Governance</h4>
              <p className="text-[13.5px] text-mid leading-[22px] mt-1">
                Verification frames are processed in memory by default while 512-D embeddings remain protected under role-based access control, consent workflows, and self-service deletion endpoints.
              </p>
            </div>
            <span className="shrink-0 chip-bytune font-mono text-[11px] font-semibold text-spotify border-spotify/30 bg-spotify/10">
              RBAC & AUDIT LOGS
            </span>
          </div>
        </Reveal>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <Reveal key={idx} delay={idx * 0.04} direction="up" distance={14}>
                <div className="card-surface rounded-[22px] overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-[15px] font-medium text-hi hover:text-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="chip-bytune text-[10.5px] font-mono uppercase tracking-wider text-faint">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-faint shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''
                        }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-2 text-[14.5px] leading-[23.9px] text-mid border-t border-white/[0.04]">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )
                    }
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
