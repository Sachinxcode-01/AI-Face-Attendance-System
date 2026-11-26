"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import { DEMO_MAILTO } from "@/lib/constants";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const FAQS = [
  {
    question: "How does facial recognition work in SmartFace?",
    answer:
    "SmartFace uses InsightFace ArcFace (buffalo_l, ResNet-50 backbone) via ONNX Runtime with RetinaFace face detection. It checks that a single face is present, extracts an L2-normalized 512-dimensional float vector, and compares it via cosine similarity against the user's enrolled BiometricProfile (default threshold 0.60, configurable per policy).",
  },
  {
    question: "Are student photographs stored on disk or in the database?",
    answer:
    "During live API verification (/v1/face/verify) and API self-enrollment (/v1/face/enroll), uploaded image buffers are processed in memory and cleared after vector extraction, storing only the 512-D embedding in MongoDB. However, legacy batch dataset training (data/dataset/) and local OpenCV intruder monitoring (data/Intruders/) save image files when an institution enables those local workflows, and profile avatars are stored when uploaded.",
  },
  {
    question: "How does biometric consent work?",
    answer:
    "POST /auth/register-biometric records explicit consent (consent_given and consent_timestamp) in both User and BiometricProfile. Institutions are responsible for obtaining informed notice—and parent/guardian co-consent for minors—before enrolling students.",
  },
  {
    question: "Can students use non-biometric attendance methods?",
    answer:
    "Yes. Students who opt out of facial recognition or experience camera issues can check in using the teacher's 20-second rotating HMAC-SHA256 QR code or be marked by faculty/admin manual roster entry.",
  },
  {
    question: "What happens when facial recognition fails?",
    answer:
    "Failed attempts (no face, multiple faces, low cosine similarity) return HTTP 422 and are logged in AccuracyMonitoringService with optional failure reasons (lighting, occlusion). After 3 failed attempts, a 2-minute cooldown applies; students can retry with better lighting, scan the rotating QR code, or submit a correction request.",
  },
  {
    question: "How do students correct inaccurate attendance records?",
    answer:
    "Students or linked parents can submit an attendance correction dispute (POST /attendance/disputes) specifying the session, reason category (e.g., facial_recognition_failure or qr_scanning_failure), and optional evidence. Faculty or admins resolve disputes with an audit trail.",
  },
  {
    question: "How does QR verification work?",
    answer:
      "When a teacher starts a session, the server assigns a 64-hex random session secret and issues tokens signed with HMAC-SHA256 over sessionId and timestamp. Tokens expire after 20 seconds (+5s clock-skew tolerance), use timing-safe validation, enforce one check-in per student per session, and check Haversine geofence distance when coordinates are set.",
  },
  {
    question: "Does the platform work offline?",
    answer:
      "Partially, by design: the Flutter mobile app buffers offline QR check-in payloads in an AES-256 encrypted Hive queue (up to 500 records) and syncs automatically when connectivity returns. Live server-side ArcFace verification and real-time QR token validation require connectivity to the API/AI servers unless hosted locally on the campus LAN.",
  },
  {
    question: "Which hardware and platforms are supported?",
    answer:
      "SmartFace supports modern desktop/mobile browsers (Next.js portal), Android and iOS (Flutter app), and Python/OpenCV local kiosks. Cameras include standard USB webcams, laptop/phone cameras, and RTSP IP cameras. AI inference runs on CPU or NVIDIA CUDA GPUs; optional IR/depth hardware is not built into the core software release.",
  },
  {
    question: "Can existing campus ERP or LMS systems integrate?",
    answer:
      "Yes for CSV/REST workflows: OneRoster 1.2 CSV validation and CSV/Excel/JSON/HTML exports are operational today, and Google Sheets sync is available when configured. External Canvas, Moodle, and Blackboard connectors currently ship as beta integration scaffolds requiring custom credentials and testing per institution.",
  },
  {
    question: "How do institutions onboard?",
    answer:
      "Onboarding follows 11 stages: consultation, camera/network assessment, deployment choice (self-hosted MIT, managed cloud, or hybrid LAN), tenant setup, CSV/OneRoster user import, consent & enrolment, faculty training, controlled single-department pilot, accuracy review, phased rollout, and ongoing monitoring.",
  },
  {
    question: "How do parents access student records?",
    answer:
      "Parents sign in to the Parent Portal (/parent) after their account is linked to their ward via student confirmation or administrator approval. They can view attendance percentages, recent logs, leave status, and submit absence notices.",
  },
  {
    question: "How are attendance percentages calculated?",
    answer:
      "Percentages use exact integer basis-point arithmetic in attendanceCalculator.js. Conducted sessions exclude cancelled or pending records; present, verified_face, verified_qr, and configurable late/excused statuses count toward attended sessions, against an institutional target (default 75%).",
  },
  {
    question: "Does Nexa AI use actual student records and protect PII?",
    answer:
      "Yes. Authenticated Nexa AI requests pull deterministic attendance totals from MongoDB, strip direct PII (email, phone, student IDs) from the external Groq LLM prompt, and instruct the model to report only the verified bracketed numbers. Conversations can be deleted via DELETE /ai/conversations/:id.",
  },
  {
    question: "How is student information protected?",
    answer:
      "Controls include bcrypt password hashing (cost 12), 15-minute JWTs with httpOnly refresh cookies, 5-role RBAC, rate limiting (5/15m auth, 60/min API, 15/min AI verify), NoSQL input sanitization, Helmet HTTP headers, TLS in transit, and audit logging. Formal third-party certifications (ISO 27001 / SOC 2) are not claimed.",
  },
  {
    question: "How does pricing work?",
    answer:
      "The source repository is MIT-licensed and free to self-host on your own infrastructure. Commercial plans (Starter ₹12, Professional ₹24 per student/month billed annually, and custom University contracts) cover managed hosting, onboarding, and support, excluding GST, hardware, installation, and pass-through SMS carrier fees.",
  },
  {
    question: "What does the pilot programme include?",
    answer:
      "A 30-day controlled pilot covers single-department or gate setup on managed cloud or campus LAN, roster import, consent & enrolment testing, faculty training, and accuracy/lighting validation before full campus commitment.",
  },
  {
    question: "How do institutions and users export their data?",
    answer:
      "Admins and faculty can export student, class, and department attendance in CSV, Excel, JSON, or HTML formats anytime. Individual users can also call GET /auth/privacy/export to download their profile, biometric metadata (excluding raw embeddings), leaves, and disputes.",
  },
  {
    question: "How are biometric profiles deleted?",
    answer:
      "Users can withdraw biometric consent and immediately delete their stored 512-D template via DELETE /auth/biometric, which removes the BiometricProfile document, resets biometric_registered to false, and logs the erasure event to AttendanceAuditLog. Full account deletion requests can also be logged via /auth/privacy/delete-request.",
  },
  {
    question: "What product limitations exist?",
    answer:
      "Software-only RGB verification is sensitive to severe backlighting or heavy face occlusion and is not ISO/IEC 30107-3 PAD certified; QR tokens deter screenshot sharing but require physical supervision or geofencing to prevent on-site collusion; and third-party LMS/WhatsApp connectors require pilot integration.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-16 sm:py-24 lg:py-[140px]"
    >
      <div className="mx-auto grid w-full max-w-[var(--container)] gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="Campus &amp; Technical FAQ"
            title="Plain answers before you pilot or self-host."
            description="Biometric data lifecycle, consent, offline behavior, hardware requirements, pricing, and known limitations—verified against the codebase."
          />
          <Reveal delay={0.15}>
            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              href={DEMO_MAILTO}
              className="mt-8 btn-pill-glass group"
            >
              <span>Ask a technical question</span>
              <ArrowUpRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.a>
          </Reveal>
        </div>

        <div className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
                <Reveal key={faq.question} delay={Math.min(index * 0.02, 0.25)} direction="up" distance={16}>
                  <div>
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        aria-expanded={isOpen}
                        className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors hover:text-white group"
                      >
                      <span className={`text-[16px] sm:text-[17px] font-medium leading-snug transition-colors ${
                        isOpen ? "text-white" : "text-hi group-hover:text-white"
                      }`}>
                        {faq.question}
                      </span>
                      <motion.span
                        animate={{
                          backgroundColor: isOpen ? "rgba(143,139,255,0.15)" : "rgba(255,255,255,0.03)",
                          borderColor: isOpen ? "rgba(143,139,255,0.35)" : "rgba(255,255,255,0.1)",
                        }}
                        className="grid h-7 w-7 place-items-center rounded-full border shrink-0 mt-0.5 transition-colors"
                      >
                        <Plus
                          aria-hidden
                          className={`h-4 w-4 transition-transform duration-300 ${
                            isOpen ? "rotate-45 text-accent" : "text-faint group-hover:text-hi"
                          }`}
                        />
                      </motion.span>
                    </button>
                    </h3>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                            <p className="pb-6 pr-8 text-[14.5px] leading-[23.9px] text-mid">
                              {faq.answer}
                            </p>
                        </motion.div>
                      ) : null}
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
