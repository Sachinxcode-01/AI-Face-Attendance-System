'use client';

import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, Lock, Sparkles, Database, EyeOff, Cpu } from 'lucide-react';

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
      'SmartFace employs a three-tier defense matrix: (1) Dynamic rotating QR tokens signed with a 30-second HMAC-SHA256 salt preventing screenshots from being forwarded; (2) Hardware enclave binding that restricts check-ins to one authenticated hardware ID per lecture; and (3) Passive facial liveness detection that analyzes specular skin reflection and micro-textures to reject photos, tablet screens, or silicone masks.',
  },
  {
    category: 'Privacy & Compliance',
    question: 'Are actual photos of students stored in the database?',
    answer:
      'No. In strict compliance with privacy standards, SmartFace operates on a zero-raw-image architecture. Facial images are processed immediately at the edge to generate a 512-dimensional normalized numerical vector (floating point array). The original image is discarded from memory. It is mathematically impossible to reconstruct a human face from a 512-D vector.',
  },
  {
    category: 'System Reliability',
    question: 'What happens if campus Wi-Fi or internet connection drops?',
    answer:
      'Kiosks and mobile clients feature local cryptographic edge buffering. When offline, attendance events are signed locally with a tamper-proof hardware timestamp and stored in an encrypted offline queue. The moment connectivity is restored, events sync seamlessly to the central database without record loss or duplicate registrations.',
  },
  {
    category: 'Performance',
    question: 'How fast is recognition on high-volume walk-through gates?',
    answer:
      'ArcFace ONNX inference completes in under 120 milliseconds on standard edge hardware (or under 40ms on GPU-accelerated kiosks). A single turnstile or gate can process 45 to 60 students per minute without bottlenecks or pauses.',
  },
  {
    category: 'Student Portal & AI',
    question: 'What is Nexa AI Copilot in the student dashboard?',
    answer:
      'Nexa AI is an intelligent predictive attendance engine. It analyzes your semester timetable, historical attendance records, and university attendance minimum thresholds (e.g. 75%) to calculate your exact "Safe-Bunk Buffer", predict streak trends, and warn you weeks before any risk of exam debarment.',
  },
];

export function ArchitectureFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="relative scroll-mt-24 border-t border-white/[0.08] py-20 sm:py-28 bg-[#050507]">
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs font-semibold text-[#8F8BFF] mb-4">
            <Lock className="h-3.5 w-3.5 text-[#8F8BFF]" />
            <span>ARCHITECTURE & FAQ</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#F5F5F8]">
            Frequently Answered Questions
          </h2>

          <p className="mt-3 text-sm text-[#B6B6C2]">
            Detailed insights into the cryptographic, biometric, and privacy foundations powering SmartFace.
          </p>
        </div>

        {/* Privacy Highlight Banner */}
        <div className="bytune-glass-card p-6 mb-10 flex flex-col sm:flex-row items-center gap-5 border-[#8F8BFF]/20">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#8F8BFF]/10 text-[#8F8BFF] border border-[#8F8BFF]/30">
            <EyeOff className="h-6 w-6" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="font-display text-sm font-bold text-white">Zero-Knowledge Biometric Vector Storage</h4>
            <p className="text-xs text-[#B6B6C2] mt-0.5">
              Only irreversible 512-dimension vector embeddings are retained. Student images are never saved to cloud disks, adhering to FERPA, GDPR, and campus data privacy charters.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
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
                className="rounded-2xl border border-white/[0.08] bg-[#101016] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-[#F5F5F8] hover:text-[#8F8BFF] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A8A97] bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                      {faq.category}
                    </span>
                    <span>{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[#8A8A97] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#8F8BFF]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#B6B6C2] leading-relaxed border-t border-white/[0.04]">
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
