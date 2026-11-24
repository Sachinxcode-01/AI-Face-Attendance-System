"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Clock, DollarSign, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";
import { SpotlightCard } from "./ui/spotlight-card";

interface RoiCalculatorProps {
  onOpenDemo?: () => void;
  onOpenPilot?: () => void;
}

export function RoiCalculator({ onOpenDemo, onOpenPilot }: RoiCalculatorProps) {
  const studentsInputId = useId();
  const teachersInputId = useId();
  const classesInputId = useId();
  const [students, setStudents] = useState<number>(2400);
  const [teachers, setTeachers] = useState<number>(110);
  const [classesPerDay, setClassesPerDay] = useState<number>(5);

  // Constants based on empirical higher education studies
  // 12 minutes lost per lecture to manual roll call / paper logs
  const minsPerClassManual = 12;
  const academicDaysPerYear = 190;

  // Total hours lost annually per campus
  const totalLecturesPerYear = teachers * classesPerDay * academicDaysPerYear;
  const hoursSavedPerYear = Math.round((totalLecturesPerYear * minsPerClassManual) / 60);

  // Average time reduction: from 12 mins down to 10 seconds touchless verification = 98.6%
  const timeReductionPercent = 98.6;

  // Approximate institutional cost savings (avg faculty hour ₹550 / $12 + register stationary + admin proxy audit costs)
  const annualCostSavingsInr = Math.round(hoursSavedPerYear * 480 + students * 65);

  // Proxies prevented (avg proxy fraud rate of 4.8% eliminated)
  const proxiesPreventedAnnual = Math.round(students * 0.048 * classesPerDay * academicDaysPerYear);

  return (
    <section
      id="roi-calculator"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32 lg:py-36 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(143,139,255,0.12),transparent)]"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Financial & Operational Impact"
          title="Calculate Your Campus ROI & Time Savings"
          description="Manual roll-call squanders up to 15% of instructional time. See the verified annual hours and administrative budget SmartFace returns to your faculty."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-12 items-start">
          {/* Inputs Column (5 cols) */}
          <Reveal className="lg:col-span-5" direction="up" delay={0.05}>
            <div className="card-bytune rounded-[22px] p-6 sm:p-8 space-y-7 border border-white/10 bg-[rgba(16,16,22,0.85)] backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.08]">
                <Calculator className="h-5 w-5 text-accent" />
                <h3 className="font-display text-[17px] font-medium text-hi">
                  Campus Sizing Parameters
                </h3>
              </div>

              {/* Slider 1: Students */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor={studentsInputId} className="font-mono text-[11.5px] uppercase tracking-wider text-mid flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-accent" />
                    Enrolled Students
                  </label>
                  <span className="font-mono text-sm font-semibold text-hi px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                    {students.toLocaleString()}
                  </span>
                </div>
                <input
                  id={studentsInputId}
                  aria-label="Enrolled Students"
                  type="range"
                  min={300}
                  max={12000}
                  step={100}
                  value={students}
                  onChange={(e) => setStudents(Number(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-faint">
                  <span>300 (Small College)</span>
                  <span>12,000+ (Multi-Campus)</span>
                </div>
              </div>

              {/* Slider 2: Teachers */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor={teachersInputId} className="font-mono text-[11.5px] uppercase tracking-wider text-mid flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-spotify" />
                    Faculty / Teachers
                  </label>
                  <span className="font-mono text-sm font-semibold text-hi px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                    {teachers}
                  </span>
                </div>
                <input
                  id={teachersInputId}
                  aria-label="Faculty / Teachers"
                  type="range"
                  min={15}
                  max={500}
                  step={5}
                  value={teachers}
                  onChange={(e) => setTeachers(Number(e.target.value))}
                  className="w-full accent-spotify h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-faint">
                  <span>15 Faculty</span>
                  <span>500+ Professors</span>
                </div>
              </div>

              {/* Slider 3: Classes Per Day */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor={classesInputId} className="font-mono text-[11.5px] uppercase tracking-wider text-mid flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-accent2" />
                    Lectures / Day per Faculty
                  </label>
                  <span className="font-mono text-sm font-semibold text-hi px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                    {classesPerDay} classes
                  </span>
                </div>
                <input
                  id={classesInputId}
                  aria-label="Lectures / Day per Faculty"
                  type="range"
                  min={2}
                  max={7}
                  step={1}
                  value={classesPerDay}
                  onChange={(e) => setClassesPerDay(Number(e.target.value))}
                  className="w-full accent-accent2 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-faint">
                  <span>2 Lectures</span>
                  <span>7 Lectures</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[12px] text-faint leading-relaxed">
                <p>
                  *Benchmarked against standard 50-minute collegiate lectures with 12 minutes lost to manual roll calls, paper signing, or proxy roll verifications.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Results Display (7 cols) */}
          <Reveal className="lg:col-span-7" direction="up" delay={0.12}>
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Metric 1: Hours Saved */}
                <SpotlightCard spotlightColor="rgba(143, 139, 255, 0.22)" className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">
                      Annual Instructional Time Reclaimed
                    </span>
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                  <div className="mt-3 font-display text-4xl font-semibold tracking-tight text-hi flex items-baseline gap-1.5">
                    <span>{hoursSavedPerYear.toLocaleString()}</span>
                    <span className="text-lg font-normal text-mid">Hours</span>
                  </div>
                  <p className="mt-2 text-[13px] text-mid">
                    Equivalent to <span className="text-hi font-medium">{(hoursSavedPerYear / 8).toFixed(0)} full working days</span> of faculty teaching restored.
                  </p>
                </SpotlightCard>

                {/* Metric 2: Attendance Speedup */}
                <SpotlightCard spotlightColor="rgba(30, 215, 96, 0.22)" className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">
                      Verification Velocity
                    </span>
                    <TrendingUp className="h-4 w-4 text-spotify" />
                  </div>
                  <div className="mt-3 font-display text-4xl font-semibold tracking-tight text-spotify flex items-baseline gap-1.5">
                    <span>{timeReductionPercent}%</span>
                    <span className="text-lg font-normal text-mid">Faster</span>
                  </div>
                  <p className="mt-2 text-[13px] text-mid">
                    Replaced 12-minute chaotic manual roll calls with <span className="text-hi font-medium">&lt;300ms touchless gate pass</span>.
                  </p>
                </SpotlightCard>

                {/* Metric 3: Administrative Cost Savings */}
                <SpotlightCard spotlightColor="rgba(111, 216, 255, 0.22)" className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">
                      Estimated Annual Cost Savings
                    </span>
                    <DollarSign className="h-4 w-4 text-accent2" />
                  </div>
                  <div className="mt-3 font-display text-4xl font-semibold tracking-tight text-hi flex items-baseline gap-1.5">
                    <span>₹{(annualCostSavingsInr / 100000).toFixed(2)}</span>
                    <span className="text-lg font-normal text-mid">Lakhs / yr</span>
                  </div>
                  <p className="mt-2 text-[13px] text-mid">
                    Saved in reclaimed faculty salary waste, paper logs, and manual registrar attendance audits.
                  </p>
                </SpotlightCard>

                {/* Metric 4: Proxy Absences Eliminated */}
                <SpotlightCard spotlightColor="rgba(243, 198, 79, 0.22)" className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">
                      Proxy Attempts Prevented
                    </span>
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="mt-3 font-display text-4xl font-semibold tracking-tight text-amber-300 flex items-baseline gap-1.5">
                    <span>{proxiesPreventedAnnual.toLocaleString()}</span>
                    <span className="text-lg font-normal text-mid">Ghost check-ins</span>
                  </div>
                  <p className="mt-2 text-[13px] text-mid">
                    Zero fake friend attendance with rotating HMAC QR & ArcFace liveness checks.
                  </p>
                </SpotlightCard>
              </div>

              {/* Action Banner inside Calculator */}
              <div className="card-bytune rounded-[22px] p-6 border border-white/10 bg-gradient-to-r from-accent/15 via-black/40 to-spotify/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-display text-base font-semibold text-hi">
                    Ready to reclaim {hoursSavedPerYear.toLocaleString()} hours this academic year?
                  </h4>
                  <p className="text-[13px] text-mid">
                    Book a live walkthrough or evaluate SmartFace on your campus risk-free.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {onOpenDemo && (
                    <button
                      type="button"
                      onClick={onOpenDemo}
                      className="btn-pill-accent h-10 px-5 text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-[0_0_18px_rgba(143,139,255,0.3)]"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Book Demo
                    </button>
                  )}
                  {onOpenPilot && (
                    <button
                      type="button"
                      onClick={onOpenPilot}
                      className="btn-pill-glass h-10 px-4 text-[13px] font-medium border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-hi cursor-pointer"
                    >
                      Apply for Pilot
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
