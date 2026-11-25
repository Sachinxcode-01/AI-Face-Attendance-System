"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BrainCircuit,
  Building,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
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
  const [qrCounter, setQrCounter] = useState(24);
  const [qrCycle, setQrCycle] = useState(1);
  const [csvExported, setCsvExported] = useState(false);
  const reduceMotion = useReducedMotion();
  const tabRefs = useRef<Partial<Record<TourTab, HTMLButtonElement | null>>>({});

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, group: { id: string }[], index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + group.length) % group.length;
    const nextId = group[nextIndex].id as TourTab;
    setActiveTab(nextId);
    tabRefs.current[nextId]?.focus();
  };

  useEffect(() => {
    if (activeTab !== "teacher" || reduceMotion) return;
    const timer = setInterval(() => {
      setQrCounter((prev) => {
        if (prev <= 1) {
          setQrCycle((c) => c + 1);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTab, reduceMotion]);

  const qrCells = useMemo(() => {
    return Array.from({ length: 49 }, (_, idx) => {
      const r = Math.floor(idx / 7);
      const c = idx % 7;
      // Corner finder patterns (top-left, top-right, bottom-left)
      const isFinder = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
      if (isFinder) return true;
      // Leave center clear for ScanFace emblem
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return false;
      return ((idx * 17 + qrCycle * 31) % 5) < 3;
    });
  }, [qrCycle]);

  const handleExportCsv = () => {
    const csv = [
      "Roll,Student Name,Time,Verification Method",
      "22CS001,Aditya Nair,09:02:14 AM,Verified Face (0.96)",
      "22CS002,Bhavya Reddy,09:02:18 AM,Verified QR",
      "22CS003,Chetan Deshmukh,09:03:01 AM,Verified Face (0.94)",
      "22CS004,Divya Hegde,09:03:22 AM,Manual Override (Medical)",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "CS-401_attendance_sample.csv";
    link.click();
    URL.revokeObjectURL(url);
    setCsvExported(true);
    window.setTimeout(() => setCsvExported(false), 2500);
  };

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
    { id: "ai_analytics", label: "Predictive Analytics", icon: BrainCircuit },
  ];

  return (
    <section
      id="product-tour"
      className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-32 lg:py-36 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(111,216,255,0.08),transparent)]"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Interactive Guided Tour"
          title="Experience the Complete Platform — No Login Required"
          description="Explore the unified interfaces built for every stakeholder, from gate kiosks and teacher podiums to parent notifications and predictive dropout analytics."
        />

        {/* Tab Controls */}
        <div className="mt-12 flex flex-col items-center gap-4">
          {/* Role Navigation */}
          <div
            role="tablist"
            aria-label="Stakeholder dashboards"
            className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full border border-white/10 bg-surface/90 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
          >
            <span className="hidden sm:inline-block px-3 font-mono text-[10.5px] uppercase tracking-wider text-faint">
              Stakeholders:
            </span>
              {
                roleTabs.map((tab, idx) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const groupHasActive = roleTabs.some((t) => t.id === activeTab);
                  const isFocusable = isActive || (!groupHasActive && idx === 0);
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => { tabRefs.current[tab.id as TourTab] = el; }}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls="tour-panel"
                      tabIndex={isFocusable ? 0 : -1}
                      onClick={() => setActiveTab(tab.id as TourTab)}
                      onKeyDown={(e) => handleTabKeyDown(e, roleTabs, idx)}
                      className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-colors cursor-pointer ${isActive
                          ? "text-black font-semibold"
                          : "text-mid font-medium hover:text-hi hover:bg-white/[0.04]"
                        }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="tour-role-pill"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          className="absolute inset-0 rounded-full bg-white shadow-md"
                          aria-hidden="true"
                        />
                      )}
                      <Icon className={`relative z-10 h-3.5 w-3.5 ${isActive ? "text-black" : "text-accent"}`} />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })
              }
          </div>

          {/* Workflow & Engine Navigation */}
          <div
            role="tablist"
            aria-label="Technology and AI architecture"
            className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full border border-white/10 bg-white/[0.02]"
          >
            <span className="hidden sm:inline-block px-3 font-mono text-[10.5px] uppercase tracking-wider text-faint">
              Technology & AI:
            </span>
              {
                workflowTabs.map((tab, idx) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const groupHasActive = workflowTabs.some((t) => t.id === activeTab);
                  const isFocusable = isActive || (!groupHasActive && idx === 0);
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => { tabRefs.current[tab.id as TourTab] = el; }}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls="tour-panel"
                      tabIndex={isFocusable ? 0 : -1}
                      onClick={() => setActiveTab(tab.id as TourTab)}
                      onKeyDown={(e) => handleTabKeyDown(e, workflowTabs, idx)}
                      className={`relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12.5px] transition-colors cursor-pointer ${isActive
                          ? "text-accent2 font-semibold"
                          : "text-mid font-medium hover:text-hi"
                        }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="tour-workflow-pill"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          className="absolute inset-0 rounded-full border border-accent2/40 bg-accent2/15 shadow-[0_0_15px_rgba(111,216,255,0.2)]"
                          aria-hidden="true"
                        />
                      )}
                      <Icon className="relative z-10 h-3.5 w-3.5" />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })
              }
          </div>
        </div>

        {/* Tour Display Screen with ByTune Floating Glass Card */}
        <div id="tour-panel" role="tabpanel" className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28 }}
              className="card-bytune rounded-[24px] border border-white/10 bg-[#0e0e14]/95 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl"
            >
              {/* ========================================================= */}
              {/* 1. STUDENT DASHBOARD TOUR */}
              {/* ========================================================= */}
              {activeTab === "student" && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 chip-bytune mb-2">
                        <GraduationCap className="h-3.5 w-3.5 text-accent" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-mid">
                          Student Experience · Mobile & Web
                        </span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                        Student Attendance, Streaks & Nexa AI
                      </h3>
                      <p className="mt-1 text-[14px] text-mid">
                        Students view verified attendance timestamps, maintain streaks, and ask Nexa AI where they stand before exams.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 font-mono text-[11px] text-emerald-300 flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span>24-Day Streak</span>
                      </div>
                    </div>
                  </div>

                  {/* Mock Interface */}
                  <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-4 p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                        Aggregate Attendance
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-5xl font-semibold text-spotify">91.4%</span>
                        <span className="text-xs font-mono text-mid">Safe (Threshold: 75%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "91.4%" }}
                          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full bg-gradient-to-r from-accent to-spotify"
                        />
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/[0.08] space-y-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold block">
                          Nexa AI Advice
                        </span>
                        <p className="text-[12.5px] text-mid leading-relaxed">
                          "You can safely miss up to 3 lectures in Discrete Mathematics while remaining above the 85% college honor criteria."
                        </p>
                      </div>
                    </div>

                    <div className="lg:col-span-8 p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                        Today's Course Schedule & Gate Verification
                      </span>
                      {[
                        { time: "08:42 AM", subject: "Campus Main Gate #2", status: "Verified Touchless Face (99.8%)", type: "gate" },
                        { time: "09:00 AM", subject: "CS-401 Design & Analysis of Algorithms", status: "Verified Rotating QR (PODIUM-A)", type: "lecture" },
                        { time: "11:15 AM", subject: "CS-405 Operating Systems Lab", status: "Verified Kiosk K-04", type: "lecture" },
                        { time: "02:00 PM", subject: "CS-408 Distributed Computing", status: "Upcoming Session", type: "pending" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-black/30 text-[13px]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-faint">{item.time}</span>
                            <span className="font-medium text-hi">{item.subject}</span>
                          </div>
                          <span
                            className={`font-mono text-[10.5px] px-2.5 py-0.5 rounded-full ${item.type === "pending"
                              ? "bg-white/5 text-mid"
                              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                              }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 2. TEACHER DASHBOARD TOUR */}
              {/* ========================================================= */}
              {activeTab === "teacher" && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 chip-bytune mb-2">
                        <Presentation className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-mid">
                          Teacher Command Center · Section Management
                        </span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                        Active Lecture Session & Anti-Proxy QR
                      </h3>
                      <p className="mt-1 text-[14px] text-mid">
                        Open a session in one tap, project the cryptographic rotating QR code, and inspect the real-time class roster.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spotify opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-spotify" />
                      </span>
                      <span className="font-mono text-[11px] text-spotify font-medium uppercase tracking-wider">
                        Live Lecture Active
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-12 items-center">
                    {/* Rotating QR Simulator */}
                    <div className="lg:col-span-5 p-6 rounded-2xl border border-white/10 bg-black/40 text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 font-mono text-[11px] text-accent">
                        <QrCode className="h-3.5 w-3.5" />
                        <span>HMAC-SHA256 Token</span>
                      </div>

                      {/* Dynamic QR Matrix with rotation countdown */}
                      <div className="mx-auto w-44 h-44 rounded-xl border border-white/15 bg-white p-3.5 flex items-center justify-center shadow-lg relative overflow-hidden">
                        <div className="grid grid-cols-7 gap-1 w-full h-full">
                          {qrCells.map((filled, idx) => (
                            <span
                              key={idx}
                              className={`rounded-[2px] transition-colors duration-300 ${filled ? "bg-[#050507]" : "bg-transparent"
                                }`}
                            />
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-lg bg-white/95 p-1.5 shadow-sm">
                            <ScanFace className="h-9 w-9 text-[#050507]" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 font-mono text-[12px] text-mid">
                        <Clock className="h-3.5 w-3.5 text-spotify" />
                        <span>
                          Rotates in{" "}
                          <span className="tabular-nums font-bold text-spotify">{qrCounter}s</span>
                        </span>
                        <span className="text-faint">·</span>
                        <span className="text-[11px] text-accent">
                          #{(0x4a2f + qrCycle * 197).toString(16).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Live Roster Status */}
                    <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-display text-lg font-medium text-hi">
                            CS-401 Algorithms · Lecture Hall 3B
                          </h4>
                          <p className="font-mono text-[11px] text-faint">Prof. K. Venkatesh · 60 Registered Students</p>
                        </div>
                        <div className="text-right">
                          <span className="font-display text-2xl font-bold text-spotify">54 / 60</span>
                          <span className="block font-mono text-[10px] text-faint uppercase">Present (90%)</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[
                          { name: "Aditya Nair", roll: "22CS001", time: "09:02:14 AM", status: "Verified Face (0.96)" },
                          { name: "Bhavya Reddy", roll: "22CS002", time: "09:02:18 AM", status: "Verified QR" },
                          { name: "Chetan Deshmukh", roll: "22CS003", time: "09:03:01 AM", status: "Verified Face (0.94)" },
                          { name: "Divya Hegde", roll: "22CS004", time: "09:03:22 AM", status: "Manual Override (Medical)" },
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

                      <div className="pt-2 flex items-center justify-between gap-3">
                        <span className="text-[12px] font-mono text-faint">Manual roster override available anytime</span>
                        <button
                          type="button"
                          onClick={handleExportCsv}
                          className="btn-pill-glass h-8 px-3.5 text-[11px] font-mono text-hi inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {csvExported ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-spotify" />
                              <span className="text-spotify">Exported CSV</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5 text-accent" />
                              <span>Export Attendance CSV</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 3. ADMIN DASHBOARD TOUR */}
              {/* ========================================================= */}
              {activeTab === "admin" && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 chip-bytune mb-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-mid">
                          Admin Sentinel · Institutional Command Center
                        </span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                        Campus Telemetry & Intrusion Sentinel
                      </h3>
                      <p className="mt-1 text-[14px] text-mid">
                        Real-time gate transit heatmaps, edge kiosk health monitoring, and automated intruder / proxy alerts.
                      </p>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 font-mono text-[11px] text-amber-300 flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-amber-400" />
                      <span>8 Nodes Active · 0 Lost Punches</span>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                        Today's Campus Verifications
                      </span>
                      <div className="mt-2 font-display text-3xl font-bold text-hi">4,286</div>
                      <span className="mt-1 block font-mono text-[11px] text-spotify">99.8% precision rate</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                        Average Edge Inference Latency
                      </span>
                      <div className="mt-2 font-display text-3xl font-bold text-accent">188ms</div>
                      <span className="mt-1 block font-mono text-[11px] text-mid">ONNX Runtime INT8</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint block">
                        Tamper-Evident Audit Records
                      </span>
                      <div className="mt-2 font-display text-3xl font-bold text-hi">100% Defensible</div>
                      <span className="mt-1 block font-mono text-[11px] text-emerald-400">NAAC / NBA Export Ready</span>
                    </div>
                  </div>

                  {/* Gate Telemetry Stream */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-black/40 space-y-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold block">
                      Live Gate Fleet Telemetry
                    </span>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { gate: "North Main Turnstiles", status: "Online (Edge)", count: "1,840 check-ins", latency: "162ms" },
                        { gate: "Engineering Quad Kiosk", status: "Online (Edge)", count: "1,420 check-ins", latency: "194ms" },
                        { gate: "Library East Gateway", status: "Online (Edge)", count: "1,026 check-ins", latency: "178ms" },
                      ].map((gate, gIdx) => (
                        <div key={gIdx} className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-hi">{gate.gate}</span>
                            <span className="text-spotify text-[10px] font-mono">● {gate.status}</span>
                          </div>
                          <div className="mt-3 flex items-baseline justify-between text-xs font-mono text-mid">
                            <span>{gate.count}</span>
                            <span className="text-accent">{gate.latency}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 4. PARENT DASHBOARD TOUR */}
              {/* ========================================================= */}
              {activeTab === "parent" && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 chip-bytune mb-2">
                        <Users className="h-3.5 w-3.5 text-accent2" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-mid">
                          Parent Portal · Safety & Daily Transparency
                        </span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                        Instant Arrival Alerts & Attendance Peace of Mind
                      </h3>
                      <p className="mt-1 text-[14px] text-mid">
                        Parents receive real-time gate entry timestamps on mobile and submit leave requests directly without phone calls.
                      </p>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 font-mono text-[11px] text-sky-300">
                      Child: Priya Sharma (2nd Year B.Tech)
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Push Notification Card */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-spotify font-semibold block">
                        Simulated WhatsApp / SMS Alert
                      </span>

                      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-[13.5px] text-hi space-y-2">
                        <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
                          <span>SmartFace Automated Campus Notification</span>
                          <span>08:42 AM</span>
                        </div>
                        <p className="leading-relaxed">
                          "Dear Mrs. Sharma, your ward Priya Sharma has checked in through <span className="font-semibold text-white">Campus Gate #2 (Main Entrance)</span> at <span className="font-semibold text-white">08:42:12 AM</span>. Current monthly attendance: <span className="text-emerald-400 font-semibold">94.2%</span>."
                        </p>
                      </div>

                      <div className="text-[12px] text-faint">
                        *Dispatched via authorized collegiate SMS / WhatsApp API gateway.
                      </div>
                    </div>

                    {/* Leave Request Flow */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-accent font-semibold block">
                        Parent Leave Submission & Approvals
                      </span>

                      <div className="space-y-2.5 text-[13px]">
                        <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
                          <div>
                            <span className="font-medium text-hi block">Medical Leave (Feb 14 - 15)</span>
                            <span className="text-xs text-faint font-mono">Attached: Clinic Medical Certificate.pdf</span>
                          </div>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Approved by HOD
                          </span>
                        </div>

                        <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
                          <div>
                            <span className="font-medium text-hi block">Inter-College Sports Meet (Jan 22)</span>
                            <span className="text-xs text-faint font-mono">Sports Committee On-Duty Credit</span>
                          </div>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Credited (OD)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 5. SUPER ADMIN TOUR */}
              {/* ========================================================= */}
              {activeTab === "superadmin" && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                    <div>
                      <div className="inline-flex items-center gap-2 chip-bytune mb-2">
                        <Building className="h-3.5 w-3.5 text-accent" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-mid">
                          Super Admin Console · Multi-Campus Management
                        </span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl font-medium text-hi">
                        Multi-Tenant University Governance
                      </h3>
                      <p className="mt-1 text-[14px] text-mid">
                        Oversee multiple constituent colleges, provision edge kiosk licenses, and configure institutional SSO.
                      </p>
                    </div>

                    <div className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] font-mono text-[11px] text-mid">
                      University Trust Admin Mode
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { college: "Institute of Technology (Main Campus)", students: "4,500 students", nodes: "8 Edge Kiosks", status: "Active · 99.8% precision" },
                      { college: "College of Pharmacy & Life Sciences", students: "1,200 students", nodes: "3 Edge Kiosks", status: "Active · 99.9% precision" },
                      { college: "School of Management Studies", students: "950 students", nodes: "2 Edge Kiosks", status: "Active · 99.7% precision" },
                      { college: "Polytechnic & Skill Development Campus", students: "2,200 students", nodes: "5 Edge Kiosks", status: "Active · Offline buffer enabled" },
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

              {/* ========================================================= */}
              {/* 6. ATTENDANCE WORKFLOW TOUR */}
              {/* ========================================================= */}
              {activeTab === "attendance_flow" && (
                <div className="space-y-8">
                  <div className="border-b border-white/[0.08] pb-6">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent font-semibold block">
                      Sub-300ms Pipeline Architecture
                    </span>
                    <h3 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
                      From Face Scan to Immutable Record in 280ms
                    </h3>
                    <p className="mt-1 text-[14px] text-mid">
                      Step-by-step telemetry of what occurs during a single touchless gate transit.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-5">
                    {[
                      { step: "01", title: "Frame Capture", latency: "~40ms", desc: "Standard IP/webcam captures face ROI in volatile memory." },
                      { step: "02", title: "Landmark Mesh", latency: "~50ms", desc: "68 facial points aligned to normalize tilt, yaw, and lighting." },
                      { step: "03", title: "ArcFace INT8", latency: "~110ms", desc: "On-device ONNX model extracts 512-dim mathematical vector." },
                      { step: "04", title: "Cosine Match", latency: "~30ms", desc: "Vector compared against enrolled cohort embeddings (0.94 threshold)." },
                      { step: "05", title: "Audit Sync", latency: "~50ms", desc: "Timestamp recorded to local WAL queue & instant UI confirmation." },
                    ].map((step, sIdx) => (
                      <div key={sIdx} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-accent font-bold">Step {step.step}</span>
                          <span className="font-mono text-[10px] text-spotify bg-spotify/10 px-2 py-0.5 rounded">{step.latency}</span>
                        </div>
                        <h4 className="font-display text-[15px] font-semibold text-hi">{step.title}</h4>
                        <p className="text-[12px] text-mid leading-relaxed">{step.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 text-[13px] text-mid flex items-center justify-between">
                    <span>Total Latency: <span className="font-bold text-hi font-mono">280ms</span> (under 300ms limit). Raw camera frame is purged from volatile memory at Step 3.</span>
                    <span className="font-mono text-xs text-accent font-semibold">Zero Photos Retained</span>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 7. FACE RECOGNITION AI VECTOR ENGINE */}
              {/* ========================================================= */}
              {activeTab === "recognition_flow" && (
                <div className="space-y-8">
                  <div className="border-b border-white/[0.08] pb-6">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent2 font-semibold block">
                      Mathematical Irreversibility
                    </span>
                    <h3 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
                      512-Dimensional Vector Mathematics vs. Photo Storage
                    </h3>
                    <p className="mt-1 text-[14px] text-mid">
                      Why SmartFace is legally defensible under global biometric privacy legislation: we store coordinates, never faces.
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                      <h4 className="font-display text-lg font-medium text-hi">
                        What Traditional Biometrics Do (Risky)
                      </h4>
                      <ul className="space-y-2 text-[13px] text-red-300">
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                          <span>Store unencrypted photos or JPEGs on cloud databases.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                          <span>Vulnerable to identity theft and data leak breaches.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                          <span>Violates modern student data protection laws (FERPA, DPDP Act).</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 space-y-4">
                      <h4 className="font-display text-lg font-medium text-hi">
                        What SmartFace Does (Zero-Photo Privacy)
                      </h4>
                      <ul className="space-y-2 text-[13px] text-emerald-300">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-spotify" />
                          <span>Translates facial points into a 512-dim float32 vector embedding.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-spotify" />
                          <span>Protected vector representation governed by strict access controls and retention policies.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-spotify" />
                          <span>100% compliant with privacy mandates and university safety boards.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 8. AI ANALYTICS & PREDICTIVE RETENTION */}
              {/* ========================================================= */}
              {activeTab === "ai_analytics" && (
                <div className="space-y-8">
                  <div className="border-b border-white/[0.08] pb-6">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-accent font-semibold block">
                      Predictive Institutional Intelligence
                    </span>
                    <h3 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-hi">
                      Catch Student Dropouts 3 Weeks Before Exams
                    </h3>
                    <p className="mt-1 text-[14px] text-mid">
                      SmartFace AI analyzes temporal attendance trajectories to identify disengaged students, bottlenecked class gates, and faculty teaching load anomalies.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                      <BrainCircuit className="h-5 w-5 text-accent" />
                      <h4 className="font-display text-base font-semibold text-hi">
                        At-Risk Retention Predictor
                      </h4>
                      <p className="text-[12.5px] text-mid leading-relaxed">
                        Flags subtle attendance decay (e.g., missing consecutive Friday lectures) triggering automated academic counselor alerts before the student falls below statutory criteria.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                      <TrendingUp className="h-5 w-5 text-spotify" />
                      <h4 className="font-display text-base font-semibold text-hi">
                        Campus Transit Heatmaps
                      </h4>
                      <p className="text-[12.5px] text-mid leading-relaxed">
                        Visualizes gate transit flow peaks across morning intervals (8:30 - 9:00 AM) to guide campus security staffing and timetable interval staggering.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                      <ShieldAlert className="h-5 w-5 text-amber-400" />
                      <h4 className="font-display text-base font-semibold text-hi">
                        Proxy Anomaly Forensics
                      </h4>
                      <p className="text-[12.5px] text-mid leading-relaxed">
                        Identifies impossible geographic punches (e.g. check-ins at two distant campus buildings within 2 minutes) and quarantines fraudulent entries for review.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
