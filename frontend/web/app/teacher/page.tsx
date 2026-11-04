'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CalendarCheck,
  QrCode,
  Camera,
  Clock,
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
  Maximize2,
  Minimize2,
  Play,
  Square,
  Check,
  X,
  UserCheck,
  UserX,
  Mail,
  ExternalLink,
  Laptop
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EnrolledStudent {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  avatar: string;
  attendancePct: number;
  status: 'Present' | 'Late' | 'Absent' | 'Excused';
  checkInTime?: string;
  method?: 'Face AI' | 'Dynamic QR' | 'Manual';
}

interface PendingLeave {
  id: string;
  studentName: string;
  rollNo: string;
  type: string;
  dates: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function TeacherPortalPage() {
  const [activeTab, setActiveTab] = useState<
    'command_center' | 'launch_session' | 'qr_projector' | 'kiosk_scanner' | 'roster' | 'leave_approvals' | 'at_risk' | 'export_sync' | 'gemini_copilot'
  >('command_center');

  // Teacher Profile
  const teacher = {
    name: 'Prof. Miller',
    title: 'Associate Professor & Lab Director',
    department: 'Department of Computer Science & Engineering',
    email: 'miller@smartface.edu',
    room: 'Lab 3B / Tech Tower 402',
    activeCourse: 'CS601: Machine Learning & Neural Networks',
  };

  // Session State
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [sessionSubject, setSessionSubject] = useState('CS601 - Machine Learning');
  const [sessionSection, setSessionSection] = useState('Section A (6th Sem)');
  const [sessionRoom, setSessionRoom] = useState('Lab 3B');
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(60);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(1320); // 22 mins

  // Dynamic QR Code Rotation State
  const [qrToken, setQrToken] = useState('SEC-CS601-9842');
  const [qrCountdown, setQrCountdown] = useState(15);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Enrolled Students Roster
  const [students, setStudents] = useState<EnrolledStudent[]>([
    { id: '1', rollNo: 'CSE-2026-01', name: 'Aaron Paul', email: 'aaron@smartface.edu', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', attendancePct: 89, status: 'Present', checkInTime: '09:04 AM', method: 'Face AI' },
    { id: '2', rollNo: 'CSE-2026-08', name: 'Alice Cooper', email: 'alice.cooper@smartface.edu', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', attendancePct: 93, status: 'Present', checkInTime: '09:02 AM', method: 'Face AI' },
    { id: '3', rollNo: 'CSE-2026-12', name: 'Bob Dylan', email: 'bob.d@smartface.edu', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', attendancePct: 71, status: 'Late', checkInTime: '09:18 AM', method: 'Dynamic QR' },
    { id: '4', rollNo: 'CSE-2026-15', name: 'Catherine Zeta', email: 'catherine@smartface.edu', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', attendancePct: 68, status: 'Absent' },
    { id: '5', rollNo: 'CSE-2026-22', name: 'Charlie Watts', email: 'charlie@smartface.edu', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', attendancePct: 85, status: 'Present', checkInTime: '09:07 AM', method: 'Dynamic QR' },
    { id: '6', rollNo: 'CSE-2026-27', name: 'David Gilmour', email: 'david.g@smartface.edu', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', attendancePct: 74, status: 'Absent' },
    { id: '7', rollNo: 'CSE-2026-31', name: 'Emma Watson', email: 'emma@smartface.edu', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', attendancePct: 96, status: 'Present', checkInTime: '09:01 AM', method: 'Face AI' },
    { id: '8', rollNo: 'CSE-2026-35', name: 'Franklin Pierce', email: 'franklin@smartface.edu', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', attendancePct: 82, status: 'Excused' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Pending Leaves for Approval
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([
    { id: 'LV-1023', studentName: 'Alice Cooper', rollNo: 'CSE-2026-08', type: 'Personal Emergency', dates: '2026-10-30 to 2026-10-31', reason: 'Family engagement ceremony and travel', status: 'Pending' },
    { id: 'LV-1025', studentName: 'Bob Dylan', rollNo: 'CSE-2026-12', type: 'Medical Leave', dates: '2026-10-28 to 2026-10-29', reason: 'Severe migraine; doctor consultation certificate attached', status: 'Pending' },
    { id: 'LV-1026', studentName: 'Catherine Zeta', rollNo: 'CSE-2026-15', type: 'Inter-College Debate', dates: '2026-11-02 to 2026-11-03', reason: 'Representing university in state championship', status: 'Pending' },
  ]);

  // Kiosk Camera
  const kioskVideoRef = useRef<HTMLVideoElement | null>(null);
  const [kioskScanning, setKioskScanning] = useState(false);
  const [kioskGreeting, setKioskGreeting] = useState<string | null>(null);

  // Sync with Google Sheets State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Gemini Faculty AI Chat
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; model?: string }>>([
    {
      role: 'assistant',
      text: `Good morning, **${teacher.name}**! I am your **Gemini 3.8 Flash Faculty Copilot**.\n\nYour active session in **CS601: Machine Learning** has **${students.filter(s => s.status === 'Present').length} / ${students.length} students** present. Two students (*Catherine Zeta* & *David Gilmour*) are below the 75% attendance threshold. Would you like me to generate warning letters or summarize session trends?`,
    },
  ]);

  // Statistics
  const presentCount = students.filter((s) => s.status === 'Present').length;
  const lateCount = students.filter((s) => s.status === 'Late').length;
  const absentCount = students.filter((s) => s.status === 'Absent').length;
  const excusedCount = students.filter((s) => s.status === 'Excused').length;
  const attendanceRate = Math.round(((presentCount + lateCount) / students.length) * 100);

  // QR Rotating Countdown Timer
  useEffect(() => {
    if (!isSessionActive) return;
    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          // Generate new dynamic token
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          setQrToken(`SEC-CS601-${randomSuffix}`);
          return 15;
        }
        return prev - 1;
      });
      setSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Toggle Student Status manually
  const handleToggleStatus = (id: string, newStatus: EnrolledStudent['status']) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: newStatus,
              checkInTime: newStatus === 'Present' || newStatus === 'Late' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
              method: 'Manual',
            }
          : s
      )
    );
  };

  // Leave Approval Action
  const handleLeaveAction = (id: string, action: 'Approved' | 'Rejected') => {
    setPendingLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: action } : l))
    );
  };

  // Start Kiosk Camera
  const startKioskCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      if (kioskVideoRef.current) {
        kioskVideoRef.current.srcObject = stream;
        kioskVideoRef.current.play();
      }
    } catch {
      // Graceful fallback
    }
  };

  // Stop Kiosk Camera
  const stopKioskCamera = () => {
    if (kioskVideoRef.current && kioskVideoRef.current.srcObject) {
      const stream = kioskVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      kioskVideoRef.current.srcObject = null;
    }
  };

  // Simulate Walk-Up Kiosk Biometric Check-In
  const handleKioskScan = () => {
    setKioskScanning(true);
    setKioskGreeting(null);

    setTimeout(() => {
      setKioskScanning(false);
      setKioskGreeting('Welcome, Emma Watson! Biometric verified (99.7%). Attendance logged as Present.');
      confetti({ particleCount: 60, spread: 50 });
      handleToggleStatus('7', 'Present');
    }, 2000);
  };

  // Sync to Google Sheets
  const handleSyncGoogleSheets = () => {
    setIsSyncing(true);
    setSyncSuccess(false);

    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    }, 1500);
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
          role: 'teacher',
          context: {
            teacher_name: teacher.name,
            course: teacher.activeCourse,
            total_enrolled: students.length,
            present: presentCount,
            absent: absentCount,
            attendance_rate: `${attendanceRate}%`,
            at_risk_students: students.filter((s) => s.attendancePct < 75).map((s) => ({ name: s.name, pct: s.attendancePct })),
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
          text: 'Unable to reach Gemini API. Class attendance is currently at 88%. Two students require formal notifications before the mid-term audit.',
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Format Elapsed Time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">SmartFace</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    LECTURER PORTAL
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Faculty & Classroom Command Suite</p>
              </div>
            </Link>
          </div>

          {/* Quick Portal Switcher & Teacher Pill */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Quick Switch Portals */}
            <div className="hidden md:flex items-center bg-slate-800/60 p-1 rounded-xl border border-white/5 text-xs">
              <Link
                href="/student"
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Student
              </Link>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium shadow-sm">
                Lecturer
              </span>
              <Link
                href="/admin"
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Admin Panel
              </Link>
            </div>

            {/* Active Class Pill */}
            {isSessionActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Active: {sessionRoom}</span>
              </div>
            )}

            {/* Teacher Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white border border-indigo-400/50">
                PM
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{teacher.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">Dept of CSE</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
        {/* Faculty Sub-Header Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/20 p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> {teacher.activeCourse}
                </span>
                <span className="text-xs text-slate-400">{teacher.room}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Classroom Command Center
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Session live duration:{' '}
                <span className="text-indigo-400 font-mono font-bold">{formatTime(sessionElapsedSeconds)}</span> •{' '}
                <span className="text-emerald-400 font-bold">{presentCount} present</span> •{' '}
                <span className="text-rose-400 font-bold">{absentCount} absent</span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('qr_projector')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Open QR Projector Mode</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('kiosk_scanner');
                  startKioskCamera();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>Webcam Kiosk Mode</span>
              </button>

              <button
                onClick={() => setActiveTab('gemini_copilot')}
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
            { id: 'command_center', label: 'Command Overview', icon: CalendarCheck },
            { id: 'qr_projector', label: 'Rotating QR Projector', icon: QrCode },
            { id: 'kiosk_scanner', label: 'Podium Biometric Kiosk', icon: Camera },
            { id: 'roster', label: 'Student Roster & Override', icon: Users },
            { id: 'leave_approvals', label: 'Leave Requests Inbox', icon: FileText },
            { id: 'at_risk', label: 'At-Risk Radar (<75%)', icon: AlertTriangle },
            { id: 'export_sync', label: 'Export & Google Sheets', icon: FileSpreadsheet },
            { id: 'gemini_copilot', label: 'Gemini 3.8 Flash Copilot', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  if (tab.id === 'kiosk_scanner') {
                    startKioskCamera();
                  } else {
                    stopKioskCamera();
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: COMMAND OVERVIEW */}
        {activeTab === 'command_center' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Attendance Rate</span>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{attendanceRate}%</span>
                  <span className="text-xs text-emerald-400 font-medium">{presentCount} Present</span>
                </div>
                <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Enrolled Students</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{students.length}</span>
                  <span className="text-xs text-slate-400">Total Enrolled</span>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">{sessionSection} • {sessionRoom}</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Absentees</span>
                  <UserX className="w-4 h-4 text-rose-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-rose-400">{absentCount}</span>
                  <span className="text-xs text-slate-400">Unaccounted</span>
                </div>
                <p className="mt-3 text-[11px] text-rose-400/80">Automated parent alerts ready</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Dynamic QR Cipher</span>
                  <QrCode className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold font-mono text-indigo-300">{qrToken}</span>
                </div>
                <p className="mt-3 text-[11px] text-indigo-400">Expires in {qrCountdown}s (Rotating)</p>
              </div>
            </div>

            {/* Active Session Control Panel */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Classroom Session Controller</h3>
                  <p className="text-xs text-slate-400">Configure attendance window and start/stop token broadcasts</p>
                </div>
                <div className="flex items-center gap-2">
                  {isSessionActive ? (
                    <button
                      onClick={() => setIsSessionActive(false)}
                      className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Square className="w-3.5 h-3.5 fill-rose-400" />
                      <span>End Attendance Session</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsSessionActive(true);
                        setSessionElapsedSeconds(0);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start New Attendance Session</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
                  <select
                    value={sessionSubject}
                    onChange={(e) => setSessionSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option>CS601 - Machine Learning</option>
                    <option>CS602 - Cloud Architecture</option>
                    <option>CS603 - Cryptography</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Section</label>
                  <select
                    value={sessionSection}
                    onChange={(e) => setSessionSection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option>Section A (6th Sem)</option>
                    <option>Section B (6th Sem)</option>
                    <option>Section C (4th Sem)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Classroom / Lab</label>
                  <input
                    type="text"
                    value={sessionRoom}
                    onChange={(e) => setSessionRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Session Duration</label>
                  <select
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Live Roster Preview */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Live Student Check-in Stream</h3>
                  <p className="text-xs text-slate-400">Real-time attendance logs as students scan or verify</p>
                </div>
                <button
                  onClick={() => setActiveTab('roster')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>Open Full Roster</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="pb-3 font-semibold">Student</th>
                      <th className="pb-3 font-semibold">Roll Number</th>
                      <th className="pb-3 font-semibold">Term %</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Verification Method</th>
                      <th className="pb-3 font-semibold">Time</th>
                      <th className="pb-3 font-semibold text-right">Quick Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {students.slice(0, 5).map((stu) => (
                      <tr key={stu.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 flex items-center gap-2.5">
                          <img
                            src={stu.avatar}
                            alt={stu.name}
                            className="w-7 h-7 rounded-full object-cover border border-white/10"
                          />
                          <span className="font-semibold text-white">{stu.name}</span>
                        </td>
                        <td className="py-3 font-mono text-slate-400">{stu.rollNo}</td>
                        <td className="py-3">
                          <span
                            className={`font-bold ${
                              stu.attendancePct >= 75 ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {stu.attendancePct}%
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              stu.status === 'Present'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : stu.status === 'Late'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : stu.status === 'Excused'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {stu.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-[11px]">
                          {stu.method || '—'}
                        </td>
                        <td className="py-3 font-mono text-slate-400 text-[11px]">
                          {stu.checkInTime || '—'}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleStatus(stu.id, 'Present')}
                              className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 text-[10px] font-bold cursor-pointer"
                              title="Mark Present"
                            >
                              P
                            </button>
                            <button
                              onClick={() => handleToggleStatus(stu.id, 'Late')}
                              className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 text-[10px] font-bold cursor-pointer"
                              title="Mark Late"
                            >
                              L
                            </button>
                            <button
                              onClick={() => handleToggleStatus(stu.id, 'Absent')}
                              className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 text-[10px] font-bold cursor-pointer"
                              title="Mark Absent"
                            >
                              A
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DYNAMIC ROTATING QR PROJECTOR */}
        {activeTab === 'qr_projector' && (
          <div
            className={`p-6 md:p-10 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl flex flex-col items-center justify-center text-center space-y-6 ${
              isFullScreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 p-12' : ''
            }`}
          >
            <div className="flex items-center justify-between w-full max-w-xl">
              <div className="text-left">
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CLASSROOM PROJECTOR SCREEN
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-1">{teacher.activeCourse}</h2>
                <p className="text-xs text-slate-400">{sessionSection} • {sessionRoom}</p>
              </div>

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors cursor-pointer"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Giant Rotating QR Card */}
            <div className="relative p-8 rounded-3xl bg-white shadow-2xl flex flex-col items-center justify-center">
              <QrCode className="w-64 h-64 md:w-80 md:h-80 text-slate-950" />

              {/* Center Holographic Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/90 backdrop-blur-md border-2 border-white flex items-center justify-center text-white font-extrabold text-base shadow-xl">
                  SF
                </div>
              </div>
            </div>

            {/* Countdown & Rotating Token Bar */}
            <div className="w-full max-w-md space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Rotating Anti-Proxy Token:</span>
                <span className="font-bold text-indigo-400 text-sm tracking-wider">{qrToken}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-white/10">
                <motion.div
                  key={qrCountdown}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(qrCountdown / 15) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Refreshes in {qrCountdown} seconds</span>
                <span className="text-emerald-400 font-bold">{presentCount} Students Logged In</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-sm">
              Students must scan this code using the SmartFace app. Screenshots will be rejected by dynamic timestamp validation.
            </p>
          </div>
        )}

        {/* TAB 3: PODIUM BIOMETRIC KIOSK */}
        {activeTab === 'kiosk_scanner' && (
          <div className="max-w-2xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-indigo-500/30 shadow-2xl space-y-6 text-center">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Lecturer Desk Terminal
              </span>
              <h2 className="text-2xl font-extrabold text-white">Podium Biometric Kiosk</h2>
              <p className="text-xs text-slate-400">
                Students walk up to the lecturer&apos;s desk to verify identity against the ArcFace database.
              </p>
            </div>

            {/* Video Viewfinder */}
            <div className="relative mx-auto w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-indigo-500/50 shadow-inner flex items-center justify-center">
              <video
                ref={kioskVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div
                  className={`relative w-44 h-44 rounded-3xl border-2 transition-all duration-300 ${
                    kioskScanning
                      ? 'border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.6)]'
                      : kioskGreeting
                      ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)]'
                      : 'border-white/30 border-dashed'
                  }`}
                >
                  {kioskScanning && (
                    <motion.div
                      animate={{ y: [0, 160, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                      className="w-full h-0.5 bg-indigo-400 shadow-[0_0_15px_#818cf8]"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Greeting notification */}
            {kioskGreeting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{kioskGreeting}</span>
              </motion.div>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                disabled={kioskScanning}
                onClick={handleKioskScan}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <Camera className="w-4 h-4" />
                <span>{kioskScanning ? 'Scanning Face...' : 'Scan Approaching Student'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: STUDENT ROSTER & MANUAL OVERRIDE */}
        {activeTab === 'roster' && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Full Classroom Attendance Roster</h3>
                <p className="text-xs text-slate-400">
                  {sessionSubject} • Total: {students.length} Enrolled
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or roll..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Excused">Excused</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Roll Number</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Semester %</th>
                    <th className="pb-3 font-semibold">Current Status</th>
                    <th className="pb-3 font-semibold">Check-in Time</th>
                    <th className="pb-3 font-semibold text-right">Manual Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.map((stu) => (
                    <tr key={stu.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 flex items-center gap-2.5">
                        <img
                          src={stu.avatar}
                          alt={stu.name}
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                        />
                        <span className="font-semibold text-white">{stu.name}</span>
                      </td>
                      <td className="py-3 font-mono text-slate-400">{stu.rollNo}</td>
                      <td className="py-3 text-slate-400">{stu.email}</td>
                      <td className="py-3">
                        <span
                          className={`font-bold ${
                            stu.attendancePct >= 75 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {stu.attendancePct}%
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            stu.status === 'Present'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : stu.status === 'Late'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : stu.status === 'Excused'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {stu.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-400">{stu.checkInTime || '—'}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(stu.id, 'Present')}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                              stu.status === 'Present'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 hover:bg-emerald-600/30 text-emerald-400'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleToggleStatus(stu.id, 'Late')}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                              stu.status === 'Late'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-800 hover:bg-amber-600/30 text-amber-400'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleToggleStatus(stu.id, 'Absent')}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                              stu.status === 'Absent'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-800 hover:bg-rose-600/30 text-rose-400'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleToggleStatus(stu.id, 'Excused')}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                              stu.status === 'Excused'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 hover:bg-blue-600/30 text-blue-400'
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: LEAVE REQUESTS APPROVAL INBOX */}
        {activeTab === 'leave_approvals' && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Student Leave Approval Inbox</h3>
                <p className="text-xs text-slate-400">Review pending medical and institutional leave submissions</p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {pendingLeaves.filter((l) => l.status === 'Pending').length} Pending
              </span>
            </div>

            <div className="space-y-3">
              {pendingLeaves.map((lv) => (
                <div
                  key={lv.id}
                  className="p-4 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{lv.studentName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {lv.rollNo}
                      </span>
                      <span className="text-xs font-semibold text-indigo-400">({lv.type})</span>
                    </div>
                    <p className="text-xs text-slate-300">{lv.reason}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Date Range: {lv.dates}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {lv.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => handleLeaveAction(lv.id, 'Approved')}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleLeaveAction(lv.id, 'Rejected')}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          lv.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {lv.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: AT-RISK ATTENDANCE RADAR */}
        {activeTab === 'at_risk' && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">At-Risk Student Attendance Radar</h3>
                <p className="text-xs text-slate-400">
                  Enrolled students below the mandatory 75% threshold who face semester debarment
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Action Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {students
                .filter((s) => s.attendancePct < 75)
                .map((stu) => (
                  <div
                    key={stu.id}
                    className="p-5 rounded-xl bg-slate-800/60 border border-amber-500/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={stu.avatar}
                          alt={stu.name}
                          className="w-10 h-10 rounded-full object-cover border border-amber-500/50"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-white">{stu.name}</h4>
                          <p className="text-xs text-slate-400 font-mono">{stu.rollNo}</p>
                        </div>
                      </div>
                      <span className="text-xl font-extrabold text-amber-400">{stu.attendancePct}%</span>
                    </div>

                    <div className="text-xs text-slate-300">
                      Must attend the next <span className="text-emerald-400 font-bold">4 classes</span> to reach
                      the 75% university eligibility line.
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => alert(`Official low-attendance warning dispatched to ${stu.email}`)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Official Warning Notice</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 7: EXPORT & GOOGLE SHEETS SYNC */}
        {activeTab === 'export_sync' && (
          <div className="max-w-2xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Institutional Data Integration
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-2">Export & Live Cloud Sync</h2>
              <p className="text-xs text-slate-400 mt-1">
                Synchronize attendance data directly into Google Sheets or generate print-ready Dean PDF reports.
              </p>
            </div>

            {/* Google Sheets Card */}
            <div className="p-5 rounded-xl bg-slate-800/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Google Sheets Live Replication</h4>
                    <p className="text-[11px] text-slate-400">Automated mirror to departmental master spreadsheet</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/5">
                <span>Last Synced: Today at 09:15 AM</span>
                <button
                  disabled={isSyncing}
                  onClick={handleSyncGoogleSheets}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
                </button>
              </div>

              {syncSuccess && (
                <p className="text-xs text-emerald-400 font-semibold text-center">
                  Successfully synced {students.length} attendance records to Google Cloud!
                </p>
              )}
            </div>

            {/* Export Formats */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => alert('Exporting Attendance to CSV...')}
                className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-center space-y-1 transition-colors cursor-pointer"
              >
                <Download className="w-5 h-5 mx-auto text-blue-400" />
                <p className="text-xs font-bold text-white">CSV Export</p>
                <p className="text-[10px] text-slate-400">Raw logs</p>
              </button>

              <button
                onClick={() => alert('Generating Dean PDF Report...')}
                className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-center space-y-1 transition-colors cursor-pointer"
              >
                <FileText className="w-5 h-5 mx-auto text-purple-400" />
                <p className="text-xs font-bold text-white">Dean PDF Report</p>
                <p className="text-[10px] text-slate-400">Formal printable</p>
              </button>

              <button
                onClick={() => alert('Exporting Excel Workbook...')}
                className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-center space-y-1 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-5 h-5 mx-auto text-emerald-400" />
                <p className="text-xs font-bold text-white">Excel Sheet</p>
                <p className="text-[10px] text-slate-400">Multi-tab format</p>
              </button>
            </div>
          </div>
        )}

        {/* TAB 8: GEMINI 3.8 FLASH COPILOT */}
        {activeTab === 'gemini_copilot' && (
          <div className="max-w-3xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-purple-500/30 shadow-2xl space-y-6 flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Gemini 3.8 Flash Faculty Copilot</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Classroom intelligence, anomaly detection, and automated notice drafting
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-xs space-y-1.5 leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
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
                    <span>Gemini 3.8 Flash is synthesizing classroom analytics...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestion Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                'Draft official attendance warning for Catherine Zeta',
                'Summarize today attendance trends',
                'Spot any proxy patterns in morning sessions',
                'Create 3 quick attendance quiz questions on ML Backprop',
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
                placeholder="Ask Gemini to draft notices, analyze absentees, or create lecture questions..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
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
        SmartFace Biometric Attendance Suite • Lecturer Portal • Version 2.0 • Secured by ArcFace ONNX & Gemini 3.8 Flash
      </footer>
    </div>
  );
}
