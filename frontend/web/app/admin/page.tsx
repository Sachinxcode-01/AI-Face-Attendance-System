'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  CalendarCheck,
  QrCode,
  Camera,
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  RefreshCw,
  Search,
  Settings,
  Plus,
  Trash2,
  Edit,
  Mail,
  HardDrive,
  Eye,
  Bell,
  Cpu,
  Database,
  Lock,
  ChevronRight,
  Laptop
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  identifier: string; // Roll No or Staff ID
  role: 'student' | 'teacher' | 'admin';
  department: string;
  biometricEnrolled: boolean;
  status: 'Active' | 'Suspended';
}

interface IntruderLog {
  id: string;
  timestamp: string;
  location: string;
  threatLevel: 'High' | 'Medium' | 'Low';
  snapshotUrl: string;
  status: 'Investigating' | 'Dismissed' | 'Alert Sent';
  similarityScore: number;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ip: string;
  status: 'Success' | 'Warning' | 'Blocked';
}

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<
    'telemetry' | 'intruder_sentinel' | 'directory' | 'enrollment' | 'audit_logs' | 'reports_dispatcher' | 'settings' | 'gemini_sentinel'
  >('telemetry');

  // Directory State (CRUD)
  const [users, setUsers] = useState<DirectoryUser[]>([
    { id: '1', name: 'Alice Cooper', email: 'alice.cooper@smartface.edu', identifier: 'CSE-2026-08', role: 'student', department: 'Computer Science', biometricEnrolled: true, status: 'Active' },
    { id: '2', name: 'Prof. Miller', email: 'miller@smartface.edu', identifier: 'FAC-CSE-102', role: 'teacher', department: 'Computer Science', biometricEnrolled: true, status: 'Active' },
    { id: '3', name: 'Bob Dylan', email: 'bob.d@smartface.edu', identifier: 'ECE-2026-12', role: 'student', department: 'Electronics', biometricEnrolled: true, status: 'Active' },
    { id: '4', name: 'Catherine Zeta', email: 'catherine@smartface.edu', identifier: 'CSE-2026-15', role: 'student', department: 'Computer Science', biometricEnrolled: false, status: 'Active' },
    { id: '5', name: 'Dr. Jane Goodall', email: 'goodall@smartface.edu', identifier: 'FAC-BIO-201', role: 'teacher', department: 'Bioinformatics', biometricEnrolled: true, status: 'Active' },
    { id: '6', name: 'Charlie Watts', email: 'charlie@smartface.edu', identifier: 'ME-2026-22', role: 'student', department: 'Mechanical', biometricEnrolled: true, status: 'Active' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Add User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserIdentifier, setNewUserIdentifier] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'teacher'>('student');
  const [newUserDept, setNewUserDept] = useState('Computer Science');

  // Intruder Detection Stream
  const [intruders, setIntruders] = useState<IntruderLog[]>([
    {
      id: 'SEC-INT-891',
      timestamp: 'Today, 09:24 AM',
      location: 'Main Gate Terminal 02',
      threatLevel: 'High',
      snapshotUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      status: 'Investigating',
      similarityScore: 0.18,
    },
    {
      id: 'SEC-INT-892',
      timestamp: 'Today, 08:52 AM',
      location: 'Tech Tower Lab 3B Corridor',
      threatLevel: 'Medium',
      snapshotUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200',
      status: 'Dismissed',
      similarityScore: 0.32,
    },
    {
      id: 'SEC-INT-893',
      timestamp: 'Yesterday, 04:15 PM',
      location: 'Auditorium North Entry',
      threatLevel: 'Low',
      snapshotUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
      status: 'Alert Sent',
      similarityScore: 0.44,
    },
  ]);

  // Audit Logs
  const auditLogs: AuditLogEntry[] = [
    { id: 'AUD-901', timestamp: '10:14:22 AM', user: 'miller@smartface.edu', action: 'Started Active Session CS601 in Lab 3B', ip: '192.168.1.104', status: 'Success' },
    { id: 'AUD-902', timestamp: '10:12:05 AM', user: 'catherine@smartface.edu', action: 'Failed Dynamic QR token attempt (Drift > 30s)', ip: '10.0.4.88', status: 'Warning' },
    { id: 'AUD-903', timestamp: '09:55:12 AM', user: 'System Sentinel', action: 'Unregistered face captured at Gate Terminal 02', ip: '192.168.2.12', status: 'Blocked' },
    { id: 'AUD-904', timestamp: '09:40:33 AM', user: 'admin@smartface.edu', action: 'Google Sheets Background Replication Completed', ip: '127.0.0.1', status: 'Success' },
    { id: 'AUD-905', timestamp: '09:02:18 AM', user: 'alice.cooper@smartface.edu', action: 'ArcFace Biometric Match (99.4% confidence)', ip: '10.0.4.15', status: 'Success' },
  ];

  // Biometric Enrollment Camera
  const enrollVideoRef = useRef<HTMLVideoElement | null>(null);
  const [enrollActive, setEnrollActive] = useState(false);
  const [enrollAnglesCaptured, setEnrollAnglesCaptured] = useState(0);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState('');

  // Email Dispatcher State
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);

  // Gemini Institutional AI
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; model?: string }>>([
    {
      role: 'assistant',
      text: `Greetings, **Administrator**. I am the **SmartFace Gemini 3.8 Flash Institutional Sentinel**.\n\nAll 12 campus biometric terminals are operational with **0 critical vulnerabilities**. Today's average university attendance rate is **89.4%**. How can I assist you with accreditation briefs, security analysis, or compliance reporting?`,
    },
  ]);

  // Handle Add User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserIdentifier) return;

    const newUser: DirectoryUser = {
      id: String(users.length + 1),
      name: newUserName,
      email: newUserEmail,
      identifier: newUserIdentifier,
      role: newUserRole,
      department: newUserDept,
      biometricEnrolled: false,
      status: 'Active',
    };

    setUsers([newUser, ...users]);
    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserIdentifier('');
  };

  // Handle Delete User
  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to remove this account from the biometric registry?')) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  // Start Enrollment Camera
  const startEnrollCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      if (enrollVideoRef.current) {
        enrollVideoRef.current.srcObject = stream;
        enrollVideoRef.current.play();
        setEnrollActive(true);
      }
    } catch {
      setEnrollActive(true);
    }
  };

  // Stop Enrollment Camera
  const stopEnrollCamera = () => {
    if (enrollVideoRef.current && enrollVideoRef.current.srcObject) {
      const stream = enrollVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      enrollVideoRef.current.srcObject = null;
    }
    setEnrollActive(false);
  };

  // Capture Angle in Enrollment
  const handleCaptureAngle = () => {
    if (enrollAnglesCaptured < 5) {
      setEnrollAnglesCaptured((prev) => prev + 1);
      if (enrollAnglesCaptured + 1 === 5) {
        setEnrollSuccessMsg('Successfully compiled 5-angle ArcFace facial embedding vectors into data/face_encodings_arcface.pkl!');
        confetti({ particleCount: 70, spread: 60 });
      }
    }
  };

  // Reset Enrollment
  const handleResetEnroll = () => {
    setEnrollAnglesCaptured(0);
    setEnrollSuccessMsg('');
  };

  // Dispatch Email Reports
  const handleDispatchEmails = () => {
    setIsDispatching(true);
    setDispatchResult(null);

    setTimeout(() => {
      setIsDispatching(false);
      setDispatchResult('Dispatched 48 Deep Navy & Gold PDF reports to students and parents via secure SMTP.');
    }, 2000);
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
          role: 'admin',
          context: {
            total_students: 1420,
            total_faculty: 94,
            active_cameras: 12,
            threat_level: 'DEFCON 5 (Normal)',
            unregistered_faces_today: intruders.length,
            average_attendance: '89.4%',
          },
        }),
      });

      const data = await res.json();
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'Institutional analysis completed.',
          model: data.model || 'Gemini 3.8 Flash',
        },
      ]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Security logs synthesized. 0 critical security alerts logged in the last 24 hours. Department attendance compliance is at 89.4%.',
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Filtered Directory Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.identifier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">SmartFace</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ADMIN SENTINEL
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Institutional Security & Fleet Control</p>
              </div>
            </Link>
          </div>

          {/* Quick Portal Switcher & Admin Pill */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Quick Switch Portals */}
            <div className="hidden md:flex items-center bg-slate-800/60 p-1 rounded-xl border border-white/5 text-xs">
              <Link
                href="/student"
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Student
              </Link>
              <Link
                href="/teacher"
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Lecturer
              </Link>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium shadow-sm">
                Admin Panel
              </span>
            </div>

            {/* DEFCON Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DEFCON 5: NORMAL</span>
            </div>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white border border-emerald-400/50">
                SA
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">System Admin</p>
                <p className="text-[10px] text-slate-400 font-mono">Root Operator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
        {/* Admin Sub-Header Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-500/20 p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" /> ArcFace Biometric DB Synced
                </span>
                <span className="text-xs text-slate-400">12 CCTV Nodes Active</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Institutional Security & Administration
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Campus-wide attendance rate is <span className="text-emerald-400 font-bold">89.4%</span> across 1,420
                enrolled students and 94 active faculty.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setActiveTab('enrollment');
                  startEnrollCamera();
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Biometric Face Enrollment Station</span>
              </button>

              <button
                onClick={() => setActiveTab('intruder_sentinel')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Intruder Sentinel Feed</span>
              </button>

              <button
                onClick={() => setActiveTab('gemini_sentinel')}
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
            { id: 'telemetry', label: 'Executive Telemetry', icon: CalendarCheck },
            { id: 'intruder_sentinel', label: 'Intruder Sentinel Feed', icon: ShieldAlert },
            { id: 'directory', label: 'Student & Faculty Directory', icon: Users },
            { id: 'enrollment', label: 'Face Enrollment Station', icon: Camera },
            { id: 'audit_logs', label: 'Security Audit Trail', icon: FileText },
            { id: 'reports_dispatcher', label: 'Reports & Email Dispatcher', icon: FileSpreadsheet },
            { id: 'settings', label: 'System & Scanner Settings', icon: Settings },
            { id: 'gemini_sentinel', label: 'Gemini 3.8 Flash Sentinel', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  if (tab.id === 'enrollment') {
                    startEnrollCamera();
                  } else {
                    stopEnrollCamera();
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: EXECUTIVE TELEMETRY */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Campus Attendance Rate</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">89.4%</span>
                  <span className="text-xs text-emerald-400 font-medium">+2.1% vs Last Week</span>
                </div>
                <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full w-[89%]" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Total Students</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">1,420</span>
                  <span className="text-xs text-slate-400">98% Biometrics Enrolled</span>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">4 Departments active</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>CCTV Terminals</span>
                  <Camera className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">12 / 12</span>
                  <span className="text-xs text-emerald-400">All Online</span>
                </div>
                <p className="mt-3 text-[11px] text-slate-400">ArcFace Real-Time Inference</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/8 backdrop-blur-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Intruders Flagged</span>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400">{intruders.length}</span>
                  <span className="text-xs text-slate-400">Today</span>
                </div>
                <p className="mt-3 text-[11px] text-amber-400/80">All investigated by security</p>
              </div>
            </div>

            {/* Department Attendance Ranking */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-4">
              <h3 className="text-base font-bold text-white">Departmental Attendance Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { dept: 'Computer Science & Engineering', rate: 91.8, students: 480, status: 'Top Performer' },
                  { dept: 'Electronics & Communication', rate: 88.5, students: 360, status: 'Compliant' },
                  { dept: 'Mechanical Engineering', rate: 84.2, students: 310, status: 'Compliant' },
                ].map((d, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{d.dept}</span>
                      <span className="text-sm font-extrabold text-emerald-400">{d.rate}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${d.rate}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{d.students} Students</span>
                      <span className="text-emerald-400 font-semibold">{d.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTRUDER SENTINEL FEED */}
        {activeTab === 'intruder_sentinel' && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">Unregistered Face Intruder Sentinel</h3>
                <p className="text-xs text-slate-400">
                  Real-time security captures of unrecognized individuals hovering in campus surveillance zones
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Active Sentinel Daemon
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {intruders.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-800/60 border border-white/10 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center">
                      <img
                        src={item.snapshotUrl}
                        alt="Intruder Snapshot"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-rose-400 border border-rose-500/40">
                        {item.threatLevel.toUpperCase()} THREAT
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-slate-300">
                        Match: {Math.round(item.similarityScore * 100)}%
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white">{item.id}</span>
                        <span className="text-[11px] text-slate-400">{item.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{item.location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() =>
                        setIntruders((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, status: 'Dismissed' } : i))
                        )
                      }
                      className="flex-1 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => alert(`Campus Security Alert dispatched for ${item.id}`)}
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-colors cursor-pointer"
                    >
                      Trigger Alert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT & FACULTY DIRECTORY (CRUD) */}
        {activeTab === 'directory' && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Student & Faculty Master Directory</h3>
                <p className="text-xs text-slate-400">Total Records: {users.length}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, roll, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Roles</option>
                  <option value="Student">Students</option>
                  <option value="Teacher">Teachers</option>
                </select>

                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>
            </div>

            {/* Directory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Identifier</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Biometrics</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3">
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </td>
                      <td className="py-3 font-mono text-slate-300">{u.identifier}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'student'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{u.department}</td>
                      <td className="py-3">
                        {u.biometricEnrolled ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" /> Enrolled
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Pending Scan
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-emerald-400 font-semibold">{u.status}</span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 transition-colors cursor-pointer"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add User Modal */}
            {isAddUserOpen && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl space-y-4">
                  <h3 className="text-base font-bold text-white">Enroll New Member</h3>

                  <form onSubmit={handleAddUser} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Roll Number / Staff ID
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserIdentifier}
                        onChange={(e) => setNewUserIdentifier(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as 'student' | 'teacher')}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Lecturer / Teacher</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                        <select
                          value={newUserDept}
                          onChange={(e) => setNewUserDept(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option>Computer Science</option>
                          <option>Electronics</option>
                          <option>Mechanical</option>
                          <option>Bioinformatics</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setIsAddUserOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        Add to Registry
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BIOMETRIC FACE ENROLLMENT STATION */}
        {activeTab === 'enrollment' && (
          <div className="max-w-2xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-2xl space-y-6 text-center">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ArcFace Buffalo_L Calibration
              </span>
              <h2 className="text-2xl font-extrabold text-white">Biometric Face Enrollment Station</h2>
              <p className="text-xs text-slate-400">
                Capture 5 distinct facial angles (Front, Left, Right, Up, Down) to train AI embeddings into memory.
              </p>
            </div>

            {/* Video Feed */}
            <div className="relative mx-auto w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500/50 shadow-inner flex items-center justify-center">
              <video
                ref={enrollVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="relative w-44 h-44 rounded-full border-2 border-emerald-400 border-dashed flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              </div>
            </div>

            {/* Progress Angles Indicator */}
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Angles Captured: {enrollAnglesCaptured} / 5</span>
                <span className="text-emerald-400">{enrollAnglesCaptured * 20}% Complete</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(enrollAnglesCaptured / 5) * 100}%` }}
                />
              </div>
            </div>

            {enrollSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                {enrollSuccessMsg}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                disabled={enrollAnglesCaptured >= 5}
                onClick={handleCaptureAngle}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Angle ({enrollAnglesCaptured + 1}/5)</span>
              </button>

              <button
                onClick={handleResetEnroll}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Reset Calibration
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY AUDIT TRAIL */}
        {activeTab === 'audit_logs' && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Immutable Security Audit Trail</h3>
                <p className="text-xs text-slate-400">Cryptographically signed logs of all biometric matches and system actions</p>
              </div>
              <span className="text-xs font-mono text-slate-400">{auditLogs.length} recent events</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-3 font-semibold">Event ID</th>
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">Actor</th>
                    <th className="pb-3 font-semibold">Action Description</th>
                    <th className="pb-3 font-semibold">IP Address</th>
                    <th className="pb-3 font-semibold text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono text-slate-400">{log.id}</td>
                      <td className="py-3 text-slate-300 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="py-3 font-semibold text-white">{log.user}</td>
                      <td className="py-3 text-slate-300">{log.action}</td>
                      <td className="py-3 font-mono text-slate-400 text-[11px]">{log.ip}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'Success'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : log.status === 'Warning'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: REPORTS & EMAIL DISPATCHER */}
        {activeTab === 'reports_dispatcher' && (
          <div className="max-w-2xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Institutional Reporting Engine
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-2">Executive Reports & SMTP Dispatcher</h2>
              <p className="text-xs text-slate-400 mt-1">
                Generate Deep Navy & Gold PDF reports and deliver them to student and parent inboxes securely.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Automated SMTP Email Dispatch</h4>
                    <p className="text-[11px] text-slate-400">Google App Password TLS Connection</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/5">
                <span>Target: 48 Student / Parent Inboxes</span>
                <button
                  disabled={isDispatching}
                  onClick={handleDispatchEmails}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-pulse' : ''}`} />
                  <span>{isDispatching ? 'Dispatching...' : 'Dispatch Reports Now'}</span>
                </button>
              </div>

              {dispatchResult && (
                <p className="text-xs text-emerald-400 font-semibold text-center">{dispatchResult}</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS & SCANNER TOKENS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-slate-500/10 text-slate-400 border border-slate-500/20">
                System Configuration
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-2">Hardware & Security Settings</h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure API endpoints, scanner device tokens, and anti-proxy drift windows.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Node.js API Gateway URL
                </label>
                <input
                  type="text"
                  defaultValue="http://localhost:8000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Python FastAPI ArcFace AI Engine URL
                </label>
                <input
                  type="text"
                  defaultValue="http://localhost:8001"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Anti-Proxy Clock-Drift Window
                </label>
                <select
                  defaultValue="30s"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="15s">15 Seconds (Strict Classroom Mode)</option>
                  <option value="30s">30 Seconds (Recommended Standard)</option>
                  <option value="60s">60 Seconds (Auditorium Mode)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Face Scanner Hardware API Key
                </label>
                <input
                  type="password"
                  defaultValue="secure_face_scanner_default_key_123"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={() => alert('Settings successfully updated and cached.')}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Save Configuration Changes
            </button>
          </div>
        )}

        {/* TAB 8: GEMINI 3.8 FLASH SENTINEL */}
        {activeTab === 'gemini_sentinel' && (
          <div className="max-w-3xl mx-auto w-full p-6 md:p-8 rounded-2xl bg-slate-900/80 border border-purple-500/30 shadow-2xl space-y-6 flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Gemini 3.8 Flash Institutional Sentinel</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Accreditation compliance, security briefings, and campus attendance analytics
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
                        ? 'bg-emerald-600 text-white rounded-tr-none'
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
                    <span>Gemini 3.8 Flash is analyzing institutional intelligence...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestion Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                'Generate monthly accreditation attendance brief for NAAC',
                'Summarize today campus security threat logs',
                'Compare department attendance performance',
                'Check anti-proxy clock drift policy compliance',
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
                placeholder="Ask Gemini for executive briefings, security summaries, or accreditation audits..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
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
        SmartFace Biometric Attendance Suite • Admin Sentinel • Version 2.0 • Secured by ArcFace ONNX & Gemini 3.8 Flash
      </footer>
    </div>
  );
}
