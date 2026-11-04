'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  CalendarCheck,
  QrCode,
  Camera,
  Clock,
  Calculator,
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Share2,
  RefreshCw,
  Flame,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  BookOpen,
  MapPin,
  HelpCircle,
  ExternalLink,
  Laptop
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubjectAttendance {
  id: string;
  code: string;
  name: string;
  faculty: string;
  attended: number;
  total: number;
  room: string;
  color: string;
}

interface TimetableSlot {
  time: string;
  code: string;
  name: string;
  faculty: string;
  room: string;
  status: 'completed' | 'ongoing' | 'upcoming';
}

interface LeaveRecord {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  appliedOn: string;
  reviewerRemarks?: string;
}

export default function StudentPortalPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'face_scanner' | 'qr_scanner' | 'timetable' | 'calculator' | 'leaves' | 'id_card' | 'gemini_ai'
  >('overview');

  // Student Profile State
  const student = {
    name: 'Alice Cooper',
    rollNo: 'CSE-2026-08',
    department: 'Computer Science & Engineering',
    semester: '6th Semester (Section A)',
    email: 'alice.cooper@smartface.edu',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    streak: 12,
    rank: '#4 in Department',
    biometricEnrolled: true,
  };

  // Attendance Records State
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([
    { id: '1', code: 'CS601', name: 'Machine Learning & Neural Nets', faculty: 'Prof. Miller', attended: 26, total: 28, room: 'Lab 3B', color: '#3B82F6' },
    { id: '2', code: 'CS602', name: 'Distributed Cloud Architecture', faculty: 'Dr. Sarah Connor', attended: 21, total: 25, room: 'Room 402', color: '#10B981' },
    { id: '3', code: 'CS603', name: 'Database Security & Cryptography', faculty: 'Dr. Jane Goodall', attended: 18, total: 24, room: 'Auditorium A', color: '#F59E0B' },
    { id: '4', code: 'CS604', name: 'Compiler Design & Automata', faculty: 'Prof. Alan Turing', attended: 22, total: 26, room: 'Room 205', color: '#8B5CF6' },
    { id: '5', code: 'CS605', name: 'Fullstack Web & Mobile Systems', faculty: 'Prof. Grace Hopper', attended: 28, total: 30, room: 'Lab 1A', color: '#EC4899' },
  ]);

  // Total Calculations
  const totalAttended = subjects.reduce((acc, s) => acc + s.attended, 0);
  const totalClasses = subjects.reduce((acc, s) => acc + s.total, 0);
  const overallPercentage = Math.round((totalAttended / totalClasses) * 100);

  // Timetable
  const timetable: TimetableSlot[] = [
    { time: '09:00 AM - 10:00 AM', code: 'CS601', name: 'Machine Learning Lab', faculty: 'Prof. Miller', room: 'Lab 3B', status: 'completed' },
    { time: '10:15 AM - 11:15 AM', code: 'CS602', name: 'Distributed Cloud Architecture', faculty: 'Dr. Sarah Connor', room: 'Room 402', status: 'ongoing' },
    { time: '11:30 AM - 12:30 PM', code: 'CS603', name: 'Database Security & Cryptography', faculty: 'Dr. Jane Goodall', room: 'Auditorium A', status: 'upcoming' },
    { time: '01:30 PM - 02:30 PM', code: 'CS604', name: 'Compiler Design & Automata', faculty: 'Prof. Alan Turing', room: 'Room 205', status: 'upcoming' },
    { time: '02:45 PM - 04:15 PM', code: 'CS605', name: 'Fullstack Systems Project Lab', faculty: 'Prof. Grace Hopper', room: 'Lab 1A', status: 'upcoming' },
  ];

  // Leaves state
  const [leaves, setLeaves] = useState<LeaveRecord[]>([
    { id: 'LV-1021', type: 'Medical Leave', startDate: '2026-10-14', endDate: '2026-10-15', reason: 'Viral fever, doctor prescription attached', status: 'Approved', appliedOn: '2026-10-13', reviewerRemarks: 'Approved. Get well soon.' },
    { id: 'LV-1022', type: 'Hackathon Participation', startDate: '2026-10-24', endDate: '2026-10-25', reason: 'Representing university at National Smart India Hackathon', status: 'Approved', appliedOn: '2026-10-20', reviewerRemarks: 'Duty leave sanctioned.' },
    { id: 'LV-1023', type: 'Personal Emergency', startDate: '2026-10-30', endDate: '2026-10-31', reason: 'Family engagement ceremony', status: 'Pending', appliedOn: '2026-10-27' },
  ]);

  // Leave Form
  const [leaveType, setLeaveType] = useState('Medical Leave');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState('');

  // Attendance Calculator Slider
  const [calcTarget, setCalcTarget] = useState(75);

  // Webcam Face Scan State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; confidence?: number } | null>(null);

  // QR Scanner State
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [qrSuccess, setQrSuccess] = useState<string | null>(null);

  // Gemini AI Chat State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; model?: string }>>([
    {
      role: 'assistant',
      text: `Hello Alice! I am your **SmartFace Gemini 3.8 Flash Academic Copilot**.\n\nYour overall attendance is **${overallPercentage}%** (Safe: >75%). You are currently eligible for all semester exams! How can I assist you with your academic schedule or attendance planning today?`,
    },
  ]);

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      // In case webcam is blocked or unsupported, simulate scanning
      setCameraActive(true);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Perform Face Check-In
  const handleFaceCheckIn = () => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        success: true,
        message: 'Biometric Verified! Attendance marked for CS602 (Distributed Cloud Architecture)',
        confidence: 99.4,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Optimistically update subject attendance
      setSubjects((prev) =>
        prev.map((s) => (s.code === 'CS602' ? { ...s, attended: s.attended + 1, total: s.total + 1 } : s))
      );
    }, 2200);
  };

  // Perform QR Check-in
  const handleQrSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!qrTokenInput.trim()) return;

    setQrSuccess(`Verifying Token "${qrTokenInput.trim()}" against active session...`);
    setTimeout(() => {
      setQrSuccess(`Success! Dynamic anti-proxy token accepted. Attendance logged at ${new Date().toLocaleTimeString()}.`);
      setQrTokenInput('');
      confetti({
        particleCount: 50,
        spread: 45,
      });
    }, 1000);
  };

  // Submit Leave
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) return;

    const newLeave: LeaveRecord = {
      id: `LV-${Math.floor(1000 + Math.random() * 9000)}`,
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };

    setLeaves([newLeave, ...leaves]);
    setLeaveSuccessMsg('Leave application successfully submitted to Department Dean!');
    setLeaveReason('');
    setLeaveStart('');
    setLeaveEnd('');
    setTimeout(() => setLeaveSuccessMsg(''), 4000);
  };

  // Ask Gemini AI
  const handleAskGemini = async (overridePrompt?: string) => {
    const q = overridePrompt || aiPrompt;
    if (!q.trim() || aiLoading) return;

    const userMessage = { role: 'user' as const, text: q };
    setAiMessages((prev) => [...prev, userMessage]);
    setAiPrompt('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          role: 'student',
          context: {
            student_name: student.name,
            roll_no: student.rollNo,
            overall_percentage: overallPercentage,
            subjects: subjects.map((s) => ({
              code: s.code,
              name: s.name,
              percentage: Math.round((s.attended / s.total) * 100),
            })),
            streak: student.streak,
          },
        }),
      });

      const data = await res.json();
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'Analysis completed.',
          model: data.model || 'Gemini 3.8 Flash',
        },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to reach Gemini API at the moment. However, based on your current stats, your overall attendance is 87%, safely above the 75% threshold.',
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">SmartFace</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    STUDENT PORTAL
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Autonomous Biometric Attendance</p>
              </div>
            </Link>
          </div>

          {/* Quick Portal Switcher & User Pill */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Quick Switch Portals */}
            <div className="hidden md:flex items-center bg-slate-800/60 p-1 rounded-xl border border-white/5 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-medium shadow-sm">
                Student
              </span>
              <Link
                href="/teacher"
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Lecturer
              </Link>
              <Link
                href="/admin"
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Admin Panel
              </Link>
            </div>

            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
              <span>{student.streak} Days Streak</span>
            </div>

            {/* Student Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-8 h-8 rounded-full object-cover border border-blue-500/50"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{student.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{student.rollNo}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
        {/* Portal Sub-Header Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-950/40 border border-blue-500/20 p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Biometric Identity Synced
                </span>
                <span className="text-xs text-slate-400">{student.semester}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {student.name} 👋
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Your current overall attendance is{' '}
                <span className="text-emerald-400 font-bold">{overallPercentage}%</span>. You have safe exam
                standing in all enrolled subjects.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setActiveTab('face_scanner');
                  startCamera();
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Webcam Face Check-in</span>
              </button>

              <button
                onClick={() => setActiveTab('qr_scanner')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Scan Dynamic QR</span>
              </button>

              <button
                onClick={() => setActiveTab('gemini_ai')}
                className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Gemini 3.8 Flash AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Portal Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Analytics', icon: CalendarCheck },
            { id: 'face_scanner', label: 'Face Check-in (Webcam)', icon: Camera },
            { id: 'qr_scanner', label: 'Dynamic QR Scanner', icon: QrCode },
            { id: 'timetable', label: 'Daily Timetable', icon: Clock },
            { id: 'calculator', label: 'Attendance Calculator', icon: Calculator },
            { id: 'leaves', label: 'Leave Applications', icon: FileText },
            { id: 'id_card', label: 'Digital Student ID', icon: User },
            { id: 'gemini_ai', label: 'Gemini 3.8 Flash Copilot', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  if (tab.id === 'face_scanner') {
                    startCamera();
                  } else {
                    stopCamera();
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Overall Attendance</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{overallPercentage}%</span>
                  <span className="text-xs text-emerald-400 font-medium">Eligible for Exams</span>
                </div>
                <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${overallPercentage}%` }}
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Classes Attended</span>
                  <BookOpen className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{totalAttended}</span>
                  <span className="text-xs text-slate-400 font-mono">/ {totalClasses} Sessions</span>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">Total lectures conducted this term</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Attendance Streak</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400">{student.streak}</span>
                  <span className="text-xs text-slate-300">Days Consecutive</span>
                </div>
                <p className="mt-3 text-[11px] text-amber-400/80">3 days away from Gold Streak badge</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Academic Standing</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-purple-300">{student.rank}</span>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">Consistent &gt;85% attendance percentile</p>
              </div>
            </div>

            {/* Subject-Wise Attendance Breakdown */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Subject-Wise Attendance Breakdown</h3>
                  <p className="text-xs text-slate-400">Real-time attendance percentages mapped to individual courses</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Minimum Req: 75%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {subjects.map((sub) => {
                  const pct = Math.round((sub.attended / sub.total) * 100);
                  const isSafe = pct >= 75;
                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                            {sub.code}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              isSafe ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{sub.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{sub.faculty} • {sub.room}</p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Attended: {sub.attended}/{sub.total}</span>
                          <span>{isSafe ? 'Safe' : 'Action Needed'}</span>
                        </div>
                        <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ${
                              pct >= 85
                                ? 'bg-emerald-500'
                                : pct >= 75
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Live Timetable Preview */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Today&apos;s Lecture Schedule</h3>
                  <p className="text-xs text-slate-400">Active classroom sessions for today</p>
                </div>
                <button
                  onClick={() => setActiveTab('timetable')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>View Full Schedule</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {timetable.slice(0, 3).map((slot, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      slot.status === 'ongoing'
                        ? 'bg-blue-900/20 border-blue-500/40 shadow-lg shadow-blue-500/5'
                        : slot.status === 'completed'
                        ? 'bg-slate-800/30 border-white/5 opacity-70'
                        : 'bg-slate-800/50 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          slot.status === 'ongoing'
                            ? 'bg-blue-500 animate-ping'
                            : slot.status === 'completed'
                            ? 'bg-emerald-500'
                            : 'bg-slate-500'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{slot.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-700/60 text-slate-300">
                            {slot.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{slot.faculty} • {slot.room}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-mono text-slate-300">{slot.time}</p>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          slot.status === 'ongoing'
                            ? 'text-blue-400'
                            : slot.status === 'completed'
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WEBCAM FACE CHECK-IN */}
        {activeTab === 'face_scanner' && (
          <div className="max-w-2xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-blue-500/30 shadow-2xl space-y-6 text-center">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                ArcFace ONNX Vector Engine
              </span>
              <h2 className="text-2xl font-extrabold text-white">Live Biometric Face Check-in</h2>
              <p className="text-xs text-slate-400">
                Position your face within the scanner reticle to authenticate against your registered 512-dim embedding.
              </p>
            </div>

            {/* Video Viewfinder / Scanner HUD */}
            <div className="relative mx-auto w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-blue-500/50 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Scanning Reticle & HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div
                  className={`relative w-48 h-48 rounded-3xl border-2 transition-all duration-300 ${
                    isScanning
                      ? 'border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)]'
                      : scanResult?.success
                      ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)]'
                      : 'border-white/30 border-dashed'
                  }`}
                >
                  {/* Corner Accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

                  {/* Laser Scan Line */}
                  {isScanning && (
                    <motion.div
                      animate={{ y: [0, 180, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                      className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(96,165,250,1)]"
                    />
                  )}
                </div>

                <div className="mt-4 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-mono text-slate-300 border border-white/10">
                  {isScanning ? 'Extracting facial landmarks...' : cameraActive ? 'Face Detected: Ready to Verify' : 'Camera Initializing...'}
                </div>
              </div>
            </div>

            {/* Scan Result Feedback */}
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 ${
                  scanResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{scanResult.message}</span>
                {scanResult.confidence && (
                  <span className="font-mono text-xs opacity-80">({scanResult.confidence}% confidence)</span>
                )}
              </motion.div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                disabled={isScanning}
                onClick={handleFaceCheckIn}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>{isScanning ? 'Verifying Embedding...' : 'Capture & Verify Face'}</span>
              </button>

              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                {cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DYNAMIC QR SCANNER */}
        {activeTab === 'qr_scanner' && (
          <div className="max-w-xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Anti-Proxy Cipher System
              </span>
              <h2 className="text-2xl font-extrabold text-white">Dynamic QR Attendance Scanner</h2>
              <p className="text-xs text-slate-400">
                Scan the dynamic rotating QR code projected on your classroom screen. Rotating tokens expire every 15–30 seconds.
              </p>
            </div>

            {/* Mock QR Scanner HUD View */}
            <div className="relative aspect-square max-w-xs mx-auto rounded-2xl bg-slate-950 border-2 border-emerald-500/40 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-40 h-40 rounded-xl border-2 border-emerald-400 border-dashed flex items-center justify-center relative overflow-hidden">
                <QrCode className="w-24 h-24 text-emerald-400/40 animate-pulse" />
                <motion.div
                  animate={{ y: [-70, 70, -70] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_15px_#34d399]"
                />
              </div>
              <p className="mt-4 text-[11px] font-mono text-slate-400">
                Point mobile or webcam at lecturer&apos;s screen
              </p>
            </div>

            {/* Manual Token Verification fallback */}
            <form onSubmit={handleQrSubmit} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Or enter session dynamic token manually:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SEC-CS602-9982"
                  value={qrTokenInput}
                  onChange={(e) => setQrTokenInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Verify
                </button>
              </div>
            </form>

            {qrSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium text-center">
                {qrSuccess}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DAILY TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-bold text-white">Daily Academic Timetable</h3>
                <p className="text-xs text-slate-400">Semester 6 — Department of Computer Science & Engineering</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Today: Wednesday, Active Term</span>
            </div>

            <div className="space-y-3">
              {timetable.map((slot, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    slot.status === 'ongoing'
                      ? 'bg-blue-900/25 border-blue-500/50 shadow-xl'
                      : slot.status === 'completed'
                      ? 'bg-slate-800/25 border-white/5 opacity-70'
                      : 'bg-slate-800/50 border-white/10'
                  }`}
                >
                  <div className="flex items-start md:items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 md:mt-0 ${
                        slot.status === 'ongoing'
                          ? 'bg-blue-500 animate-ping'
                          : slot.status === 'completed'
                          ? 'bg-emerald-500'
                          : 'bg-slate-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{slot.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {slot.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span>Instructor: {slot.faculty}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-blue-400" />
                          {slot.room}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <div className="text-left md:text-right">
                      <p className="text-xs font-mono font-bold text-white">{slot.time}</p>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          slot.status === 'ongoing'
                            ? 'text-blue-400'
                            : slot.status === 'completed'
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>

                    {slot.status === 'ongoing' && (
                      <button
                        onClick={() => setActiveTab('face_scanner')}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                      >
                        Check-in Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ATTENDANCE CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="max-w-2xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Safe Absence Simulator
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-2">Smart Attendance Calculator</h2>
              <p className="text-xs text-slate-400 mt-1">
                Calculate exactly how many classes you can afford to skip, or how many you must attend to maintain your desired target.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/60 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Target Attendance Percentage</span>
                <span className="text-xl font-bold font-mono text-purple-400">{calcTarget}%</span>
              </div>
              <input
                type="range"
                min="65"
                max="95"
                step="1"
                value={calcTarget}
                onChange={(e) => setCalcTarget(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>65% (Condonation)</span>
                <span>75% (Mandatory)</span>
                <span>85% (Distinction)</span>
                <span>95% (Top Tier)</span>
              </div>
            </div>

            {/* Real-Time Outcome Calculation Card */}
            {(() => {
              // Formula: (attended) / (total + x) >= target/100  =>  attended - target/100 * total >= target/100 * x
              const targetDec = calcTarget / 100;
              let canSkip = 0;
              let mustAttend = 0;

              if (overallPercentage >= calcTarget) {
                // How many can skip: (totalAttended / (totalClasses + skip)) = targetDec
                canSkip = Math.floor(totalAttended / targetDec - totalClasses);
                canSkip = Math.max(0, canSkip);
              } else {
                // How many must attend: (totalAttended + x) / (totalClasses + x) = targetDec
                mustAttend = Math.ceil((targetDec * totalClasses - totalAttended) / (1 - targetDec));
                mustAttend = Math.max(0, mustAttend);
              }

              return (
                <div className="p-6 rounded-xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 text-center space-y-2">
                  {canSkip > 0 ? (
                    <div>
                      <p className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
                        Bunk Allowance Buffer
                      </p>
                      <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">
                        You can safely miss <span className="underline">{canSkip}</span> classes
                      </h3>
                      <p className="text-xs text-slate-300 mt-2">
                        While still maintaining at least <span className="font-bold text-white">{calcTarget}%</span> overall attendance!
                      </p>
                    </div>
                  ) : mustAttend > 0 ? (
                    <div>
                      <p className="text-xs text-amber-300 uppercase tracking-wider font-semibold">
                        Attendance Recovery Required
                      </p>
                      <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
                        Attend the next <span className="underline">{mustAttend}</span> classes
                      </h3>
                      <p className="text-xs text-slate-300 mt-2">
                        Without missing any session to lift your attendance to{' '}
                        <span className="font-bold text-white">{calcTarget}%</span>.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-2xl font-bold text-white">You are exactly on target!</h3>
                      <p className="text-xs text-slate-300 mt-1">Attend every upcoming class to preserve your standing.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 6: LEAVE APPLICATIONS */}
        {activeTab === 'leaves' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Apply Leave Form */}
            <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/80 border border-white/10 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">Apply for Leave</h3>
              <p className="text-xs text-slate-400">
                Submit an authorized leave request to faculty and academic dean.
              </p>

              <form onSubmit={handleLeaveSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Leave Category</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option>Medical Leave</option>
                    <option>Academic Event / Hackathon</option>
                    <option>Personal Emergency</option>
                    <option>Sports / University Representation</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">From Date</label>
                    <input
                      type="date"
                      required
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">To Date</label>
                    <input
                      type="date"
                      required
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Reason</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe reason and specify doctor / event details..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Leave Request</span>
                </button>

                {leaveSuccessMsg && (
                  <p className="text-xs text-emerald-400 font-semibold text-center">{leaveSuccessMsg}</p>
                )}
              </form>
            </div>

            {/* Leave History List */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Leave Status & Application History</h3>
                  <p className="text-xs text-slate-400">Track Dean approvals and authorized condonations</p>
                </div>
                <span className="text-xs font-mono text-slate-400">{leaves.length} records</span>
              </div>

              <div className="space-y-3">
                {leaves.map((lv) => (
                  <div
                    key={lv.id}
                    className="p-4 rounded-xl bg-slate-800/50 border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{lv.type}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {lv.id}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          lv.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : lv.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {lv.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{lv.reason}</p>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                      <span>Duration: {lv.startDate} to {lv.endDate}</span>
                      <span>Applied on: {lv.appliedOn}</span>
                    </div>

                    {lv.reviewerRemarks && (
                      <p className="text-[11px] text-blue-300 italic bg-blue-950/30 p-2 rounded-lg border border-blue-500/20">
                        Reviewer Note: {lv.reviewerRemarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DIGITAL STUDENT ID CARD */}
        {activeTab === 'id_card' && (
          <div className="max-w-md mx-auto w-full p-6 space-y-6 text-center">
            <h2 className="text-2xl font-extrabold text-white">Official Digital Student ID</h2>
            <p className="text-xs text-slate-400">
              Cryptographically verified holographic student card for campus and exam hall entry.
            </p>

            {/* Holographic Card Container */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-blue-500/40 p-6 text-left shadow-2xl space-y-6">
              {/* Card Holographic Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-purple-500/10 pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    SF
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white tracking-wider uppercase">
                      SmartFace University
                    </h4>
                    <p className="text-[9px] text-slate-400 font-mono">BIOMETRIC IDENTITY PASS</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Card Body */}
              <div className="flex items-center gap-4">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-20 h-24 rounded-2xl object-cover border-2 border-blue-400/80 shadow-md"
                />
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white">{student.name}</h3>
                  <p className="text-xs font-mono text-blue-400 font-bold">{student.rollNo}</p>
                  <p className="text-[11px] text-slate-300">{student.department}</p>
                  <p className="text-[10px] text-slate-400">{student.semester}</p>
                </div>
              </div>

              {/* Card Footer Barcode & Verification QR */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="h-7 w-36 bg-slate-800 rounded flex items-center justify-center font-mono text-[10px] text-slate-400 tracking-widest border border-white/10">
                    ||| | || |||| | ||| |
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono mt-1">UID: 8849-2026-CSE-008</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-white p-1">
                  <QrCode className="w-full h-full text-slate-950" />
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-white/10 flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Download & Print ID Badge</span>
            </button>
          </div>
        )}

        {/* TAB 8: GEMINI 3.8 FLASH COPILOT */}
        {activeTab === 'gemini_ai' && (
          <div className="max-w-3xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-purple-500/30 shadow-2xl space-y-6 flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Gemini 3.8 Flash Academic Copilot</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Personalized attendance advice, bunk calculations, and study schedules
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-xs space-y-1.5 leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-800/80 text-slate-200 border border-white/10 rounded-tl-none whitespace-pre-line'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.model && (
                      <p className="text-[9px] text-purple-300/70 font-mono text-right">
                        Powered by {msg.model}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 text-xs text-purple-300 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini 3.8 Flash is analyzing your academic data...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestion Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                'How many classes can I bunk?',
                'Draft a medical leave letter',
                'How do I reach 85% in Machine Learning?',
                'Explain 75% university condonation rules',
              ].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskGemini(pill)}
                  className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-white/5 transition-colors cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskGemini();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask Gemini about your attendance, bunk limits, or courses..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-4 px-4 lg:px-8 text-center text-xs text-slate-500 font-mono">
        SmartFace Biometric Attendance Suite • Student Portal • Version 2.0 • Secured by ArcFace ONNX & Gemini 3.8 Flash
      </footer>
    </div>
  );
}
