import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { COMPANY_CONTACT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
  "Verified SmartFace data lifecycle for camera frames, enrollment images, 512-D embeddings, security snapshots, attendance records, audit logs, and AI conversations.",
};

const SECTIONS = [
  {
    heading: "1. Biometric & Operational Data Lifecycle",
    body: [
      "Live Camera Frames (API Verification): When a user verifies via /attendance/mark/face, the Express gateway holds the upload in memory (≤ 5 MB) and forwards it to the FastAPI AI service (/v1/face/verify). FastAPI decodes the image in memory and clears image_bytes in a finally block without persisting raw verification frames to disk.",
      "Enrolment Photographs & Face Embeddings: Self-service API enrollment (/auth/register-biometric -> /v1/face/enroll) extracts a 512-dimensional L2-normalized float vector in memory and stores only the vector, vector_version, and consent metadata in MongoDB (BiometricProfile). However, if an institution uses the legacy/batch folder upload flow (/auth/upload-student-face + core/train_faces.py), enrollment images are written to data/dataset/ on the host server to build data/face_encodings_arcface.pkl. Profile avatars uploaded via /auth/update-profile-photo are stored as WebP files in backend/data/avatars/.",
      "Important Note on Embeddings: 512-dimensional face embeddings are not raw photographs, but they are biometric templates derived from a person's face. SmartFace does NOT describe embeddings as anonymous or mathematically impossible to invert; they are treated and protected as sensitive biometric personal data.",
      "Security Snapshots: When the local OpenCV kiosk engine (core/attendance_system.py) detects sustained unrecognized faces, it can save a snapshot locally under data/Intruders/ or transmit an optional image_base64 payload to SecurityLog (/security/intruder-alert) when enabled by the institution.",
      "Attendance Records, Student Profiles, Audit Logs & AI Conversations: Attendance check-ins, user profiles, leave requests, attendance correction disputes, AttendanceAuditLog entries, and NexaConversation messages (up to the most recent 60 messages per thread) are persisted in MongoDB (and optionally synced to Supabase PostgreSQL or Google Sheets if configured by the institution).",
    ],
  },
  {
    heading: "2. Collection Purpose, Processing & Storage Location",
    body: [
      "Data is collected solely to record and verify campus attendance, calculate deterministic attendance eligibility, manage leaves and disputes, notify linked parents/guardians, and maintain security audit trails.",
      "Processing and storage location depend on the institution's deployment model: self-hosted deployments keep all API, AI inference, and MongoDB/local storage inside infrastructure controlled by the institution; managed deployments host services in the region configured for the institutional tenant.",
      "We do not sell personal or biometric data, do not display third-party advertising, and do not train shared public AI models on your institution's embeddings or attendance records. When Nexa AI uses the external Groq LLM API, prompts strip direct PII (email addresses, phone numbers, and student IDs) and pass only deterministic aggregate statistics.",
    ],
  },
  {
    heading: "3. Security Controls & Authorized Access",
    body: [
      "Access is gated by JWT access tokens (15-minute default expiry), httpOnly refresh cookies tracked in UserSession, bcrypt password hashing (cost factor 12), and role-based access control across Student, Teacher, Admin, Parent (requiring confirmed ward linking), and Super Admin roles.",
      "Transport encryption (HTTPS/TLS) protects data in transit. Database encryption at rest depends on the institution's MongoDB/cloud storage configuration; the Flutter mobile offline queue encrypts buffered check-in records locally using AES-256 (HiveAesCipher) and signs each record with HMAC-SHA256.",
    ],
  },
  {
    heading: "4. Consent, Withdrawal, Alternatives & Corrections",
    body: [
      "Consent & Withdrawal: Biometric enrollment requires explicit opt-in consent (recorded with timestamp). Users may withdraw consent and delete their stored 512-D template at any time via DELETE /auth/biometric, which removes the BiometricProfile record, sets biometric_registered to false, and records the deletion in AttendanceAuditLog.",
      "Non-Biometric Alternatives: Students who opt out of facial recognition or encounter recognition failures can mark attendance using the teacher's 20-second rotating HMAC-SHA256 QR code or be marked via faculty/admin manual roster recording.",
      "Correction Requests: Students and linked parents can submit attendance correction disputes (POST /attendance/disputes) for faculty/admin review and resolution.",
      "Protection of Minors: Where students are minors under applicable law, the deploying institution must obtain verifiable parent or legal guardian consent prior to biometric enrollment. Parent Portal access to a student's records requires explicit confirmation by the student or an administrator.",
    ],
  },
  {
    heading: "5. Retention, Data Export & Deletion Procedures",
    body: [
      "Retention periods for attendance records, security snapshots, and audit logs are determined by the deploying institution's academic and statutory retention policies. Mobile offline queue records automatically purge synced entries older than 7 days.",
      "Users can export their profile, biometric metadata (excluding raw embeddings), leave applications, and disputes via GET /auth/privacy/export, delete Nexa AI conversations via DELETE /ai/conversations/:id, or request full account deletion review via POST /auth/privacy/delete-request.",
    ],
  },
  {
    heading: "6. Institutional Legal Review & Contact",
    body: [
      "SmartFace provides technical privacy controls to assist compliance with frameworks such as India's DPDP Act 2023 and US FERPA, but deploying institutions must conduct their own legal and Data Protection Impact Assessment (DPIA) review before production rollout.",
      `Privacy inquiries, export assistance, or deletion questions can be directed to ${COMPANY_CONTACT.privacyEmail} (${COMPANY_CONTACT.developer}, ${COMPANY_CONTACT.location}, Phone: ${COMPANY_CONTACT.phoneFormatted}). Repository: ${COMPANY_CONTACT.github}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
        <main className="relative min-h-screen pb-28 pt-24 sm:pt-32">
          <div className="relative mx-auto w-full max-w-[46rem] px-6">
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-surface px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-mid transition hover:border-white/20 hover:text-hi"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Home
              </Link>
            </div>

            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
              Legal &amp; Biometric Privacy
            </p>
            <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.03em] text-hi sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-mid">
              Last updated: November 26, 2026 · Written to reflect SmartFace&apos;s actual data handling across web, mobile, API, and local kiosk components.
            </p>

            <div className="mt-12 space-y-10">
              {SECTIONS.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-display text-xl font-medium tracking-tight text-hi">
                    {section.heading}
                  </h2>
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 28)} className="mt-3 text-[15px] leading-relaxed text-mid">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>

                <div className="mt-16 pt-8 border-t border-[var(--hairline)] flex items-center justify-between font-mono text-[11px] text-faint">
                  <Link href="/" className="hover:text-hi transition-colors">
                    ← Front door
                  </Link>
                  <div className="flex gap-4">
                    <Link href="/security" className="hover:text-hi transition-colors">
                      Security Architecture
                    </Link>
                    <Link href="/terms" className="hover:text-hi transition-colors">
                      Terms &amp; Conditions →
                    </Link>
                  </div>
                </div>
            </div>
        </main>
        );
}
