"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, AlertCircle, CheckCircle2, ChevronRight, Loader2, Sparkles, X } from "lucide-react";

interface PilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PilotFormData {
  institutionName: string;
  accreditation: string;
  cityState: string;
  contactPerson: string;
  roleTitle: string;
  email: string;
  phone: string;
  pilotDuration: "30_day" | "60_day" | "campus_evaluation";
  studentCount: string;
  teacherCount: string;
  kioskCount: string;
  deploymentTimeline: "immediate" | "next_semester" | "academic_year";
  notes: string;
}

export function PilotModal({ isOpen, onClose }: PilotModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<PilotFormData>({
    institutionName: "",
    accreditation: "NAAC / Autonomous",
    cityState: "",
    contactPerson: "",
    roleTitle: "",
    email: "",
    phone: "",
    pilotDuration: "30_day",
    studentCount: "500-1500",
    teacherCount: "30-80",
    kioskCount: "2-4",
    deploymentTimeline: "immediate",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => firstFieldRef.current?.focus(), 60);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.institutionName.trim()) errs.institutionName = "Institution name is required.";
    if (!formData.cityState.trim()) errs.cityState = "City and State are required.";
    if (!formData.contactPerson.trim()) errs.contactPerson = "Contact person name is required.";
    if (!formData.roleTitle.trim()) errs.roleTitle = "Role or title is required.";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Valid institutional email is required.";
    }
    if (!formData.phone.trim() || formData.phone.length < 7) {
      errs.phone = "Valid contact phone is required.";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      onClose();
      return;
    }

    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          honeypot: honeypot || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Could not submit pilot request.");
      }

      setApplicationId(data.applicationId || "PILOT-APPROVED");
      setIsSubmitting(false);

      setTimeout(() => {
        onClose();
        router.push("/thank-you");
      }, 2000);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : "Error submitting pilot application");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pilot-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity" />

      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto card-bytune rounded-[22px] p-6 sm:p-8 shadow-2xl border border-white/10 bg-[rgba(16,16,22,0.95)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-spotify/30 bg-spotify/10">
              <Activity className="h-5 w-5 text-spotify" />
            </span>
            <div>
              <h2 id="pilot-modal-title" className="font-display text-lg font-medium text-hi">
                Apply for Campus Pilot Program
              </h2>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                Live On-Premise Evaluation · Zero Hardware Lock-in
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-mid transition hover:bg-white/[0.08] hover:text-hi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {applicationId ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-spotify/30 bg-spotify/10 text-spotify">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="font-display text-2xl font-medium text-hi">Pilot Application Confirmed</h3>
            <p className="text-[14px] text-mid max-w-lg mx-auto">
              Application ID: <span className="font-mono text-spotify font-semibold">{applicationId}</span>. Our deployment engineer is assembling your pre-calibrated edge container credentials and will contact your team.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            <div aria-hidden="true" style={{ display: "none" }}>
              <input value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </div>

            {/* Pilot Duration Selection Tabs */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid mb-2">
                Select Pilot Tier <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "30_day", title: "30-Day Pilot", desc: "Single Dept / 1 Gate" },
                  { id: "60_day", title: "60-Day Pilot", desc: "Full Semester Trial" },
                  { id: "campus_evaluation", title: "Campus Eval", desc: "Multi-Gate & Kiosk Lab" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, pilotDuration: tier.id as any }))}
                    className={`p-3 rounded-xl border text-left transition-all ${formData.pilotDuration === tier.id
                        ? "border-spotify bg-spotify/10 text-hi shadow-[0_0_15px_rgba(30,215,96,0.2)]"
                        : "border-white/10 bg-white/[0.02] text-mid hover:border-white/20"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[13.5px] font-semibold text-hi">{tier.title}</span>
                      {formData.pilotDuration === tier.id && <Sparkles className="h-3.5 w-3.5 text-spotify" />}
                    </div>
                    <span className="mt-1 block font-mono text-[10px] text-faint">{tier.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Institution Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                  Institution Name <span className="text-red-400">*</span>
                </label>
                <input
                  ref={firstFieldRef}
                  type="text"
                  required
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  placeholder="e.g. Bangalore Institute of Technology"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi focus:border-spotify focus:outline-none"
                />
                {errors.institutionName && <p className="mt-1 text-[12px] text-red-400">{errors.institutionName}</p>}
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                  Location (City, State) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.cityState}
                  onChange={(e) => setFormData({ ...formData, cityState: e.target.value })}
                  placeholder="e.g. Bengaluru, Karnataka"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi focus:border-spotify focus:outline-none"
                />
                {errors.cityState && <p className="mt-1 text-[12px] text-red-400">{errors.cityState}</p>}
              </div>
            </div>

            {/* Contact Person & Role */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                  Applicant Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Prof. Ramesh Hegde"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi focus:border-spotify focus:outline-none"
                />
                {errors.contactPerson && <p className="mt-1 text-[12px] text-red-400">{errors.contactPerson}</p>}
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                  Role / Designation <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.roleTitle}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                  placeholder="Dean of Academics / IT Director"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi focus:border-spotify focus:outline-none"
                />
                {errors.roleTitle && <p className="mt-1 text-[12px] text-red-400">{errors.roleTitle}</p>}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                  Work / Campus Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="dean@bit-bangalore.edu.in"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi focus:border-spotify focus:outline-none"
                />
                {errors.email && <p className="mt-1 text-[12px] text-red-400">{errors.email}</p>}
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                  Direct Phone / WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98450 12345"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi focus:border-spotify focus:outline-none"
                />
                {errors.phone && <p className="mt-1 text-[12px] text-red-400">{errors.phone}</p>}
              </div>
            </div>

            {/* Pilot Sizing: Students, Faculty, Gates, Timeline */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-mid">
                  Students In Scope
                </label>
                <select
                  value={formData.studentCount}
                  onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-bg1 px-2.5 py-2 text-[13px] text-hi"
                >
                  <option value="under-500">&lt; 500</option>
                  <option value="500-1500">500 – 1.5K</option>
                  <option value="1500-4000">1.5K – 4K</option>
                  <option value="4000-plus">4K+ cohort</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-mid">
                  Faculty Size
                </label>
                <select
                  value={formData.teacherCount}
                  onChange={(e) => setFormData({ ...formData, teacherCount: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-bg1 px-2.5 py-2 text-[13px] text-hi"
                >
                  <option value="10-30">10 – 30</option>
                  <option value="30-80">30 – 80</option>
                  <option value="80-200">80 – 200</option>
                  <option value="200-plus">200+</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-mid">
                  Gates / Kiosks
                </label>
                <select
                  value={formData.kioskCount}
                  onChange={(e) => setFormData({ ...formData, kioskCount: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-bg1 px-2.5 py-2 text-[13px] text-hi"
                >
                  <option value="1-2">1 – 2 Gates</option>
                  <option value="2-4">2 – 4 Gates</option>
                  <option value="5-10">5 – 10 Gates</option>
                  <option value="10-plus">10+ Gates</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-mid">
                  Launch Timeline
                </label>
                <select
                  value={formData.deploymentTimeline}
                  onChange={(e) => setFormData({ ...formData, deploymentTimeline: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-bg1 px-2.5 py-2 text-[13px] text-hi"
                >
                  <option value="immediate">Immediate (Pending Scoping)</option>
                  <option value="next_semester">Next Semester</option>
                  <option value="academic_year">Academic Year</option>
                </select>
              </div>
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[12.5px] text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-full bg-gradient-to-r from-emerald-500 to-spotify text-[#050507] font-semibold text-[14px] flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_24px_rgba(30,215,96,0.35)] transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    Submitting Pilot Application...
                  </>
                ) : (
                  <>
                    <span>Submit Pilot Program Application</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                Includes InsightFace ArcFace 512-D evaluation scoping &amp; deployment consultation
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
