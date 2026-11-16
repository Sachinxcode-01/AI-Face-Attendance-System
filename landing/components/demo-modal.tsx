"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, ScanFace, X } from "lucide-react";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  institution: string;
  campusSize: string;
  phone: string;
  notes: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  institution?: string;
  campusSize?: string;
  phone?: string;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    institution: "",
    campusSize: "",
    phone: "",
    notes: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    // Move focus into the dialog for keyboard/AT users
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
    if (!data.fullName.trim()) {
      errs.fullName = "Full name is required.";
    } else if (data.fullName.trim().length < 2) {
      errs.fullName = "Name must be at least 2 characters.";
    }

    if (!data.email.trim()) {
      errs.email = "Institutional or work email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = "Please enter a valid email address.";
    }

    if (!data.institution.trim()) {
      errs.institution = "Institution / Organization name is required.";
    }

    if (!data.campusSize) {
      errs.campusSize = "Please select your student body size.";
    }

    if (data.phone && !/^[+0-9\s\-()]{7,20}$/.test(data.phone.trim())) {
      errs.phone = "Please enter a valid phone number.";
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

    // Anti-bot checks
    if (honeypot) {
      onClose();
      return;
    }

    const elapsed = Date.now() - mountTime.current;
    if (elapsed < 1200) {
      onClose();
      return;
    }

    setTouched({
      fullName: true,
      email: true,
      institution: true,
      campusSize: true,
      phone: true,
    });

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    // Simulate network dispatch
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);
    onClose();
    router.push("/thank-you");
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
        className="fixed inset-0 bg-black/85 transition-opacity"
      />

      {/* Modal Card with ByTune Card 2 Recipe */}
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto card-bytune rounded-[22px] p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-accent/30 bg-accent/10">
              <ScanFace className="h-5 w-5 text-accent" />
            </span>
            <div>
              <h2 id="modal-title" className="font-display text-lg font-medium text-hi">
                Request Campus Walkthrough
              </h2>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                30-min live session · Kiosk & Sentinel demo
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

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {/* 🛡️ Hidden bot honeypot */}
          <div aria-hidden="true" style={{ display: "none" }}>
            <label htmlFor="website_trap">Leave blank</label>
            <input
              id="website_trap"
              name="website_trap"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              ref={firstFieldRef}
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Dr. Eleanor Vance"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className={`mt-1.5 w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi placeholder:text-faint transition focus:outline-none focus:ring-1 ${
                errors.fullName && touched.fullName
                  ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                  : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
              }`}
            />
            {errors.fullName && touched.fullName && (
              <p id="fullName-error" className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email & Phone grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                Campus Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="vance@cambridge.edu"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`mt-1.5 w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi placeholder:text-faint transition focus:outline-none focus:ring-1 ${
                  errors.email && touched.email
                    ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                    : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                }`}
              />
              {errors.email && touched.email && (
                <p id="email-error" className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                Direct Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+1 (555) 019-2834"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={`mt-1.5 w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi placeholder:text-faint transition focus:outline-none focus:ring-1 ${
                  errors.phone && touched.phone
                    ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                    : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                }`}
              />
              {errors.phone && touched.phone && (
                <p id="phone-error" className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          {/* Institution & Campus Size */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="institution" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                University / Institution <span className="text-red-400">*</span>
              </label>
              <input
                id="institution"
                name="institution"
                type="text"
                required
                value={formData.institution}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Massachusetts Institute of Tech"
                aria-invalid={!!errors.institution}
                aria-describedby={errors.institution ? "institution-error" : undefined}
                className={`mt-1.5 w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-hi placeholder:text-faint transition focus:outline-none focus:ring-1 ${
                  errors.institution && touched.institution
                    ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                    : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                }`}
              />
              {errors.institution && touched.institution && (
                <p id="institution-error" className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.institution}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="campusSize" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
                Student Body Size <span className="text-red-400">*</span>
              </label>
              <select
                id="campusSize"
                name="campusSize"
                required
                value={formData.campusSize}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!errors.campusSize}
                aria-describedby={errors.campusSize ? "campusSize-error" : undefined}
                className={`mt-1.5 w-full rounded-xl border bg-bg1 px-3.5 py-2.5 text-[14px] text-hi placeholder:text-faint transition focus:outline-none focus:ring-1 ${
                  errors.campusSize && touched.campusSize
                    ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30"
                    : "border-[var(--hairline)] focus:border-accent focus:ring-accent/30"
                }`}
              >
                <option value="">Select campus size...</option>
                <option value="under-1k">&lt; 1,000 students</option>
                <option value="1k-5k">1,000 – 5,000 students</option>
                <option value="5k-20k">5,000 – 20,000 students</option>
                <option value="20k-plus">20,000+ students (Enterprise)</option>
              </select>
              {errors.campusSize && touched.campusSize && (
                <p id="campusSize-error" className="mt-1 flex items-center gap-1.5 text-[12px] text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.campusSize}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block font-mono text-[11px] uppercase tracking-[0.1em] text-mid">
              Deployment Context or Requirements (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. 14 turnstile gates, 3 lecture halls, seeking turn-key deployment"
              className="mt-1.5 w-full rounded-xl border border-[var(--hairline)] bg-white/[0.03] px-3.5 py-2 text-[14px] text-hi placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-pill-accent w-full h-11 text-[14px] disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing Environment...
                </>
              ) : (
                "Confirm & Schedule Walkthrough"
              )}
            </button>
            <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              Strictly confidential · Zero spam · FERPA compliant
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
