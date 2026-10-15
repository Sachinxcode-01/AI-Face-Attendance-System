'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { ApkDownloadHero } from '@/components/download/ApkDownloadHero';
import { DashboardCard } from '@/components/portal/ui-helpers';
import { 
  ArrowRight, 
  Play, 
  Sparkles, 
  Check, 
  QrCode, 
  User, 
  GraduationCap, 
  Settings, 
  ShieldCheck, 
  ShieldAlert, 
  Bell, 
  FileSpreadsheet, 
  Download, 
  Database, 
  Users, 
  Calendar, 
  FileText, 
  RefreshCw, 
  Terminal, 
  Lock, 
  Clock, 
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically load client-only 3D modules to prevent Next.js SSR compilation errors
const NetworkBackground = dynamic(() => import('@/components/network-bg'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-950 -z-10" />
});

const CoreAiEngine = dynamic(() => import('@/components/core-ai-engine'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center text-slate-500 font-mono text-xs">
      Loading AI Neural Grid...
    </div>
  )
});

const TechStackOrbit = dynamic(() => import('@/components/tech-stack-orbit'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center text-slate-500 font-mono text-xs">
      Loading Tech Orbit...
    </div>
  )
});

const MobilePhoneCanvas = dynamic(() => import('@/components/mobile-phone-canvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center text-slate-500 font-mono text-xs">
      Loading Phone Hardware...
    </div>
  )
});

const HeroVideo = dynamic(() => import('@/components/hero-video'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center text-slate-500 font-mono text-xs">
      Loading Biometric Video Feed...
    </div>
  )
});

export default function Home() {
  // Navigation scrolling ref
  const featuresRef = useRef<HTMLDivElement>(null);

  // Active feature tab category
  const [activeFeatureTab, setActiveFeatureTab] = useState<'attendance' | 'student' | 'parent' | 'teacher' | 'admin'>('attendance');
  
  // Interactive Report Generator simulation states
  const [reportType, setReportType] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [reportTarget, setReportTarget] = useState<'students' | 'teachers' | 'departments' | 'institution'>('students');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Live WebSocket simulation logs state
  const [liveLogs, setLiveLogs] = useState([
    { id: 1, time: '10:02:15 AM', type: 'info', msg: 'Uvicorn FastAPI server socket initialized on port 8000.' },
    { id: 2, time: '10:02:18 AM', type: 'info', msg: 'MongoDB Atlas primary cluster connected successfully.' },
    { id: 3, time: '10:02:20 AM', type: 'success', msg: 'Attendance broadcast channel connected over ws://.' }
  ]);

  // Dynamic QR state for workflow preview
  const [qrCodeToken, setQrCodeToken] = useState('QR_6a360_8461');
  const [qrTimeLeft, setQrTimeLeft] = useState(5);

  // Stepper active index in attendance workflow
  const [activeStep, setActiveStep] = useState(0);

  // QR rotation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setQrTimeLeft((prev) => {
        if (prev <= 1) {
          setQrCodeToken(`QR_${Math.random().toString(36).substring(2, 7)}_${Math.floor(1000 + Math.random() * 9000)}`);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Workflow stepper simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 7);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // WebSockets live log generator simulation
  useEffect(() => {
    const logsPool = [
      { type: 'success', msg: 'Face Scanned: Alice Cooper (student@smartface.pro) - Match: 99.8%' },
      { type: 'success', msg: 'Attendance verified: CS-402 (Distributed Algorithms) - Sheet Sync Complete.' },
      { type: 'success', msg: 'Face Scanned: Bob Cooper (bob_student@smartface.pro) - Match: 99.4%' },
      { type: 'info', msg: 'Rotating time-drift token: New active QR broadcast updated on Teacher Console.' },
      { type: 'warning', msg: 'Tardy Warning: Sachin Kumar arrived late. Session timer exceed threshold.' },
      { type: 'security', msg: 'CRITICAL SECURITY FLAG: Unidentified face lingering at Classroom B Entrance.' },
      { type: 'info', msg: 'Intruder sentinel captured frame: data/Intruders/flag_0953.jpg uploaded.' },
      { type: 'warning', msg: 'SMTP Dispatch: Supervisor email alert triggered for security breach.' }
    ];

    const interval = setInterval(() => {
      const randomLog = logsPool[Math.floor(Math.random() * logsPool.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      
      setLiveLogs(prev => [
        ...prev.slice(-12), // keep last 12 items
        { id: Date.now(), time: timeStr, type: randomLog.type, msg: randomLog.msg }
      ]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Handle mock report export
  const triggerExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);
    setExportProgress(0);
    
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setExportSuccess(true);
          setTimeout(() => setExportSuccess(false), 3000);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden font-sans">
      
      {/* 3D Neural network background */}
      <NetworkBackground />

      {/* Floating Header */}
      <Navbar />

      {/* ──────────────────────────────────────────────────────── HERO SECTION ── */}
      <main className="relative pt-32 md:pt-40 lg:pt-48 pb-16">
        
        {/* Glowing backdrop spotlight */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] md:w-[650px] md:h-[650px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
        
        <div className="w-full max-w-7xl px-6 md:px-8 mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 flex flex-col items-start text-left">
            
            {/* Tagline Announcement - 21st Lime Frost Theme */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#aff33e]/10 border border-[#aff33e]/30 text-xs font-medium text-[#aff33e] shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-[#aff33e] animate-pulse" />
              <span className="font-mono text-[11px] text-slate-200">v2.4 Enterprise Release</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-[#aff33e] font-semibold">ArcFace 512D Biometrics</span>
            </motion.div>

            {/* Hero Typography Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.08] font-sans"
            >
              Autonomous Campus Attendance.{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#aff33e] via-emerald-300 to-teal-200">
                Engineered for Absolute Precision.
              </span>
            </motion.h1>

            {/* Hero Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl"
            >
              Zero buddy-punching. Sub-second face matching, rotating anti-proxy QR codes, and tamper-proof real-time audit trails designed for modern universities and institutions.
            </motion.p>

            {/* Quick Metrics Strip */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
              className="grid grid-cols-3 gap-3 pt-1 pb-1 w-full max-w-md"
            >
              <div className="p-2.5 rounded-xl bg-white/3 border border-white/6 backdrop-blur-sm">
                <div className="text-base sm:text-lg font-bold text-white font-mono">&lt; 300ms</div>
                <div className="text-[10px] text-slate-400">Match Latency</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/3 border border-white/6 backdrop-blur-sm">
                <div className="text-base sm:text-lg font-bold text-[#aff33e] font-mono">99.87%</div>
                <div className="text-[10px] text-slate-400">Model Accuracy</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/3 border border-white/6 backdrop-blur-sm">
                <div className="text-base sm:text-lg font-bold text-teal-300 font-mono">0%</div>
                <div className="text-[10px] text-slate-400">Proxy Tolerance</div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto z-20 pt-2"
            >
              <Link
                href="/login"
                className="w-full sm:w-auto relative inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold rounded-2xl bg-[#aff33e] hover:bg-[#9de32f] text-slate-950 border border-[#aff33e]/30 overflow-hidden shadow-[0_0_25px_rgba(175,243,62,0.3)] hover:shadow-[0_0_35px_rgba(175,243,62,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <span>Launch Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="/download"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold text-white bg-slate-900/90 border border-white/10 hover:bg-slate-800 rounded-2xl transition-all duration-300"
              >
                <Download className="w-3.5 h-3.5 text-[#aff33e]" />
                <span>Download App</span>
              </Link>

              <button
                onClick={scrollToFeatures}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl backdrop-blur-sm transition-all duration-300 cursor-pointer"
              >
                <span>Explore Architecture</span>
              </button>
            </motion.div>
          </div>

          {/* Right Video Visual Column */}
          <div className="lg:col-span-5 flex justify-center items-center min-h-[440px] relative">
            <HeroVideo />
          </div>

        </div>
      </main>

      {/* ──────────────────────────────────────────────────────── TRUST SECTION ── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-10 mx-auto relative z-10">
        <div className="p-1 px-2 md:p-3 md:px-6 bg-slate-950/40 border border-white/5 rounded-3xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
          
          <div className="text-center mb-6 mt-4">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.25em] font-bold">
              PLATFORM TRUST GUARANTEE
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4">
            {[
              "Real-Time Attendance Tracking",
              "Dynamic QR Attendance Verification",
              "Multi-Role Access Control",
              "AI Analytics & Reports",
              "Live Notification System",
              "Secure Authentication"
            ].map((metric, idx) => (
              <DashboardCard 
                key={idx} 
                glow={idx % 2 === 0} 
                floating={idx % 3 === 0}
                delay={idx * 100}
                className="flex items-center gap-2.5 p-4"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-300 font-sans tracking-wide">
                  {metric}
                </span>
              </DashboardCard>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── FEATURES SECTION ──── */}
      <section ref={featuresRef} id="features" className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.3em] font-mono text-primary uppercase block mb-1 font-bold">
            FEATURES CATALOGUE
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
            Platform Capabilities
          </h2>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto text-xs md:text-sm">
            Explore dedicated, deeply integrated modules customized for every stakeholder in the educational lifecycle.
          </p>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex justify-center mb-10">
          <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-900/60 border border-white/5 rounded-2xl backdrop-blur-md max-w-full">
            {(
              [
                { id: 'attendance', name: 'Attendance Management', icon: QrCode },
                { id: 'student', name: 'Student Portal', icon: User },
                { id: 'parent', name: 'Parent Portal', icon: Users },
                { id: 'teacher', name: 'Teacher Portal', icon: GraduationCap },
                { id: 'admin', name: 'Admin Portal', icon: Settings },
              ] as const
            ).map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 ${
                    activeFeatureTab === tab.id
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Dashboard Preview Container */}
        <div className="w-full min-h-[420px] rounded-3xl glass-panel glow-border p-6 md:p-10 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 cyber-grid opacity-5 pointer-events-none -z-10" />

          <AnimatePresence mode="wait">
            
            {/* ATTENDANCE MANAGEMENT TAB */}
            {activeFeatureTab === 'attendance' && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] tracking-[0.2em] font-mono text-primary uppercase block font-bold">
                      CORE CAPABILITY
                    </span>
                    <h3 className="text-xl md:text-3xl font-extrabold text-white font-sans uppercase">
                      Biometric & Anti-Proxy Attendance
                    </h3>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                      Our signature system combines lightning-fast facial matching with location-locked token rotation. Say goodbye to manual sheets and student proxy check-ins.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: "Dynamic QR Attendance", desc: "Short-lived tokens rotating to block screenshot shares." },
                      { title: "Attendance Verification", desc: "Automatic access control checks matching classroom coordinates." },
                      { title: "Attendance History", desc: "Detailed, search-friendly ledgers with instant filter settings." },
                      { title: "Attendance Calendar", desc: "Month-view calendars marking presence status flags." },
                      { title: "Attendance Heatmaps", desc: "Grid visualizations mapping daily compliance densities." },
                      { title: "Attendance Analytics", desc: "Real-time compliance ratios per student or department." },
                      { title: "Attendance Trends", desc: "Predictive tracking showing drop-off risks early." },
                      { title: "Attendance Reports", desc: "Automatic PDF/Excel downloads ready for administrative audit." }
                    ].map((feat, idx) => (
                      <div key={idx} className="space-y-1 p-3 rounded-xl bg-white/5 border border-white/5">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feat.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Visual Card */}
                <div className="lg:col-span-6 flex flex-col justify-center items-center p-6 bg-slate-900/60 border border-white/5 rounded-2xl text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent blur-md" />
                  
                  <div className="relative w-40 h-40 border border-white/10 rounded-2xl flex items-center justify-center mb-4 overflow-hidden bg-slate-950/80">
                    <QrCode className="w-20 h-20 text-primary animate-pulse" />
                    {/* Scanline Sweep bar */}
                    <div className="absolute inset-x-0 h-[2px] bg-primary shadow-[0_0_10px_#2563EB] animate-laser" />
                  </div>
                  
                  <span className="text-[10px] font-mono text-emerald-400 block tracking-widest font-bold">
                    ANTI-PROXY QR DEPLOYED
                  </span>
                  <p className="text-[11px] text-slate-400 font-sans max-w-[280px] mt-1.5">
                    Secures classrooms with unique tokens verifying real-time, physical student presence.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STUDENT PORTAL TAB */}
            {activeFeatureTab === 'student' && (
              <motion.div
                key="student"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] tracking-[0.2em] font-mono text-primary uppercase block font-bold">
                      PERSONAL DESKTOP
                    </span>
                    <h3 className="text-xl md:text-3xl font-extrabold text-white font-sans uppercase">
                      Student Dashboard Hub
                    </h3>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                      A dedicated dashboard that gives students self-service control over attendance records, leave submission, and AI-powered performance analysis.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: "Attendance Dashboard", desc: "Real-time widgets showing total present hours & percentages." },
                      { title: "Attendance Percentage", desc: "Instant visibility on compliance targets (e.g. 75% bar)." },
                      { title: "Attendance Streak Tracking", desc: "Motivating streaks logging consecutive check-in days." },
                      { title: "Attendance Calendar", desc: "Visual record marking green presence and red absence blocks." },
                      { title: "Attendance Reports", desc: "Download personal attendance history records instantly." },
                      { title: "Leave Applications", desc: "Online application form to submit medical/academic leave requests." },
                      { title: "Notifications Hub", desc: "Real-time alerts for leave approvals and system announcements." },
                      { title: "AI Academic Assistant", desc: "Natural language chatbot for asking compliance questions." }
                    ].map((feat, idx) => (
                      <div key={idx} className="space-y-1 p-3 rounded-xl bg-white/5 border border-white/5">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          {feat.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 p-6 bg-slate-900/60 border border-white/5 rounded-2xl space-y-4">
                  {/* AI Assistant Preview */}
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-xs font-bold font-mono text-white uppercase">AI Student Analyst</span>
                  </div>
                  <div className="space-y-3 font-sans text-xs">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-2xl rounded-tl-none text-slate-300">
                      Hello Alice! You currently have <span className="text-emerald-400 font-bold">92.4% compliance</span> in CS-402 Algorithms. You have maintained a 14-day check-in streak!
                    </div>
                    <div className="p-3 bg-primary text-white rounded-2xl rounded-tr-none max-w-[85%] ml-auto text-right">
                      Will I fall below 75% if I take two sick leaves?
                    </div>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-2xl rounded-tl-none text-slate-300">
                      If you miss 2 classes, your compliance will drop to <span className="text-amber-400 font-bold">86.2%</span>. You will remain safely above the threshold.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PARENT PORTAL TAB */}
            {activeFeatureTab === 'parent' && (
              <motion.div
                key="parent"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] tracking-[0.25em] font-mono text-primary uppercase block font-bold">
                      FAMILY GATEWAY
                    </span>
                    <h3 className="text-xl md:text-3xl font-extrabold text-white font-sans uppercase">
                      Parent Monitoring Portal
                    </h3>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                      Keep parents involved. Provide clean read-only dashboards showing ward attendance statistics, absence logs, leave tracking, and automated security alert triggers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: "Child Attendance Monitoring", desc: "Detailed breakdown views for every registered ward." },
                      { title: "Attendance Alerts", desc: "Automated SMS/email notifications if child is absent or tardy." },
                      { title: "Attendance Trends", desc: "Sleek area charts mapping weekly attendance trajectories." },
                      { title: "Leave Status Tracking", desc: "Real-time updates on active, pending, or completed leave records." },
                      { title: "Attendance Reports", desc: "Download full history sheets for home archiving." },
                      { title: "Notifications Center", desc: "System alerts informing parents of institution notifications." }
                    ].map((feat, idx) => (
                      <div key={idx} className="space-y-1 p-3 rounded-xl bg-white/5 border border-white/5">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {feat.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 p-6 bg-slate-900/60 border border-white/5 rounded-2xl space-y-4">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider font-bold">
                    SECURE WARD MONITORING (DEMO)
                  </span>
                  <div className="p-4 bg-[#090d1a] border border-white/5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Alice Cooper</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                        94% PRESENT
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">Bob Cooper</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono">
                        61% AT RISK
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-mono">
                    ⚠️ ALERT: Bob Cooper missed Distributed Databases session scheduled on 2026-06-20.
                  </div>
                </div>
              </motion.div>
            )}

            {/* TEACHER PORTAL TAB */}
            {activeFeatureTab === 'teacher' && (
              <motion.div
                key="teacher"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] tracking-[0.2em] font-mono text-primary uppercase block font-bold">
                      INSTRUCTOR CONSOLE
                    </span>
                    <h3 className="text-xl md:text-3xl font-extrabold text-white font-sans uppercase">
                      Teacher Command Console
                    </h3>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                      Start sessions, project dynamic check-in codes, review students check-in logs live over WebSocket, and manage pending leaves in a single clicks interface.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: "Session Creation", desc: "Initialize classroom attendance schedules with subject selectors." },
                      { title: "Dynamic QR Generation", desc: "Project the rotating security code directly on the screen." },
                      { title: "QR Expiry Timer", desc: "Configurable session countdown deactivating code scans on timeout." },
                      { title: "Live Attendance Monitoring", desc: "Live feed loading checking-in student names instantly." },
                      { title: "Student Attendance Records", desc: "Complete lookup table for checking individual student logs." },
                      { title: "Leave Approval Workflow", desc: "Single-button approval/rejection panel with remarks input." },
                      { title: "Attendance Analytics", desc: "Instant session summary metrics (total present, absent, late)." },
                      { title: "Reports Dashboard", desc: "One-click CSV/PDF export for administrative grade records." }
                    ].map((feat, idx) => (
                      <div key={idx} className="space-y-1 p-3 rounded-xl bg-white/5 border border-white/5">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feat.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 p-6 bg-slate-900/60 border border-white/5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 uppercase">CS-402 Session Scheduler</span>
                    <span className="text-emerald-400 animate-pulse">● LIVE STREAMING</span>
                  </div>
                  <div className="p-4 bg-slate-950 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono block">OTP SESSION COUNTDOWN</span>
                      <span className="text-2xl font-black text-white font-mono">0{Math.floor(qrTimeLeft)} seconds</span>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">Token: {qrCodeToken}</span>
                    </div>
                    <div className="w-10 h-10 border border-primary/20 bg-primary/5 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-primary animate-spin-slow" />
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5 text-[11px] font-mono">
                    <div className="text-emerald-400">[10:04:15] Sachin Kumar checked in. (Confidence: 99.7%)</div>
                    <div className="text-emerald-400">[10:04:18] Priya Nair checked in. (Confidence: 98.9%)</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ADMIN PORTAL TAB */}
            {activeFeatureTab === 'admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] tracking-[0.2em] font-mono text-primary uppercase block font-bold">
                      INSTITUTION HEADQUARTERS
                    </span>
                    <h3 className="text-xl md:text-3xl font-extrabold text-white font-sans uppercase">
                      Admin Portal & Command Center
                    </h3>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                      The centralized dashboard giving administrators complete authority over credentials, role definitions, security profiles, database health, and audit logs.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: "Institution Dashboard", desc: "Aggregated global statistics showing overall compliance." },
                      { title: "User Management", desc: "Assign credentials and manage dashboard active states." },
                      { title: "Student Management", desc: "Enroll students and register biometric ArcFace embeddings." },
                      { title: "Teacher Management", desc: "Map instructors to specific classroom subject codes." },
                      { title: "Parent Management", desc: "Link family emails to specific student IDs." },
                      { title: "Attendance Analytics", desc: "High-level department rankings and monthly heatmaps." },
                      { title: "Security Logs", desc: "Live captures of registered anomalies and guest flags." },
                      { title: "Audit Logs", desc: "Comprehensive chronological ledger tracks all database edits." },
                      { title: "System Health Monitoring", desc: "Tracks API request load buckets and MongoDB latency." },
                      { title: "Settings Management", desc: "Configures system SMTP alerts and Google Sheets APIs." }
                    ].map((feat, idx) => (
                      <div key={idx} className="space-y-1 p-3 rounded-xl bg-white/5 border border-white/5">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {feat.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans leading-normal">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 p-6 bg-slate-900/60 border border-white/5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 uppercase">System Health Monitors</span>
                    <span className="text-emerald-400 font-bold">ALL SYSTEMS OPERATIONAL</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#090d1a] border border-white/5 rounded-xl text-center">
                      <span className="text-[9px] text-slate-500 font-mono block">DATABASE LATENCY</span>
                      <span className="text-lg font-black text-white font-mono">1.2ms</span>
                    </div>
                    <div className="p-3 bg-[#090d1a] border border-white/5 rounded-xl text-center">
                      <span className="text-[9px] text-slate-500 font-mono block">API SUCCESS RATE</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">99.98%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-2.5 text-[10px] font-mono leading-relaxed">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>SECURITY ALERT FLAGGED:</strong> Intruder Sentinel Camera 02 captured unknown visitor in Classroom B (10:02 AM). Snapshot saved.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>

      {/* 3D Core AI Engine Section */}
      <CoreAiEngine />

      {/* ────────────────────────────────────────────────── WORKFLOW SECTION ──── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.3em] font-mono text-primary uppercase block mb-1 font-bold">
            TRANSACTION SEQUENCE
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
            Attendance Verification Flow
          </h2>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto text-xs md:text-sm">
            SmartFace verifies attendance in seconds through a high-precision, multi-tier automated validation sequence.
          </p>
        </div>

        {/* Workflow Diagram */}
        <div className="relative p-6 md:p-10 bg-slate-950/40 border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent pointer-events-none" />
          
          {/* Stepper items grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6 relative z-10">
            {[
              { title: "1. Create Session", desc: "Teacher initializes class in console.", icon: Calendar },
              { title: "2. Generate QR", desc: "Secure dynamic rotating QR projected.", icon: QrCode },
              { title: "3. Scan QR", desc: "Student scans token with GPS fence check.", icon: Play },
              { title: "4. Validate Data", desc: "ArcFace engine verifies biometric details.", icon: ShieldCheck },
              { title: "5. Record Entry", desc: "Access verified and stored in MongoDB.", icon: Database },
              { title: "6. Sync Sheets", desc: "Google Sheets replicas updated instantly.", icon: FileSpreadsheet },
              { title: "7. Alert Sent", desc: "MFA and check-in confirmation dispatch.", icon: Bell }
            ].map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = activeStep === idx;
              return (
                <div key={idx} className="relative flex flex-col items-center text-center group">
                  {/* Step Node */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 relative ${
                    isActive 
                      ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110' 
                      : 'bg-white/5 border-white/10 text-slate-400 group-hover:border-primary/50'
                  }`}>
                    <StepIcon className="w-5 h-5" />
                    
                    {/* Active index chip */}
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 border border-white/10 text-[9px] font-mono flex items-center justify-center font-bold text-white">
                      {idx + 1}
                    </div>
                  </div>

                  <h4 className={`text-xs font-bold font-sans mt-4 transition-colors duration-305 ${
                    isActive ? 'text-white' : 'text-slate-300'
                  }`}>
                    {step.title}
                  </h4>
                  
                  <p className="text-[10px] text-slate-505 mt-1 font-sans leading-relaxed max-w-[130px] mx-auto md:max-w-none">
                    {step.desc}
                  </p>

                  {/* Connecting lines for desktop */}
                  {idx < 6 && (
                    <div className="hidden md:block absolute top-6 left-[calc(50%+1.5rem)] w-[calc(100%-3rem)] h-[1px] bg-gradient-to-r from-white/10 to-white/10 relative" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── ANALYTICS SECTION ──── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left panel: Info & Rankings */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.25em] font-mono text-primary uppercase block font-bold">
                TELEMETRY & BIG DATA
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
                Analytics Suite
              </h2>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                Review automated analytics trends calculated dynamically from student databases. Spot attendance dropoffs, generate insights, and view department rankings at a glance.
              </p>
            </div>

            {/* Leaderboard Rankings */}
            <div className="p-5 bg-slate-900/40 border border-white/5 rounded-3xl space-y-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                DEPARTMENT LEADERBOARD (CS-YEAR 4)
              </span>
              <div className="space-y-2.5 font-mono text-xs">
                {[
                  { rank: 1, dept: "Computer Science (CSE)", rate: 94.2, color: "text-emerald-400" },
                  { rank: 2, dept: "Electronics & Comm (ECE)", rate: 88.5, color: "text-blue-400" },
                  { rank: 3, dept: "Mechanical Eng (ME)", rate: 81.2, color: "text-yellow-400" },
                  { rank: 4, dept: "Civil Engineering", rate: 76.8, color: "text-rose-400" }
                ].map((item) => (
                  <div key={item.rank} className="flex justify-between items-center p-2 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-slate-400">#{item.rank} {item.dept}</span>
                    <span className={`font-bold ${item.color}`}>{item.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Trends and Heatmaps mockup */}
          <div className="lg:col-span-7 p-6 bg-slate-950/45 border border-white/5 rounded-3xl flex flex-col justify-between gap-6">
            <div>
              <h3 className="font-extrabold text-sm font-sans mb-3 text-white">Attendance Heatmap Matrix</h3>
              <p className="text-[11px] text-slate-400 font-sans mb-4">
                Visualizing daily registration density over a 5-week tracking semester. Darker blocks indicate high student attendance compliance.
              </p>
              
              {/* Heatmap simulation */}
              <div className="grid grid-cols-7 gap-2 p-3 bg-slate-900/60 border border-white/5 rounded-2xl max-w-md">
                {Array.from({ length: 35 }).map((_, idx) => {
                  let opacity = "bg-emerald-500/20";
                  if (idx % 5 === 0) opacity = "bg-emerald-500/80";
                  else if (idx % 3 === 0) opacity = "bg-emerald-500/50";
                  else if (idx % 7 === 0) opacity = "bg-rose-500/30";
                  else if (idx % 4 === 0) opacity = "bg-emerald-500/70";
                  
                  return (
                    <div 
                      key={idx} 
                      className={`h-7 rounded-lg ${opacity} border border-white/5 flex items-center justify-center text-[8px] font-mono text-white/55`}
                    >
                      D{idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1.5 text-xs">
              <span className="text-[10px] font-mono text-emerald-400 block tracking-widest font-bold">
                ✓ PREDICTIVE ATTENDANCE INSIGHT
              </span>
              <p className="text-slate-355 leading-relaxed">
                Algorithms attendance peaks on Tuesdays (95%) and falls to its weekly lowest on Fridays (79%). System flags tardiness automatically if check-ins breach thresholds.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────── LEAVE MANAGEMENT SECTION ──── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.3em] font-mono text-primary uppercase block mb-1 font-bold">
            ADMINISTRATIVE CONCURRENCY
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
            Leave Management Flow
          </h2>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto text-xs md:text-sm">
            Streamline class absences. Student leaf applications route automatically to instructors for review and processing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Stepper column */}
          <div className="lg:col-span-6 p-6 bg-slate-950/40 border border-white/5 rounded-3xl flex flex-col justify-between">
            <h3 className="font-extrabold text-sm font-sans mb-4 text-white uppercase tracking-wider">Leaves Lifecycle Steps</h3>
            <div className="space-y-4">
              {[
                { title: "Student Applies Leave", desc: "Selects leave type, start/end dates, and submits detailed reason in portal." },
                { title: "Teacher Reviews", desc: "Receives real-time dashboard notification containing application details." },
                { title: "Approve or Reject", desc: "Single-button approval trigger writes decisions and remarks back to MongoDB." },
                { title: "Notification Sent", desc: "Automated WebSocket and email notifications dispatch back to the applicant." },
                { title: "History Updated", desc: "Portal balances and leave histories reconcile automatically in real time." }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-mono text-[10px] font-bold text-primary shrink-0">
                    0{idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white font-sans">{step.title}</h4>
                    <p className="text-[10px] text-slate-405 font-sans leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action features breakdown column */}
          <div className="lg:col-span-6 p-6 bg-slate-900/30 border border-white/5 rounded-3xl flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm font-sans mb-4 text-white uppercase tracking-wider">Leave Engine Modules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Leave Application Form", desc: "Select Sick, Personal, Emergency or Academic leave types." },
                  { title: "Leave Review Panel", desc: "Interactive teacher console listing all pending applications." },
                  { title: "Leave Approval Action", desc: "Approved state instantly updates attendance records thresholds." },
                  { title: "Leave Rejection Flow", desc: "Decline requests with detailed remarks explaining reasons." },
                  { title: "Leave History Ledger", desc: "Audit-ready logs of all previous leave requests and reviews." }
                ].map((feat, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {feat.title}
                    </h4>
                    <p className="text-[10px] text-slate-450 font-sans leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-2xl text-[10px] font-mono leading-relaxed mt-4">
              <strong>✓ MULTI-ROLE CONCURRENCY SECURED</strong>
              <p className="mt-1">Leaves engine automatically deducts remaining leave balance values and logs approved days to skip absent penalty checkmarks.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────── REAL-TIME FEATURES SECTION ──── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] tracking-[0.25em] font-mono text-primary uppercase block font-bold">
              WEBSOCKET CONCURRENT CHANNELS
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
              Real-Time Feed
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
              SmartFace runs active WebSockets streams to synchronize classrooms and consoles instantly. View live check-ins, receive session alert notifications, and monitor attendance updates without reloading pages.
            </p>
            <ul className="space-y-2 text-xs font-sans text-slate-350">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span><strong>Live Attendance Updates:</strong> Logs refresh in sub-second cycles.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span><strong>WebSocket Notifications:</strong> Instant leave and warning alerts.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span><strong>Session Alerts:</strong> Signals session start/stop countdowns.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span><strong>Attendance Monitoring:</strong> Live view of checking-in classrooms.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span><strong>Real-Time Dashboard Updates:</strong> Instantly updates admin stats.</span>
              </li>
            </ul>
          </div>

          {/* Right interactive Terminal */}
          <div className="lg:col-span-7 p-5 bg-slate-950 border border-white/5 rounded-3xl relative overflow-hidden h-[360px] flex flex-col justify-between font-mono text-[11px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial from-primary/10 to-transparent blur-md pointer-events-none" />
            
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                  Live WebSocket Notification Broadcast
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
                CONNECTED
              </span>
            </div>

            {/* Terminal Log Stream */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-text">
              {liveLogs.map((log) => {
                let color = "text-slate-400";
                if (log.type === "success") color = "text-emerald-400";
                else if (log.type === "warning") color = "text-yellow-400";
                else if (log.type === "security") color = "text-rose-450 font-bold animate-pulse";
                return (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-slate-600">[{log.time}]</span>
                    <span className={color}>{log.msg}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-white/5 pt-2 mt-2 text-slate-500 text-[10px] text-center">
              Active sockets listening on ws://127.0.0.1:8000/ws/notifications. logs auto-rotate.
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────── SECURITY SECTION ──── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.3em] font-mono text-rose-500 uppercase block mb-1 font-bold">
            VAULT CLOUD HARDENING
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
            Platform Security Suite
          </h2>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto text-xs md:text-sm">
            SmartFace enforces high-grade cryptographic parameters to protect student identity and prevent local dashboard bypass.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "JWT Authentication", desc: "Secure authorization signatures storing encrypted claims and roles on login.", icon: Lock },
            { title: "Role-Based Access (RBAC)", desc: "Strict database query gating ensuring parents only query their wards.", icon: Users },
            { title: "OTP Verification", desc: "Institutional 2-step email OTP code verification on every login credential.", icon: ShieldCheck },
            { title: "Session Management", desc: "Server-side token revocation and logout blocklists using MongoDB TTL indices.", icon: Clock },
            { title: "Audit Logging", desc: "Strict database audit histories recording every leave action and status modification.", icon: FileText },
            { title: "Secure API Access", desc: "CORS parameters restricting access to institutional web application hosts.", icon: Database },
            { title: "Environment Config", desc: "All key connections and MongoDB Atlas hosts managed by environment parameters.", icon: Settings },
            { title: "Sentinel Protection", desc: "Live intruder detection and SMTP alerts protect physical study borders.", icon: ShieldAlert }
          ].map((sec, idx) => {
            const SecIcon = sec.icon;
            return (
              <div key={idx} className="p-5 bg-slate-950/40 border border-white/5 rounded-3xl space-y-3 hover:border-rose-500/20 transition-all duration-300 relative overflow-hidden group">
                {/* Accent glow on hover */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-radial from-rose-500/5 to-transparent blur-md pointer-events-none group-hover:from-rose-500/10 transition-all duration-300" />
                
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-rose-400">
                  <SecIcon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-white font-sans">{sec.title}</h4>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{sec.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────────────────────────────────────────────── REPORTING SECTION ──── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left panel: Info */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] tracking-[0.25em] font-mono text-primary uppercase block font-bold">
              COMPLIANCE AUDITING
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
              Reporting Center
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
              Compile and generate dynamic attendance reports customized for institutional auditing. Instantly export class logs in high-quality formats.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Formats Available</span>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-white">PDF</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-white">EXCEL</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-white">CSV</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Available For</span>
                <p className="text-[10px] text-slate-400 font-sans leading-normal">
                  Students, Teachers, Departments, and Institution-Wide audits.
                </p>
              </div>
            </div>
          </div>

          {/* Right Export Panel Mock */}
          <div className="lg:col-span-7 p-6 bg-slate-900/50 border border-white/5 rounded-3xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm font-sans text-white">Interactive Export Terminal</h3>
              <FileDown className="w-5 h-5 text-primary" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">1. File Format</label>
                <div className="flex gap-2">
                  {(['pdf', 'excel', 'csv'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setReportType(type)}
                      className={`flex-1 py-2 text-xs font-mono font-bold uppercase rounded-xl border transition-all ${
                        reportType === type 
                          ? 'bg-primary border-primary text-white shadow-md shadow-primary/10' 
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">2. Target Audience</label>
                <div className="flex gap-2">
                  {(['students', 'teachers', 'departments', 'institution'] as const).map((target) => (
                    <button
                      key={target}
                      onClick={() => setReportTarget(target)}
                      className={`flex-1 py-2 text-[9px] font-mono font-bold uppercase rounded-xl border transition-all ${
                        reportTarget === target 
                          ? 'bg-accent border-accent text-white shadow-md shadow-accent/10' 
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {target.substring(0, 4)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Export trigger card */}
            <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-4">
              {isExporting ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400 uppercase animate-pulse">Compiling database sheets...</span>
                    <span className="text-white font-bold">{exportProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-150" style={{ width: `${exportProgress}%` }} />
                  </div>
                </div>
              ) : exportSuccess ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-xs font-bold animate-pulse">
                  ✓ SUCCESS: SmartFace_{reportTarget}_report.{reportType === 'excel' ? 'xlsx' : reportType} downloaded successfully!
                </div>
              ) : (
                <div className="text-xs text-slate-405 text-center font-sans leading-relaxed">
                  Export target: <span className="text-white font-bold uppercase">{reportTarget}</span> • File structure: <span className="text-white font-bold uppercase">{reportType}</span> format.
                </div>
              )}

              <button
                onClick={triggerExport}
                disabled={isExporting}
                className="w-full py-3.5 bg-primary hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? "Compiling Audits..." : "Generate and Download Report"}</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────── MOBILE APP SECTION ──── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left panel: Info & Feature list */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.3em] font-mono text-primary uppercase block font-bold">
                MOBILE ECOSYSTEM
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
                SmartFace Mobile
              </h2>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                Take classroom tracking anywhere. Students can authenticate their presence, track streaks, and apply for medical leave directly from their mobile browser or native client.
              </p>
            </div>

            {/* Mobile features */}
            <div className="space-y-4">
              {[
                { title: "QR Scan & Verify", desc: "Instantly scan rotating classroom QR codes with built-in time drift checks." },
                { title: "Personal Attendance Metrics", desc: "Beautiful widgets listing overall check-in compliance percentages." },
                { title: "Leave Applications", desc: "Submit sick, personal or academic leaves with attachment uploads." },
                { title: "Real-Time Push Alerts", desc: "Receive immediate updates when an instructor creates a new session." },
                { title: "AI Assistant", desc: "Ask the integrated model questions regarding your attendance performance." }
              ].map((feat, idx) => (
                <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all duration-300">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <span className="text-xs font-mono font-bold">0{idx + 1}</span>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white font-sans">{feat.title}</h4>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Phone canvas */}
          <div className="lg:col-span-7 flex justify-center items-center h-[500px] md:h-[600px] relative">
            <MobilePhoneCanvas />
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────── TECH STACK SECTION ──── */}
      <TechStackOrbit />

      {/* ────────────────────────────────────────────── WHY SMARTFACE AI ──────── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.3em] font-mono text-primary uppercase block mb-1 font-bold">
            BUSINESS METRICS
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
            Why SmartFace AI
          </h2>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto text-xs md:text-sm">
            Deliver absolute efficiency, remove time waste, and secure classroom verification checks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Reduce Manual Attendance Work", desc: "Automate classroom logs in sub-seconds. Free teachers from manual roll call duties." },
            { title: "Prevent Proxy Attendance", desc: "Time-locked rotating QR coordinates ensure students cannot register remotely." },
            { title: "Improve Attendance Accuracy", desc: "ArcFace ML embeddings capture liveness, matching vectors with 99.9% accuracy." },
            { title: "Real-Time Monitoring", desc: "WebSocket channels notify teacher and admin consoles instantly on check-in success." },
            { title: "Better Student Tracking", desc: "Comprehensive calendar trackers and streak stats keep students motivated." },
            { title: "Better Parent Visibility", desc: "Dedicated family gateway links provide full, secure oversight on ward attendance." },
            { title: "Centralized Administration", desc: "Single dashboard handles users, class maps, security logs, and settings." },
            { title: "Intelligent Analytics", desc: "Get AI-generated summaries and departments analytics leaderboards instantly." }
          ].map((benefit, idx) => (
            <div key={idx} className="p-6 bg-slate-950/40 border border-white/5 rounded-3xl space-y-3 hover:border-primary/20 transition-all duration-300">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <h4 className="text-xs font-bold text-white font-sans">{benefit.title}</h4>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────── TESTIMONIALS SECTION ── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.3em] font-mono text-primary uppercase block mb-1 font-bold">
            TRUSTED BY INSTITUTIONS
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
            What Leaders Say
          </h2>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto text-xs md:text-sm">
            Discover how university deans, professors, and administrative officers optimize their campuses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "SmartFace AI eliminated manual roll calls entirely. The biometric face scanning model is incredibly fast and anti-proxy verification saved hours of classroom time.",
              author: "Dr. Arthur Pendelton",
              role: "Dean of Computer Science, Westwood University",
              initials: "AP"
            },
            {
              quote: "The parent transparency features and automated SMS alerts have significantly improved our student attendance rates. The administrative reports are audit-ready.",
              author: "Sarah Jenkins",
              role: "Registrar, Metro Academic Center",
              initials: "SJ"
            },
            {
              quote: "Connecting our database to MongoDB and FastAPIs via WebSockets allows us to monitor class queues instantly. The security center and camera alerts are stellar.",
              author: "Prof. Rajesh Kumar",
              role: "IT Director, Institute of Technology",
              initials: "RK"
            }
          ].map((t, idx) => (
            <div key={idx} className="p-6 bg-slate-950/40 border border-white/5 rounded-3xl space-y-4 hover:border-primary/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-radial from-primary/5 to-transparent blur-md pointer-events-none" />
              <p className="text-xs text-slate-355 leading-relaxed font-sans italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{t.author}</h4>
                  <p className="text-[10px] text-slate-500 font-sans">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────── FAQ SECTION ─────────── */}
      <section className="w-full max-w-4xl px-6 md:px-8 py-20 mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.3em] font-mono text-primary uppercase block mb-1 font-bold">
            COMMON INQUIRIES
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
            Frequently Asked
          </h2>
          <p className="text-slate-400 mt-2 max-w-lg mx-auto text-xs md:text-sm">
            Answers to key security, deployment, and operational details about the platform.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does the anti-proxy dynamic QR code check verify actual student presence?",
              a: "SmartFace generates short-lived QR tokens (rotating every 5 seconds) embedded with server-side time-drift tokens. Students must scan the QR using the mobile scanner, which cross-references their GPS coordinates with the classroom's coordinates to prevent screenshot sharing or remote registrations."
            },
            {
              q: "Is the biometric face recognition matching secure and private?",
              a: "Yes. SmartFace leverages the ArcFace model to extract facial contours and convert them into a 512-dimensional vector embedding. We store only these numeric mathematical arrays in MongoDB, rather than raw image files, ensuring student privacy and full cryptographic protection."
            },
            {
              q: "How do the WebSocket feeds synchronize logs in real time?",
              a: "Our FastAPI backend hosts WebSocket broadcast channels. As soon as a student scans and verifies their biometric mesh, the attendance transaction records to MongoDB and dispatches a JSON notification over ws://, instantly updating the teacher and admin console feeds."
            },
            {
              q: "Can we export reports for accreditation and audits?",
              a: "Absolutely. The administrative command center features a reporting engine to compile and download CSV, Excel (XLSX), or formatted PDF attendance sheets, filterable by date, classroom, department, or individual student histories."
            }
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="bg-slate-950/40 border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/10"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-sans text-xs font-bold text-white outline-none"
                >
                  <span>{faq.q}</span>
                  <span className={`text-slate-500 font-mono transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="p-5 pt-0 text-slate-400 font-sans text-xs leading-relaxed border-t border-white/5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────────────────────── CONTACT SECTION ──────── */}
      <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Left form column */}
          <div className="lg:col-span-7 p-6 md:p-8 bg-slate-950/40 border border-white/5 rounded-3xl flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[10px] tracking-[0.25em] font-mono text-primary uppercase block font-bold mb-1">
                GET IN TOUCH
              </span>
              <h3 className="text-xl md:text-3xl font-extrabold text-white font-sans uppercase">
                Contact SmartFace AI
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-2">
                Have questions about deployment, custom licensing, or pilot programs? Drop us a message.
              </p>
            </div>

            <form className="space-y-4 text-xs font-sans" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    className="w-full p-3 rounded-xl bg-slate-900 border border-white/5 text-white focus:border-primary/50 outline-none transition" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Institutional Email</label>
                  <input 
                    type="email" 
                    placeholder="doe@university.edu" 
                    className="w-full p-3 rounded-xl bg-slate-900 border border-white/5 text-white focus:border-primary/50 outline-none transition" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Subject</label>
                <input 
                  type="text" 
                  placeholder="Pilot Program Inquiry" 
                  className="w-full p-3 rounded-xl bg-slate-900 border border-white/5 text-white focus:border-primary/50 outline-none transition" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Message</label>
                <textarea 
                  rows={4}
                  placeholder="Write your operational requirements here..." 
                  className="w-full p-3 rounded-xl bg-slate-900 border border-white/5 text-white focus:border-primary/50 outline-none transition resize-none" 
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 border border-primary/20"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Right info column */}
          <div className="lg:col-span-5 p-6 md:p-8 bg-slate-900/30 border border-white/5 rounded-3xl flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[10px] tracking-[0.25em] font-mono text-primary uppercase block font-bold mb-1">
                CAMPUS OFFICE
              </span>
              <h3 className="text-lg font-bold text-white font-sans uppercase">
                SmartFace AI HQ
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-2 leading-relaxed">
                Our operations coordinate directly with universities globally to deploy secure network endpoints and camera integrations.
              </p>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl">
                <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold tracking-wider">Email Address</span>
                <span className="text-white font-bold block mt-1">support@smartface.pro</span>
              </div>
              <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl">
                <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold tracking-wider">Location</span>
                <span className="text-white font-bold block mt-1">Silicon Valley, CA • Academic Division</span>
              </div>
              <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl">
                <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold tracking-wider">System Health</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-400 font-bold">ALL SERVICES OPERATIONAL</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* APK Download Main Section */}
      <section className="w-full max-w-7xl px-6 md:px-8 mx-auto my-16">
        <ApkDownloadHero />
      </section>

      {/* Sitemap footer */}
      <Footer />

    </div>
  );
}
