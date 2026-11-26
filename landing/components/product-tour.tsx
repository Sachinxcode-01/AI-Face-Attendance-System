"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BrainCircuit,
  Building,
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  GraduationCap,
  Presentation,
  QrCode,
  Radio,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { SectionHeading } from "./ui/section-heading";

type TourTab =
  | "student"
  | "teacher"
  | "admin"
  | "parent"
  | "superadmin"
  | "attendance_flow"
  | "recognition_flow"
  | "ai_analytics";

export function ProductTour() {
  const [activeTab, setActiveTab] = useState<TourTab>("student");
  const [qrCounter, setQrCounter] = useState(20);

  useEffect(() => {
    const timer = setInterval(() => {
      setQrCounter((prev) => (prev <= 1 ? 20 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const roleTabs = [
    { id: "student", label: "Student", icon: GraduationCap },
    { id: "teacher", label: "Teacher", icon: Presentation },
    { id: "admin", label: "Admin Sentinel", icon: ShieldCheck },
    { id: "parent", label: "Parent", icon: Users },
    { id: "superadmin", label: "Super Admin", icon: Building },
  ];

  const workflowTabs = [
    { id: "attendance_flow", label: "Attendance Flow", icon: ScanFace },
    { id: "recognition_flow", label: "AI Vector Engine", icon: Cpu },
    { id: "ai_analytics", label: "Risk & Analytics", icon: BrainCircuit },
  ];

  return (
    <section
      id="product-tour"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32 lg:py-36 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(111,216,255,0.08),transparent)]"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Interactive Product Tour · Sample Data"
          title="Explore All Five Role Workflows — No Login Required"
          description="Illustrative walkthrough using synthetic sample data showing how SmartFace connects students, faculty, campus admins, parents, and multi-campus super admins."
        />

        {/* Tab Controls */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-full border border-white/10 bg-surface/90 backdrop-blur-md">
            <span className="hidden sm:inline-block px-3 font-mono text-[10.5px] uppercase tracking-wider text-faint">
              Stakeholders:
            </span>
            {roleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TourTab)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all cursor-pointer ${isActive
                    ? "bg-white text-black shadow-md font-semibold"
                    : "text-mid hover:text-hi hover:bg-white/[0.04]"
                    }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-black" : "text-accent"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-full border border-white/10 bg-white/[0.02]">
            <span className="hidden sm:inline-block px-3 font-mono text-[10.5px] uppercase tracking-wider text-faint">
              Technology &amp; AI:
            </span>
            {workflowTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TourTab)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-all cursor-pointer ${isActive
                    ? "border border-accent2/40 bg-accent2/15 text-accent2 shadow-[0_0_15px_rgba(111,216,255,0.2)] font-semibold"
                    : "text-mid hover:text-hi"
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tour Display Screen */}
        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28 }}
              className="card-bytune rounded-[24px] border border-white/10 bg-[#0e0e14]/95 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl"
            >
              {/* 1. STUDENT */}
              {activeTab === "student" && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 chip-bytune mb-2">
                        <GraduationCap className="h-3.5 w-3.5 text-accent" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-mid">
                          Simulated Preview · Student Web &amp; Flutter App
                        </span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                        Student Attendance, Streaks &amp; Nexa AI
                      </h3>
                      <p className="mt-1 text-[14px] text-mid">
                        Students check in via face or rotating QR, review attendance percentages computed deterministically, submit correction disputes, and ask Nexa AI for status summaries.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 font-mono text-[11px] text-emerald-300 flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span>Sample 14-Day Streak</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-4 p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                        Sample Aggregate Attendance
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-5xl font-semibold text-spotify">88.6%</span>
                        <span className="text-xs font-mono text-mid">Eligible (Policy: 75%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-accent to-spotify w-[88.6%]" />
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.08] space-y-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold block">
                          Nexa AI Sample Output (Deterministic Figures)
                        </span>
                        <p className="text-[12.5px] text-mid leading-relaxed">
                          &quot;Based on your recorded sessions, your current attendance is 88.6%. You can miss up to 3 upcoming classes in CS-401 while staying above the 75% threshold.&quot;
                        </p>
                      </div>
                    </div>

                    <div className="lg:col-span-8 p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                        Illustrative Course Schedule &amp; Check-In Log
                      </span>
                      {[
                        { time: "09:00 AM", subject: "CS-401 Design & Analysis of Algorithms", status: "Face Verified (0.86 cosine)", type: "done" },
                        { time: "11:15 AM", subject: "CS-405 Operating Systems Lab", status: "QR Verified (20s HMAC)", type: "done" },
                        { time: "02:00 PM", subject: "CS-408 Distributed Computing", status: "Upcoming Session", type: "pending" },
                      ].map((row, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-black/30 text-[13px]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-faint">{row.time}</span>
                            <span className="font-medium text-hi">{row.subject}</span>
                          </div>
                          <span
                          className = {`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${row.type === "pending"
                            ? "bg-white/5 text-mid"
                            : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                          }`}
                        >
                      {row.status}
                    </span>
                  </div>
                      ))}
                </div>
                </div>
        </div>
              )}

        {/* 2. TEACHER */}
        {activeTab === "teacher" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div>
                <div className="inline-flex items-center gap-2 chip-bytune mb-2">
                  <Presentation className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mid">
                    Simulated Preview · Teacher Portal
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                  Active Lecture Session &amp; Rotating QR
                </h3>
                <p className="mt-1 text-[14px] text-mid">
                  Start a lecture session, project a 20-second HMAC-SHA256 rotating QR code, monitor the live roster, approve leave requests, or override attendance.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spotify opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-spotify" />
                </span>
                <span className="font-mono text-[11px] text-spotify font-medium uppercase tracking-wider">
                  Simulated Session
                </span>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12 items-center">
              <div className="lg:col-span-5 p-6 rounded-2xl border border-white/10 bg-black/40 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 font-mono text-[11px] text-accent">
                  <QrCode className="h-3.5 w-3.5" />
                  <span>HMAC-SHA256 Token</span>
                </div>

                <div className="mx-auto w-44 h-44 rounded-xl border border-white/15 bg-white p-3 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="w-full h-full bg-[radial-gradient(#050507_2px,transparent_2px)] [background-size:12px_12px] opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanFace className="h-12 w-12 text-[#050507]" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 font-mono text-[12px] text-mid">
                  <Clock className="h-3.5 w-3.5 text-spotify" />
                  <span>Rotates every <span className="text-hi font-bold text-spotify">{qrCounter}s</span></span>
                  <span className="text-faint">(+5s skew tolerance)</span>
                </div>
              </div>

              <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display text-lg font-medium text-hi">
                      CS-401 Algorithms · Lecture Hall 3B (Sample)
                    </h4>
                    <p className="font-mono text-[11px] text-faint">Sample Faculty Roster · 60 Students</p>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-2xl font-bold text-spotify">54 / 60</span>
                    <span className="block font-mono text-[10px] text-faint uppercase">Present (90%)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { name: "Student Sample A", roll: "22CS001", time: "09:02:14 AM", status: "Face (0.86 cosine)" },
                    { name: "Student Sample B", roll: "22CS002", time: "09:02:18 AM", status: "Rotating QR" },
                    { name: "Student Sample C", roll: "22CS003", time: "09:03:01 AM", status: "Face (0.79 cosine)" },
                    { name: "Student Sample D", roll: "22CS004", time: "09:03:22 AM", status: "Manual Override" },
                  ].map((student, sIdx) => (
                    <div key={sIdx} className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.04] bg-white/[0.01] text-[12.5px]">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-faint">{student.roll}</span>
                        <span className="text-hi font-medium">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10.5px] text-faint">{student.time}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {student.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[12px] font-mono text-faint">Manual roster override &amp; CSV/Excel export built in</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ADMIN */}
        {activeTab === "admin" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div>
                <div className="inline-flex items-center gap-2 chip-bytune mb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mid">
                    Simulated Preview · Admin Sentinel
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                  Campus Telemetry, Security Logs &amp; Directory
                </h3>
                <p className="mt-1 text-[14px] text-mid">
                  Review department attendance analytics, manage user rosters and face dataset training, and inspect security and audit logs.
                </p>
              </div>

              <div className="px-3.5 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 font-mono text-[11px] text-amber-300 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-amber-400" />
                <span>Sample Telemetry View</span>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                  Sample Daily Check-Ins
                </span>
                <div className="mt-2 font-display text-3xl font-bold text-hi">1,240</div>
                <span className="mt-1 block font-mono text-[11px] text-spotify">Illustrative campus figure</span>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                  Recognition Engine
                </span>
                <div className="mt-2 font-display text-3xl font-bold text-accent">buffalo_l</div>
                <span className="mt-1 block font-mono text-[11px] text-mid">ONNX Runtime (CPU / CUDA)</span>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                  Audit &amp; Exports
                </span>
                <div className="mt-2 font-display text-3xl font-bold text-hi">CSV / Excel</div>
                <span className="mt-1 block font-mono text-[11px] text-emerald-400">JSON &amp; HTML reports</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-black/40 space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold block">
                Illustrative Terminal Fleet Status
              </span>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { gate: "North Gate Kiosk (Sample)", status: "Online", count: "480 sample check-ins", mode: "CUDA GPU" },
                  { gate: "CS Dept Podium (Sample)", status: "Online", count: "410 sample check-ins", mode: "Web / QR" },
                  { gate: "Library Entry (Sample)", status: "Online", count: "350 sample check-ins", mode: "RTSP Stream" },
                ].map((gate, gIdx) => (
                  <div key={gIdx} className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-hi">{gate.gate}</span>
                      <span className="text-spotify text-[10px] font-mono">● {gate.status}</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between text-xs font-mono text-mid">
                      <span>{gate.count}</span>
                      <span className="text-accent">{gate.mode}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. PARENT */}
        {activeTab === "parent" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div>
                <div className="inline-flex items-center gap-2 chip-bytune mb-2">
                  <Users className="h-3.5 w-3.5 text-accent2" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mid">
                    Simulated Preview · Parent Portal
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                  Linked Ward Attendance &amp; Leave Submissions
                </h3>
                <p className="mt-1 text-[14px] text-mid">
                  Parents link to enrolled wards (with student or admin confirmation), review attendance percentages and recent logs, and submit absence notices.
                </p>
              </div>

              <div className="px-3.5 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 font-mono text-[11px] text-sky-300">
                Sample Ward: Student A (Verified Link)
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-spotify font-semibold block">
                  Sample Email / SMS / Push Notification
                </span>

                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-[13.5px] text-hi space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
                    <span>SmartFace Notification (Sample)</span>
                    <span>09:02 AM</span>
                  </div>
                  <p className="leading-relaxed">
                    &quot;Sample notice: Your linked student checked in for <span className="font-semibold text-white">CS-401</span> at <span className="font-semibold text-white">09:02 AM</span>. Current overall attendance: <span className="text-emerald-400 font-semibold">88.6%</span>.&quot;
                  </p>
                </div>

                <div className="text-[12px] text-faint">
                  *SMS delivery requires configured institutional Twilio or MSG91 credentials; email and in-app notifications work out of the box when mailers are configured.
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold block">
                  Parent Absence Notice &amp; Leave Status
                </span>

                <div className="space-y-2.5 text-[13px]">
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
                    <div>
                      <span className="font-medium text-hi block">Medical Leave (Sample)</span>
                      <span className="text-xs text-faint font-mono">Submitted via /parent/child/absence-notice</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Approved
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
                    <div>
                      <span className="font-medium text-hi block">Correction Dispute (Sample)</span>
                      <span className="text-xs text-faint font-mono">Submitted for faculty review</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 text-mid border border-white/15">
                      Under Review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SUPER ADMIN */}
        {activeTab === "superadmin" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div>
                <div className="inline-flex items-center gap-2 chip-bytune mb-2">
                  <Building className="h-3.5 w-3.5 text-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-mid">
                    Simulated Preview · Super Admin Console
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                  Multi-Tenant Institutional Governance
                </h3>
                <p className="mt-1 text-[14px] text-mid">
                  Onboard and manage constituent colleges, provision institutional admin accounts, inspect global analytics, and monitor service health.
                </p>
              </div>

              <div className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] font-mono text-[11px] text-mid">
                /admin/super-admin
              </div>
            </div>

            <div className="space-y-3">
              {[
                { college: "Sample Engineering Campus (Tenant A)", students: "1,450 sample records", nodes: "4 configured gates", status: "Active · Standard/Enterprise" },
                { college: "Sample Science & Arts Campus (Tenant B)", students: "950 sample records", nodes: "2 configured gates", status: "Active · Pilot Evaluation" },
              ].map((inst, iIdx) => (
                <div key={iIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[13px]">
                  <div>
                    <span className="font-medium text-hi block">{inst.college}</span>
                    <span className="font-mono text-[11px] text-faint">{inst.students} · {inst.nodes}</span>
                  </div>
                  <span className="font-mono text-[11px] text-spotify bg-spotify/10 border border-spotify/20 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    {inst.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ATTENDANCE WORKFLOW */}
        {activeTab === "attendance_flow" && (
          <div className="space-y-8">
            <div className="border-b border-white/[0.08] pb-6">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent font-semibold block">
                Implemented Verification Pipeline
              </span>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
                From Camera Capture to Recorded Attendance
              </h3>
              <p className="mt-1 text-[14px] text-mid">
                Actual request path across the client, Express gateway, FastAPI AI service, and MongoDB ledger.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              {[
                { step: "01", title: "Capture & Upload", meta: "≤ 5 MB JPEG/PNG/WebP", desc: "Browser, mobile, or kiosk captures a frame and sends it over TLS to Express." },
                { step: "02", title: "Validation & Guard", meta: "Magic bytes + Rate limit", desc: "Express checks active session, duplicate lock, and forwards image bytes to FastAPI." },
                { step: "03", title: "ArcFace Extract", meta: "buffalo_l (ResNet-50)", desc: "RetinaFace detects 1 face; ArcFace computes an L2-normalized 512-D embedding." },
                { step: "04", title: "Cosine Match", meta: "Threshold ≥ 0.60", desc: "1:1 dot product against BiometricProfile (or 1:N legacy encodings fallback)." },
                { step: "05", title: "Commit & Purge", meta: "Audit + RAM clear", desc: "Attendance & audit log written to MongoDB; raw upload buffer cleared in memory." },
              ].map((step, sIdx) => (
                <div key={sIdx} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-accent font-bold">Step {step.step}</span>
                    <span className="font-mono text-[10px] text-spotify bg-spotify/10 px-2 py-0.5 rounded">{step.meta}</span>
                  </div>
                  <h4 className="font-display text-[15px] font-semibold text-hi">{step.title}</h4>
                  <p className="text-[12px] text-mid leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. VECTOR ENGINE */}
        {activeTab === "recognition_flow" && (
          <div className="space-y-8">
            <div className="border-b border-white/[0.08] pb-6">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent2 font-semibold block">
                Biometric Template Architecture
              </span>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
                512-Dimensional Embeddings vs. Raw Verification Frames
              </h3>
              <p className="mt-1 text-[14px] text-mid">
                Live verification compares normalized 512-D vectors and discards the verification upload buffer, while still protecting stored embeddings as sensitive biometric data.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                <h4 className="font-display text-lg font-medium text-hi">
                  Why We Avoid Storing Live Check-In Frames
                </h4>
                <ul className="space-y-2 text-[13px] text-red-300">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>Accumulating daily verification selfies increases breach exposure.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                    <span>Redundant photo archives complicate institutional retention compliance.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 space-y-4">
                <h4 className="font-display text-lg font-medium text-hi">
                  How SmartFace Handles Templates
                </h4>
                <ul className="space-y-2 text-[13px] text-emerald-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-spotify" />
                    <span>API enrollment &amp; live verify store only the 512-D float vector in MongoDB (`BiometricProfile`), clearing `image_bytes` after processing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-spotify" />
                    <span>Note: Batch dataset training (`data/dataset/`) and legacy intruder snapshots (`data/Intruders/`) store images locally only when explicitly used.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-spotify" />
                    <span>Users and admins can revoke consent and delete stored embeddings via `DELETE /auth/biometric`.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 8. ANALYTICS */}
        {activeTab === "ai_analytics" && (
          <div className="space-y-8">
            <div className="border-b border-white/[0.08] pb-6">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent font-semibold block">
                Deterministic Attendance Intelligence
              </span>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
                Exact Basis-Point Math + Explainable Risk Flags
              </h3>
              <p className="mt-1 text-[14px] text-mid">
                All attendance percentages, allowable absences, and shortage forecasts are computed deterministically in `attendanceCalculator.js`—never invented by an LLM.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <BrainCircuit className="h-5 w-5 text-accent" />
                <h4 className="font-display text-base font-semibold text-hi">
                  Rule-Based Risk Detection
                </h4>
                <p className="text-[12.5px] text-mid leading-relaxed">
                  Detects consecutive unexcused absences, declining recent-session trends, and subjects falling near or below the configured 75% threshold.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <TrendingUp className="h-5 w-5 text-spotify" />
                <h4 className="font-display text-base font-semibold text-hi">
                  What-If Forecast Simulator
                </h4>
                <p className="text-[12.5px] text-mid leading-relaxed">
                  Lets students simulate attending or missing upcoming classes and estimates consecutive classes needed to recover target eligibility.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
                <h4 className="font-display text-base font-semibold text-hi">
                  Accuracy &amp; Failure Telemetry
                </h4>
                <p className="text-[12.5px] text-mid leading-relaxed">
                  Tracks verification attempts, poor-lighting flags, occlusion failures, and security alerts for admin review.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
      </div >
    </div >
    </section >
  );
}
