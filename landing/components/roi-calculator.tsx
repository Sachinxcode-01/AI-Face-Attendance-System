"use client";

import { useId, useState } from "react";
import { Calculator, Clock, DollarSign, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { calculateRoi, DEFAULT_ROI_INPUTS, type RoiInputs } from "@/lib/roi";
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
  const [inputs, setInputs] = useState<RoiInputs>(DEFAULT_ROI_INPUTS);

  const updateField = (key: keyof RoiInputs, value: number) => {
    setInputs((prev) => ({
      ...prev,
      [key]: Number.isFinite(value) && value >= 0 ? value : 0,
    }));
  };

  const result = calculateRoi(inputs);

  const formatInr = (amount: number) => {
    const absLakhs = Math.abs(amount) / 100000;
    const prefix = amount < 0 ? "-₹" : "₹";
    return `${prefix}${absLakhs.toFixed(2)}L`;
  };

  return (
    <section
      id="roi-calculator"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32 lg:py-36 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(143,139,255,0.12),transparent)]"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Illustrative Campus Estimator"
          title="Estimate Campus Time Recovery &amp; ROI"
          description="Model faculty hours recovered, direct administrative savings, implementation costs, and estimated payback based on your campus assumptions. All figures are estimates, not guaranteed outcomes."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-12 items-start">
          {/* Inputs Column (5 cols) */}
          <Reveal className="lg:col-span-5" direction="up" delay={0.05}>
              <div className="card-bytune rounded-[22px] p-6 sm:p-8 space-y-6 border border-white/10 bg-[rgba(16,16,22,0.85)] backdrop-blur-xl shadow-xl">
                <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.08]">
                  <Calculator className="h-5 w-5 text-accent" />
                  <h3 className="font-display text-[17px] font-medium text-hi">
                    Campus &amp; Cost Assumptions
                  </h3>
                </div>

                {/* Slider 1: Students */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <label htmlFor={studentsInputId} className="font-mono text-[11.5px] uppercase tracking-wider text-mid flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-accent" />
                        Enrolled Students
                      </label>
                      <span className="font-mono text-sm font-semibold text-hi px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                        {inputs.students.toLocaleString()}
                      </span>
                    </div>
                    <input
                      id={studentsInputId}
                      aria-label="Enrolled Students"
                      type="range"
                      min={250}
                      max={15000}
                      step={50}
                      value={inputs.students}
                      onChange={(e) => updateField("students", Number(e.target.value))}
                      className="w-full accent-accent h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                    {/* Slider 2: Faculty */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-sm">
                        <label htmlFor={teachersInputId} className="font-mono text-[11.5px] uppercase tracking-wider text-mid flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-spotify" />
                          Faculty / Teachers
                        </label>
                        <span className="font-mono text-sm font-semibold text-hi px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                          {inputs.teachers}
                        </span>
                      </div>
                      <input
                        id={teachersInputId}
                        aria-label="Faculty / Teachers"
                        type="range"
                        min={10}
                        max={600}
                        step={5}
                        value={inputs.teachers}
                        onChange={(e) => updateField("teachers", Number(e.target.value))}
                        className="w-full accent-spotify h-1.5 bg-white/10 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Slider 3: Classes Per Day */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-sm">
                          <label htmlFor={classesInputId} className="font-mono text-[11.5px] uppercase tracking-wider text-mid flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-accent2" />
                            Classes / Day per Faculty
                          </label>
                          <span className="font-mono text-sm font-semibold text-hi px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                            {inputs.classesPerDay}
                          </span>
                        </div>
                        <input
                          id={classesInputId}
                          aria-label="Classes / Day per Faculty"
                          type="range"
                          min={1}
                          max={8}
                          step={1}
                          value={inputs.classesPerDay}
                          onChange={(e) => updateField("classesPerDay", Number(e.target.value))}
                          className="w-full accent-accent2 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                        />
                        </div>

                        {/* Configurable Workflow & Financial Assumptions */}
                        <div className="pt-3 border-t border-white/[0.08] space-y-3">
                          <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">
                            Editable Workflow &amp; Cost Parameters
                          </p>

                          <div className="grid grid-cols-2 gap-3 text-[12px]">
                            <label className="space-y-1">
                              <span className="font-mono text-[10px] text-mid block">Teaching Days / Yr</span>
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={inputs.teachingDaysPerYear}
                                onChange={(e) => updateField("teachingDaysPerYear", Number(e.target.value))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-hi focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="font-mono text-[10px] text-mid block">Baseline Proxy Rate (%)</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                value={inputs.baselineProxyRatePct}
                                onChange={(e) => updateField("baselineProxyRatePct", Number(e.target.value))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-hi focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="font-mono text-[10px] text-mid block">Manual Roll Call (min)</span>
                              <input
                                type="number"
                                min={0}
                                max={30}
                                step={0.5}
                                value={inputs.manualMinutesPerClass}
                                onChange={(e) => updateField("manualMinutesPerClass", Number(e.target.value))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-hi focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="font-mono text-[10px] text-mid block">SmartFace Flow (min)</span>
                              <input
                                type="number"
                                min={0}
                                max={15}
                                step={0.5}
                                value={inputs.smartFaceMinutesPerClass}
                                onChange={(e) => updateField("smartFaceMinutesPerClass", Number(e.target.value))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-hi focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="font-mono text-[10px] text-mid block">Faculty Hour Value (₹)</span>
                              <input
                                type="number"
                                min={0}
                                step={50}
                                value={inputs.facultyHourlyCostInr}
                                onChange={(e) => updateField("facultyHourlyCostInr", Number(e.target.value))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-hi focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="font-mono text-[10px] text-mid block">Admin Savings / Yr (₹)</span>
                              <input
                                type="number"
                                min={0}
                                step={5000}
                                value={inputs.annualAdminProcessingCostInr}
                                onChange={(e) => updateField("annualAdminProcessingCostInr", Number(e.target.value))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-hi focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="font-mono text-[10px] text-mid block">Hardware Cost (₹)</span>
                              <input
                                type="number"
                                min={0}
                                step={10000}
                                value={inputs.hardwareCostInr}
                                onChange={(e) => updateField("hardwareCostInr", Number(e.target.value))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-hi focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="font-mono text-[10px] text-mid block">Installation Cost (₹)</span>
                              <input
                                type="number"
                                min={0}
                                step={5000}
                                value={inputs.installationCostInr}
                                onChange={(e) => updateField("installationCostInr", Number(e.target.value))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-hi focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="font-mono text-[10px] text-mid block">Subscription / Yr (₹)</span>
                              <input
                                type="number"
                                min={0}
                                step={10000}
                                value={inputs.subscriptionCostInr}
                                onChange={(e) => updateField("subscriptionCostInr", Number(e.target.value))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-hi focus:border-accent focus:outline-none"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="font-mono text-[10px] text-mid block">Maintenance / Yr (₹)</span>
                              <input
                                type="number"
                                min={0}
                                step={5000}
                                value={inputs.maintenanceCostInr}
                                onChange={(e) => updateField("maintenanceCostInr", Number(e.target.value))}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-hi focus:border-accent focus:outline-none"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[12px] text-faint leading-relaxed">
                          <p>
                            Note: Recovered faculty teaching time represents reallocated instructional hours rather than direct payroll reductions. Direct monetary savings come from reduced paper/admin processing.
                          </p>
                        </div>
                      </div>
                    </Reveal>

                    {/* Results Display (7 cols) */}
                    <Reveal className="lg:col-span-7" direction="up" delay={0.12}>
                      <div className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Metric 1: Teaching Hours Recovered */}
                          <SpotlightCard spotlightColor="rgba(143, 139, 255, 0.22)" className="p-6">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">
                                Est. Teaching Hours Recovered
                              </span>
                              <Clock className="h-4 w-4 text-accent" />
                            </div>
                            <div className="mt-3 font-display text-4xl font-semibold tracking-tight text-hi flex items-baseline gap-1.5">
                              <span>{result.annualTeachingHoursRecovered.toLocaleString()}</span>
                              <span className="text-lg font-normal text-mid">Hours / yr</span>
                            </div>
                            <p className="mt-2 text-[13px] text-mid">
                              {result.timeReductionPercent}% workflow reduction ({result.minutesSavedPerLecture} min saved per class across {result.totalLecturesPerYear.toLocaleString()} classes; ~{result.equivalentTeachingDays} 8-hr days).
                            </p>
                          </SpotlightCard>

                            {/* Metric 2: Gross vs Net Benefits & Costs */}
                            <SpotlightCard spotlightColor="rgba(111, 216, 255, 0.22)" className="p-6">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">
                                  Est. Gross Benefit vs. Year-1 Cost
                                </span>
                                <DollarSign className="h-4 w-4 text-accent2" />
                              </div>
                                <div className="mt-3 font-display text-4xl font-semibold tracking-tight text-hi flex items-baseline gap-1.5">
                                  <span>{formatInr(result.grossEstimatedBenefitsInr)}</span>
                                  <span className="text-lg font-normal text-mid">Gross / yr</span>
                                </div>
                                <p className="mt-2 text-[13px] text-mid">
                                  Staff time value: {formatInr(result.estimatedFacultyTimeValueInr)} + direct admin savings: {formatInr(result.estimatedAdminSavingsInr)}. Year-1 cost: {formatInr(result.yearOneTotalCostInr)}.
                                </p>
                            </SpotlightCard>

                              {/* Metric 3: Net Benefit, ROI & Payback */}
                              <SpotlightCard spotlightColor="rgba(30, 215, 96, 0.22)" className="p-6">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">
                                    Est. Year-1 Net Benefit &amp; ROI
                                  </span>
                                  <TrendingUp className="h-4 w-4 text-spotify" />
                                </div>
                                  <div className="mt-3 font-display text-4xl font-semibold tracking-tight text-spotify flex items-baseline gap-1.5">
                                    <span>{result.estimatedRoiPct}%</span>
                                    <span className="text-lg font-normal text-mid">Est. ROI</span>
                                  </div>
                                  <p className="mt-2 text-[13px] text-mid">
                                    Est. Year-1 Net: <span className="text-hi font-medium">{formatInr(result.netEstimatedBenefitsYear1Inr)}</span> · Est. payback:{" "}
                                    <span className="text-hi font-medium">
                                      {result.estimatedPaybackMonths !== null ? `${result.estimatedPaybackMonths} months` : "N/A"}
                                    </span>
                                    .
                                  </p>
                              </SpotlightCard>

                              {/* Metric 4: Proxy Exposure Addressed */}
                              <SpotlightCard spotlightColor="rgba(243, 198, 79, 0.22)" className="p-6">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint">
                                    Est. Proxy Check-Ins Addressed
                                  </span>
                                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                                </div>
                                <div className="mt-3 font-display text-4xl font-semibold tracking-tight text-amber-300 flex items-baseline gap-1.5">
                                  <span>{result.estimatedProxyCheckInsAddressed.toLocaleString()}</span>
                                  <span className="text-lg font-normal text-mid">/ yr</span>
                                </div>
                                <p className="mt-2 text-[13px] text-mid">
                                  Based on your {inputs.baselineProxyRatePct}% baseline proxy estimate, deterred via 20s rotating HMAC QR, geofencing, and face matching.
                                </p>
                              </SpotlightCard>
                            </div>

                            {/* Action Banner inside Calculator */}
                            <div className="card-bytune rounded-[22px] p-6 border border-white/10 bg-gradient-to-r from-accent/15 via-black/40 to-spotify/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div>
                                <h4 className="font-display text-base font-semibold text-hi">
                                  Validate these estimates with a controlled department pilot
                                </h4>
                                <p className="text-[13px] text-mid">
                                  Ongoing annual operating cost after Year 1: {formatInr(result.annualOperatingCostInr)}/yr (subscription + maintenance).
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
