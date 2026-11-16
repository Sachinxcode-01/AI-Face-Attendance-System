'use client';

import React, { useState } from 'react';
import { ChevronDown, EyeOff } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Security & Anti-Proxy',
    question: 'How does SmartFace eliminate proxy attendance and buddy punching?',
    answer:
      'SmartFace uses a three-tier check: (1) Dynamic rotating QR tokens signed with a 30-second HMAC-SHA256 salt preventing screenshots from being forwarded; (2) Hardware enclave binding that restricts check-ins to one authenticated hardware ID per lecture; and (3) Passive facial liveness detection that analyzes specular skin reflection and micro-textures to reject photos, tablet screens, or silicone masks.',
  },
  {
    category: 'Privacy & Compliance',
    question: 'Are actual photos of students stored in the database?',
    answer:
      'No. Facial images are processed immediately at the edge to generate a 512-dimensional normalized numerical vector (floating point array). The original image is discarded from memory. It is mathematically impossible to reconstruct a human face from a 512-D vector, ensuring compliance with FERPA and GDPR data isolation standards.',
  },
  {
    category: 'System Reliability',
    question: 'What happens if campus Wi-Fi or internet connection drops?',
    answer:
      'Kiosks and mobile clients feature local cryptographic edge buffering. When offline, attendance events are signed locally with a tamper-proof hardware timestamp and stored in an encrypted offline queue. The moment connectivity is restored, events sync to the central database without record loss or duplicate registrations.',
  },
  {
    category: 'Performance',
    question: 'How fast is recognition on high-volume walk-through gates?',
    answer:
      'ArcFace ONNX inference completes in under 120 milliseconds on standard edge hardware (or under 40ms on GPU-accelerated kiosks). A single turnstile or gate can process 45 to 60 students per minute without bottlenecks.',
  },
  {
    category: 'Student Portal & AI',
    question: 'What is Nexa AI Copilot in the student dashboard?',
    answer:
      'Nexa AI is an attendance forecasting engine. It analyzes your semester timetable, historical attendance records, and university attendance minimum thresholds (such as 75%) to calculate your exact safe-bunk buffer, predict streak trends, and warn you weeks before any risk of exam debarment.',
  },
];

export function ArchitectureFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="relative scroll-mt-24 border-t border-white/[0.08] py-20 bg-[#050507]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Left-Aligned Section Header */}
        <div className="max-w-2xl mb-12">
            <div className="inline-flex items-center gap-2 chip-bytune mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent">Technical Architecture</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-[-0.028em] text-hi">
              Frequently Answered Questions
            </h2>
              <p className="mt-3 text-[14.5px] leading-[23.9px] text-mid">
                Cryptographic, biometric, and zero-knowledge privacy parameters implemented across SmartFace.
              </p>
            </div>

              {/* Privacy Highlight Banner */}
              <div className="card-bytune rounded-[22px] p-6 mb-8 flex flex-col sm:flex-row items-center gap-5 shadow-2xl">
                <div className="h-12 w-12 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                  <EyeOff className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-display text-base font-semibold text-hi">Zero-Knowledge Biometric Vector Storage</h4>
                    <p className="text-[13.5px] text-mid leading-[22px] mt-1">
                      Only irreversible 512-dimension vector embeddings are retained. Student images are never saved to cloud disks, adhering to FERPA, GDPR, and campus data privacy charters.
                    </p>
                </div>
                  <span className="shrink-0 chip-bytune font-mono text-[11px] font-semibold text-spotify border-spotify/30 bg-spotify/10">
                    AES-256 ENCRYPTED
                  </span>
              </div>

              {/* Accordion List */}
                <div className="space-y-3">
                  {FAQS.map((faq, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="card-surface rounded-[22px] overflow-hidden transition-all"
                      >
                        <button
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

                        {isOpen && (
                            <div className="px-5 pb-5 pt-1 text-[14.5px] leading-[23.9px] text-mid border-t border-white/[0.04]">
                              {faq.answer}
                            </div>
                )}
                          </div>
                        );
          })}
                      </div>
      </div>
              </section>
              );
}
