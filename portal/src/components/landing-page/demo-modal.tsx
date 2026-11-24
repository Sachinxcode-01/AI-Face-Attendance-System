"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, ScanFace, X } from "lucide-react";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  institutionName: string;
  principalName: string;
  contactPerson: string;
  email: string;
  phone: string;
  studentCount: string;
  teacherCount: string;
  notes: string;
}

interface FormErrors {
  institutionName?: string;
  principalName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  studentCount?: string;
  teacherCount?: string;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    institutionName: "",
    principalName: "",
    contactPerson: "",
    email: "",
    phone: "",
    studentCount: "",
    teacherCount: "",
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const mountTime = useRef(Date.now());
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Escape to close + body scroll lock + focus management
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => firstFieldRef.current?.focus(), 60);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (data: FormData): FormErrors => {
    const errs: FormErrors = {};
      if (!data.institutionName.trim()) {
        errs.institutionName = "Institution / College name is required.";
      }
      if (!data.principalName.trim()) {
        errs.principalName = "Principal / Dean name is required.";
      }
      if (!data.contactPerson.trim()) {
        errs.contactPerson = "Contact person name is required.";
      }
      if (!data.email.trim()) {
        errs.email = "Institutional or work email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errs.email = "Please enter a valid institutional email.";
      }
        if (!data.phone.trim()) {
          errs.phone = "Phone number is required for demo scheduling.";
        } else if (!/^[+0-9\s\-()]{7,20}$/.test(data.phone.trim())) {
          errs.phone = "Please enter a valid phone number.";
        }
          if (!data.studentCount) {
            errs.studentCount = "Please select your student count.";
          }
            if (!data.teacherCount) {
              errs.teacherCount = "Please select your faculty / teacher count.";
            }

            return errs;
          };

          const handleChange = (
            e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
          ) => {
            const { name, value } = e.target;
            setFormData((prev) => ({ ...prev, [name]: value }));

            if (errors[name as keyof FormErrors]) {
              setErrors((prev) => ({ ...prev, [name]: undefined }));
            }
          };

          const handleBlur = (
            e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
          ) => {
            const { name } = e.target;
            setTouched((prev) => ({ ...prev, [name]: true }));
            const validationErrors = validate(formData);
            if (validationErrors[name as keyof FormErrors]) {
              setErrors((prev) => ({
                ...prev,
                [name]: validationErrors[name as keyof FormErrors],
              }));
            }
          };

          const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            // Anti-bot check
            if (honeypot) {
              onClose();
              return;
            }

            const elapsed = Date.now() - mountTime.current;
              if (elapsed < 800) {
                onClose();
                return;
              }

              setTouched({
                institutionName: true,
                principalName: true,
                contactPerson: true,
                email: true,
                phone: true,
                studentCount: true,
                teacherCount: true,
              });

              const validationErrors = validate(formData);
              setErrors(validationErrors);

              if (Object.keys(validationErrors).length > 0) {
                return;
              }

              setIsSubmitting(true);
              setSubmitError(null);

              try {
                  const res = await fetch("/api/demo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      institutionName: formData.institutionName.trim(),
                      principalName: formData.principalName.trim(),
                      contactPerson: formData.contactPerson.trim(),
                      email: formData.email.trim(),
                      phone: formData.phone.trim(),
                      studentCount: formData.studentCount,
                      teacherCount: formData.teacherCount,
                      notes: formData.notes.trim() || undefined,
                      honeypot: honeypot || undefined,
                    }),
                  });

                  const data = await res.json();

                  if(!res.ok) {
                throw new Error(data?.message || "Could not schedule demo. Please try again shortly.");
              }

      setSubmittedLeadId(data.leadId || "DEMO-CONFIRMED");
              setIsSubmitting(false);

              // Brief delay to show confirmation checkmark, then redirect to thank you
              setTimeout(() => {
                onClose();
                router.push("/thank-you");
              }, 1800);
            } catch (err: unknown) {
              setIsSubmitting(false);
              setSubmitError(
                err instanceof Error
                  ? err.message
                  : "An unexpected error occurred. Please try again."
              );
            }
          };

          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            >
              {/* Backdrop */}
              <div
                onClick={onClose}
                className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
              />

                {/* Modal Card with ByTune Card Recipe */}
                <div className="relative z-10 w-full max-w-xl max-h-[92vh] overflow-y-auto card-bytune rounded-[22px] p-6 sm:p-8 shadow-2xl border border-white/10 bg-[rgba(16,16,22,0.92)] backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full border border-accent/30 bg-accent/10">
                        <ScanFace className="h-5 w-5 text-accent" />
                      </span>
                      <div>
                        <h2 id="modal-title" className="font-display text-lg font-medium text-hi">
                          Book College Product Demo
                        </h2>
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                          Live 30-min Executive Session · Edge Kiosk & Sentinel Demo
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

                      {submittedLeadId ? (
                        <div className="py-10 text-center space-y-3">
                          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 className="h-7 w-7" />
                          </div>
                          <h3 className="font-display text-xl font-medium text-hi">Demo Session Reserved!</h3>
                          <p className="text-[14px] text-mid max-w-md mx-auto">
                            Lead Reference: <span className="font-mono text-accent font-semibold">{submittedLeadId}</span>. Our Collegiate Solutions Director has been notified and will email calendar invites shortly.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                          {/* Honeypot */}
                          <div aria-hidden="true" style={{ display: "none" }}>
                            <input
                              tabIndex={-1}
                              autoComplete="off"
                              value={honeypot}
                              onChange={(e) => setHoneypot(e.target.value)}
                            />
                          </div>

                            {/* Institution Name */}
                            <div>
                                <label htmlFor="institutionName" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                                  Institution / University Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                  ref={firstFieldRef}
                                  id="institutionName"
                                  name="institutionName"
                                  type="text"
                                  required
                                  value={formData.institutionName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                placeholder="e.g. National Institute of Technology / Oxford College"
                                  className={`mt-1.5 w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi placeholder:text-faint transition focus:outline-none focus:ring-1 ${errors.institutionName && touched.institutionName
                                      ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                                      : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                }`}
              />
              {errors.institutionName && touched.institutionName && (
                <p className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.institutionName}
                </p>
              )}
            </div>

            {/* Principal Name & Contact Person */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="principalName" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                  Principal / Dean Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="principalName"
                  name="principalName"
                  type="text"
                  required
                  value={formData.principalName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Dr. Rajesh Sharma"
                  className={`mt-1.5 w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi placeholder:text-faint transition focus:outline-none focus:ring-1 ${
                    errors.principalName && touched.principalName
                      ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                      : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                  }`}
                />
                {errors.principalName && touched.principalName && (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {errors.principalName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contactPerson" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                  Contact Person / Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="contactPerson"
                  name="contactPerson"
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Prof. Ananya Rao (HOD / IT Head)"
                  className={`mt-1.5 w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi placeholder:text-faint transition focus:outline-none focus:ring-1 ${
                    errors.contactPerson && touched.contactPerson
                      ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                      : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                  }`}
                />
                {errors.contactPerson && touched.contactPerson && (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {errors.contactPerson}
                  </p>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
                                      <div>
                                        <label htmlFor="email" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                                          Institutional Email <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                          id="email"
                                          name="email"
                                          type="email"
                                          required
                                          value={formData.email}
                                          onChange={handleChange}
                                          onBlur={handleBlur}
                                          placeholder="principal@nitk.ac.in"
                                          className={`mt-1.5 w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi placeholder:text-faint transition focus:outline-none focus:ring-1 ${errors.email && touched.email
                                              ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                                              : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                                            }`}
                />
                                        {errors.email && touched.email && (
                                          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            {errors.email}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <label htmlFor="phone" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                                          Direct Phone / WhatsApp <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                          id="phone"
                                          name="phone"
                                          type="tel"
                                          required
                                          value={formData.phone}
                                          onChange={handleChange}
                                          onBlur={handleBlur}
                                          placeholder="+91 98765 43210"
                                          className={`mt-1.5 w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi placeholder:text-faint transition focus:outline-none focus:ring-1 ${errors.phone && touched.phone
                                              ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                                              : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                                            }`}
                                        />
                                        {errors.phone && touched.phone && (
                                          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            {errors.phone}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Student Count & Teacher Count */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                      <div>
                                        <label htmlFor="studentCount" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                                          Student Count <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                          id="studentCount"
                                          name="studentCount"
                                          required
                                          value={formData.studentCount}
                                          onChange={handleChange}
                                          onBlur={handleBlur}
                                          className={`mt-1.5 w-full rounded-xl border bg-bg1 px-3.5 py-2.5 text-[14px] text-hi transition focus:outline-none focus:ring-1 ${errors.studentCount && touched.studentCount
                                              ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                                              : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                                            }`}
                                        >
                                          <option value="">Select student count...</option>
                                          <option value="under-500">&lt; 500 students</option>
                                          <option value="500-1500">500 – 1,500 students</option>
                                          <option value="1500-3000">1,500 – 3,000 students</option>
                                          <option value="3000-8000">3,000 – 8,000 students</option>
                                          <option value="8000-plus">8,000+ students (University)</option>
                                        </select>
                                        {errors.studentCount && touched.studentCount && (
                                          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            {errors.studentCount}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <label htmlFor="teacherCount" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                                          Faculty / Teacher Count <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                          id="teacherCount"
                                          name="teacherCount"
                                          required
                                          value={formData.teacherCount}
                                          onChange={handleChange}
                                          onBlur={handleBlur}
                                          className={`mt-1.5 w-full rounded-xl border bg-bg1 px-3.5 py-2.5 text-[14px] text-hi transition focus:outline-none focus:ring-1 ${errors.teacherCount && touched.teacherCount
                                              ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                                              : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                                            }`}
                                        >
                                          <option value="">Select teacher count...</option>
                                          <option value="under-30">&lt; 30 faculty members</option>
                                          <option value="30-80">30 – 80 faculty members</option>
                                          <option value="80-200">80 – 200 faculty members</option>
                                          <option value="200-plus">200+ faculty members</option>
                                        </select>
                                        {errors.teacherCount && touched.teacherCount && (
                                          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            {errors.teacherCount}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label htmlFor="notes" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                                          Deployment Scope or Specific Requirements (Optional)
                                        </label>
              <textarea
                                          id="notes"
                                          name="notes"
                                          rows={2}
                                          value={formData.notes}
                                          onChange={handleChange}
                                        placeholder="e.g. 6 campus gates, biometric kiosk integration, LMS synchronization needed"
                                        className="mt-1.5 w-full rounded-xl border border-[var(--hairline)] bg-white/[0.03] px-3.5 py-2 text-[14px] text-hi placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
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
                                          className="btn-pill-accent w-full h-11 text-[14px] disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
                                        >
                                          {isSubmitting ? (
                                            <>
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                              Submitting Lead to CRM...
                                            </>
                                          ) : (
                                            "Confirm Demo Booking"
                                          )}
                                        </button>
                                        <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                                          Direct Principal & Dean Priority Dispatch · Zero spam · DPDP / FERPA compliant
                                        </p>
                                      </div>
          </form>
        )}
                            </div>
                          </div>
                          );
}
