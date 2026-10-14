/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Flame,
  Award,
  BookOpen,
  CalendarCheck,
  Send,
  MessageSquare,
  Sparkles,
  FileText,
  Clock,
  ChevronRight,
  ShieldCheck,
  Plus,
  Camera,
  CheckCircle2,
  ScanLine,
  Sliders,
  AlertTriangle,
  X,
  Zap,
  Check,
  RotateCcw,
  TrendingUp,
  Calculator,
  MapPin,
  Search,
  Download,
  GraduationCap
} from 'lucide-react';
import AttendanceRing from '@/components/portal/attendance-ring';
import { DashboardCard, StatusBadge, SkeletonLoader, EmptyState } from '@/components/portal/ui-helpers';
import { CustomAreaChart, AttendanceHeatmap } from '@/components/portal/custom-charts';
import { api } from '@/lib/api';
import confetti from 'canvas-confetti';

interface PortalProps {
  forceTab?: string;
}

interface SubjectItem {
  code: string;
  name: string;
  present: number;
  total: number;
  percent: number;
}

const FALLBACK_TIMETABLE = [
  { id: '1', day: 'Monday', time: '09:00 AM - 10:30 AM', subject: 'Software Engineering (CSE-302)', room: 'Room 401', instructor: 'Prof. Miller' },
  { id: '2', day: 'Monday', time: '11:00 AM - 12:30 PM', subject: 'Machine Learning (CSE-303)', room: 'Lab 3B', instructor: 'Dr. Jane Goodall' },
  { id: '3', day: 'Monday', time: '02:00 PM - 03:30 PM', subject: 'Cloud Computing (CSE-304)', room: 'Room 402', instructor: 'Dr. S. K. Roy' },
  { id: '4', day: 'Tuesday', time: '09:30 AM - 11:00 AM', subject: 'Distributed Systems (CSE-305)', room: 'Room 305', instructor: 'Prof. A. Kumar' },
  { id: '5', day: 'Tuesday', time: '11:30 AM - 01:00 PM', subject: 'Compiler Design (CSE-306)', room: 'Room 302', instructor: 'Dr. R. Sharma' },
  { id: '6', day: 'Wednesday', time: '09:00 AM - 10:30 AM', subject: 'AI & Neural Networks (CSE-307)', room: 'Seminar Hall', instructor: 'Prof. Miller' },
  { id: '7', day: 'Wednesday', time: '01:30 PM - 04:30 PM', subject: 'Deep Learning Practical Lab', room: 'High-Perf Lab 1', instructor: 'Dr. Jane Goodall' },
  { id: '8', day: 'Thursday', time: '10:00 AM - 11:30 AM', subject: 'Software Engineering (CSE-302)', room: 'Room 401', instructor: 'Prof. Miller' },
  { id: '9', day: 'Thursday', time: '02:00 PM - 03:30 PM', subject: 'Cloud Computing (CSE-304)', room: 'Room 402', instructor: 'Dr. S. K. Roy' },
  { id: '10', day: 'Friday', time: '09:00 AM - 10:30 AM', subject: 'Machine Learning (CSE-303)', room: 'Lab 3B', instructor: 'Dr. Jane Goodall' },
  { id: '11', day: 'Friday', time: '11:00 AM - 12:30 PM', subject: 'Computer Networks (CSE-308)', room: 'Room 201', instructor: 'Dr. V. Patel' }
];

export default function StudentDashboard({ forceTab }: PortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'timetable' | 'analytics' | 'leave' | 'chat'>(
    (forceTab as any) || 'overview'
  );

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');


  // Mark Attendance Modal & Camera States
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [markMethod, setMarkMethod] = useState<'token' | 'face'>('token');
  const [manualSessionId, setManualSessionId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [isMarking, setIsMarking] = useState(false);
  const [markFeedback, setMarkFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Timetable states
  const [timetableSlots, setTimetableSlots] = useState<any[]>(FALLBACK_TIMETABLE);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = dayNames[new Date().getDay()];
      if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(today)) {
        return today;
      }
    }
    return 'Monday';
  });
  const [timetableSearch, setTimetableSearch] = useState('');
  const [timePeriodFilter, setTimePeriodFilter] = useState<'all' | 'am' | 'pm'>('all');

  // Attendance Goal & Bunk Calculator
  const [targetGoal, setTargetGoal] = useState<number>(75);
  const [bunkSubject, setBunkSubject] = useState<string>('all');
  const [simMissed, setSimMissed] = useState<number>(0);
  const [simAttended, setSimAttended] = useState<number>(0);

  // Student stats from API
  const [stats, setStats] = useState<any>(null);

  // Leave balance from API
  const [leaveBalance, setLeaveBalance] = useState<any>({
    sick: 10,
    personal: 15,
    emergency: 5,
    academic: 12
  });

  // Leave Applications states
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({ type: 'Sick', start: '', end: '', reason: '' });

  // AI Chat Assistant states
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'ai', text: 'Hello! I am your SmartFace AI Academic Analyst. Ask me about your attendance compliance, streaks, or leave requests.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Manage Camera Stream for Face Verification
  useEffect(() => {
    if (markModalOpen && markMethod === 'face') {
      let active = true;
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { width: 640, height: 480 } })
          .then((stream) => {
            if (!active) {
              stream.getTracks().forEach((t) => t.stop());
              return;
            }
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.warn('Camera preview not available:', err);
          });
      }
      return () => {
        active = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }
  }, [markModalOpen, markMethod]);

  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('userEmail') || 'student@smartface.pro';
        if (!token) {
          setErrorMsg('No token found. Please log in.');
          setIsLoading(false);
          return;
        }

        // Fetch stats
        const statsData = await api.getStudentStats(email, token);
        setStats(statsData);

        // Fetch active session
        try {
          const activeSess = await api.getActiveSession();
          if (activeSess && (activeSess.session_id || activeSess.id)) {
            setManualSessionId(activeSess.session_id || activeSess.id);
          }
        } catch (e) {
          console.error("Failed to load active session:", e);
        }

        // Fetch timetable
        try {
          const tData = await api.getTimetable(token);
          if (Array.isArray(tData) && tData.length > 0) {
            setTimetableSlots(tData);
          }
        } catch (e) {
          console.error("Failed to load timetable:", e);
        }

        // Fetch leave balance
        try {
          const balanceData = await api.getLeaveBalance(email, token);
          setLeaveBalance(balanceData);
        } catch (e) {
          console.error("Failed to load leave balance:", e);
        }

        // Fetch leaves
        try {
          const leavesData = await api.getStudentLeaves(email, token);
          const formattedLeaves = leavesData.map((l: any) => ({
            id: l.id,
            type: l.leave_type || 'Personal',
            start: typeof l.start_date === 'string' ? l.start_date.split('T')[0] : l.start_date,
            end: typeof l.end_date === 'string' ? l.end_date.split('T')[0] : l.end_date,
            reason: l.reason,
            status: l.status,
            reviewer: l.remarks ? `Remarks: ${l.remarks}` : null
          }));
          setLeaves(formattedLeaves);
        } catch (e) {
          console.error("Failed to load leaves:", e);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to load student dashboard data.');
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMarking(true);
    setMarkFeedback(null);
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail') || 'student@smartface.pro';

    if (!token) {
      setMarkFeedback({ success: false, message: 'Authorization token not found. Please log in.' });
      setIsMarking(false);
      return;
    }

    try {
      if (markMethod === 'token') {
        if (!manualToken.trim()) {
          setMarkFeedback({ success: false, message: 'Please enter the session QR code or passcode.' });
          setIsMarking(false);
          return;
        }
        const sessId = manualSessionId.trim() || 'default_session';
        const res = await api.markAttendance(email, sessId, manualToken.trim(), token);
        setMarkFeedback({ success: true, message: res?.message || 'Attendance verified & logged successfully!' });
      } else {
        // Face Snapshot capture
        let blob: Blob | null = null;
        if (videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
          }
        }

        const formData = new FormData();
        if (blob) {
          formData.append('image', blob, 'face_snapshot.jpg');
        }
        if (manualSessionId) {
          formData.append('session_id', manualSessionId);
        }

        const res = await api.markFaceAttendance(formData, token);
        setMarkFeedback({ success: true, message: res?.message || 'Face biometrics matched! Attendance recorded.' });
      }

      // Refresh student stats
      const updatedStats = await api.getStudentStats(email, token);
      setStats(updatedStats);
    } catch (err: any) {
      setMarkFeedback({
        success: false,
        message: err?.message || 'Verification failed. Please check your QR code or face alignment.'
      });
    } finally {
      setIsMarking(false);
    }
  };


  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.start || !newLeave.end || !newLeave.reason) return;

    try {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail') || 'student@smartface.pro';
      if (!token) return;

      const payload = {
        user_id: email,
        reason: newLeave.reason,
        start_date: new Date(newLeave.start).toISOString(),
        end_date: new Date(newLeave.end).toISOString(),
        leave_type: newLeave.type,
        status: 'Pending'
      };

      const result = await api.applyLeave(payload, token);

      const added = {
        id: result.id,
        type: newLeave.type,
        start: newLeave.start,
        end: newLeave.end,
        reason: newLeave.reason,
        status: 'Pending',
        reviewer: null
      };
      setLeaves(prev => [added, ...prev]);

      // Refresh leave balance
      const balanceData = await api.getLeaveBalance(email, token);
      setLeaveBalance(balanceData);

      setNewLeave({ type: 'Sick', start: '', end: '', reason: '' });
      setLeaveModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to submit leave request.");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail') || 'student@smartface.pro';
      if (!token) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: 'Error: No active token. Please log in.' }]);
        setChatLoading(false);
        return;
      }

      const response = await api.askAi(email, currentInput, token);
      setChatMessages(prev => [...prev, { sender: 'ai', text: response.answer }]);
      setChatLoading(false);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: `Failed to consult AI Analyst: ${err.message || 'Server offline'}` }]);
      setChatLoading(false);
    }
  };

  // Celebrate streak with confetti particles
  const triggerStreakCelebration = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#F97316', '#EF4444', '#10B981', '#6366F1']
      });
    } catch (e) {
      console.log('Confetti triggered', e);
    }
  };

  // Export Timetable as RFC-5545 iCalendar (.ics)
  const handleExportIcs = () => {
    try {
      const dayMap: { [key: string]: string } = {
        monday: 'MO',
        tuesday: 'TU',
        wednesday: 'WE',
        thursday: 'TH',
        friday: 'FR',
        saturday: 'SA',
        sunday: 'SU',
      };

      const now = new Date();
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const timeStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SmartFace AI//Academic Timetable//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:SmartFace Academic Schedule',
        'X-WR-TIMEZONE:Asia/Kolkata',
      ];

      timetableSlots.forEach((slot, index) => {
        const dayCode = dayMap[(slot.day || 'Monday').toLowerCase()] || 'MO';
        const timeParts = (slot.time || '09:00 AM - 10:30 AM').split('-');
        let startTimeStr = timeParts[0]?.trim() || '09:00 AM';
        let endTimeStr = timeParts[1]?.trim() || '10:30 AM';

        const parseTo24h = (t: string) => {
          const isPm = t.toUpperCase().includes('PM');
          const isAm = t.toUpperCase().includes('AM');
          const cleaned = t.replace(/(AM|PM)/gi, '').trim();
          const [hStr, mStr] = cleaned.split(':');
          let h = parseInt(hStr || '9', 10);
          const m = parseInt(mStr || '0', 10);
          if (isPm && h < 12) h += 12;
          if (isAm && h === 12) h = 0;
          return { h, m };
        };

        const start24 = parseTo24h(startTimeStr);
        const end24 = parseTo24h(endTimeStr);

        const dayIndexes: { [key: string]: number } = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };
        const targetDayIdx = dayIndexes[dayCode] ?? 1;
        const currentDayIdx = now.getDay();
        let diffDays = targetDayIdx - currentDayIdx;
        if (diffDays <= 0) diffDays += 7;

        const eventDate = new Date(now);
        eventDate.setDate(now.getDate() + diffDays);
        const y = eventDate.getFullYear();
        const mon = pad(eventDate.getMonth() + 1);
        const d = pad(eventDate.getDate());

        const dtStart = `${y}${mon}${d}T${pad(start24.h)}${pad(start24.m)}00`;
        const dtEnd = `${y}${mon}${d}T${pad(end24.h)}${pad(end24.m)}00`;

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:smartface-slot-${slot.id || index}-${timeStamp}@smartface.pro`,
          `DTSTAMP:${timeStamp}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=20261231T235959Z`,
          `SUMMARY:${slot.subject || 'Lecture'}`,
          `LOCATION:${slot.room || 'Campus Room'}`,
          `DESCRIPTION:Instructor: ${slot.instructor || 'Faculty Member'}\\nSmartFace Dynamic Biometric Attendance Verified`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-PT15M',
          'ACTION:DISPLAY',
          `DESCRIPTION:Reminder: ${slot.subject || 'Lecture'} starts in 15 minutes at ${slot.room || 'Classroom'}`,
          'END:VALARM',
          'END:VEVENT'
        );
      });

      icsContent.push('END:VCALENDAR');

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'SmartFace_Academic_Timetable.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export .ics calendar:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12">
        <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
        <SkeletonLoader count={4} className="h-32 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Format subjects list dynamically
  const subjects: SubjectItem[] = (stats?.subjects || []).map((s: any, idx: number) => ({
    code: s.subject.includes('-') ? s.subject.split(' ')[0] : (s.subject.substring(0, 3).toUpperCase() + '-' + (300 + idx)),
    name: s.subject.includes('-') ? s.subject.split('-')[1].trim() : s.subject,
    present: s.present,
    total: s.total,
    percent: Math.round(s.percentage * 100)
  }));

  const studentCompliance = stats?.overall_percentage ? Math.round(stats.overall_percentage * 100) : 81;
  const trendData = [
    { label: 'W1', value: 78 },
    { label: 'W2', value: 82 },
    { label: 'W3', value: 80 },
    { label: 'W4', value: 85 },
    { label: 'W5', value: 83 },
    { label: 'W6', value: 79 },
    { label: 'W7', value: studentCompliance }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top statistics banners */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Circular overall tracker */}
          <DashboardCard className="col-span-1 md:col-span-2 flex items-center justify-between gap-6" glow>
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest block">
                Average Compliance
              </span>
              <h3 className="text-xl font-black text-white font-sans">
                {typeof window !== 'undefined' ? (localStorage.getItem('userEmail')?.split('@')[0].toUpperCase().replace('.', ' ') || 'ALICE COOPER') : 'ALICE COOPER'}
              </h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Your general compliance is standing at <span className="text-emerald-400 font-bold">{stats?.overall_percentage ? Math.round(stats.overall_percentage * 100) : 81.5}%</span>. Nice job, you are above the institution minimum.
              </p>
            </div>
            <AttendanceRing percentage={stats?.overall_percentage ? Math.round(stats.overall_percentage * 100) : 81} size={110} />
          </DashboardCard>

          {/* Streak details */}
          <DashboardCard className="flex flex-col justify-between" glow={(stats?.streak ?? 14) >= 14}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
                  Active Streak
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white font-sans">{stats?.streak ?? 14} Days</span>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    {(stats?.streak ?? 14) >= 30 ? '🥇 Gold' : (stats?.streak ?? 14) >= 14 ? '🥈 Silver' : '🥉 Bronze'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={triggerStreakCelebration}
                title="Celebrate your attendance streak!"
                className="p-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Flame className="w-5 h-5 fill-orange-400" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="tracking-wider uppercase">CONSECUTIVE RECORD</span>
              <button
                type="button"
                onClick={triggerStreakCelebration}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Celebrate
              </button>
            </div>
          </DashboardCard>

          {/* Institutional Rank */}
          <DashboardCard className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
                  Academic Rank
                </span>
                <span className="text-3xl font-black text-white font-sans">{stats?.rank || "#12 / 120"}</span>
              </div>
              <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-450">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-4">
              DEPARTMENT DENSITY SCORE
            </p>
          </DashboardCard>
        </div>
      )}

      {/* Main tab select headers + Action Buttons */}
      {!forceTab && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5 scroll-x overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'overview', name: 'Overview', icon: BookOpen },
              { id: 'attendance', name: 'Attendance Records', icon: CalendarCheck },
              { id: 'timetable', name: 'Class Timetable', icon: Clock },
              { id: 'analytics', name: 'Analytics & Bunk Planner', icon: Award },
              { id: 'leave', name: 'Leave Requests', icon: Calendar },
              { id: 'chat', name: 'AI Analyst Chat', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-sans transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white border border-white/15 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={async () => {
              setMarkModalOpen(true);
              setMarkFeedback(null);
              if (!manualSessionId) {
                try {
                  const activeSess = await api.getActiveSession();
                  if (activeSess && (activeSess.session_id || activeSess.id)) {
                    setManualSessionId(activeSess.session_id || activeSess.id);
                  }
                } catch {
                  // ignore
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-linear-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Camera className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
        </div>
      )}

      {/* ─── TAB CONTENT PANELS ──────────────────────────────────────── */}

      {/* 1. OVERVIEW VIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left subject breakdowns */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardCard>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-extrabold text-sm font-sans">Subject-wise Compliance</h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                  Semester 6
                </span>
              </div>

              <div className="space-y-4">
                {subjects.map((sub) => (
                  <div key={sub.code} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-white/5 bg-slate-900/10">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                        {sub.code}
                      </span>
                      <h4 className="text-xs font-bold text-white font-sans">{sub.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Present: {sub.present} / {sub.total} sessions
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-bold ${
                        sub.percent > 75 ? 'text-emerald-400' : sub.percent > 65 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {sub.percent}%
                      </span>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sub.percent > 75 ? 'bg-emerald-500' : sub.percent > 65 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${sub.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>

          {/* Right upcoming schedule & quick actions */}
          <div className="space-y-6">
            {/* Upcoming class items */}
            <DashboardCard>
              <h3 className="font-extrabold text-sm font-sans mb-4">Today's Lectures</h3>
              <div className="space-y-3.5">
                {[
                  { time: '09:00 - 10:30 AM', subject: 'Distributed Databases', room: 'Lab 4B', instructor: 'Dr. Evans' },
                  { time: '11:00 - 12:30 PM', subject: 'Discrete Mathematics', room: 'Hall B', instructor: 'Prof. Miller' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 border border-white/5 rounded-xl bg-slate-950/20 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-primary font-bold uppercase tracking-wider">
                        {item.time}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">{item.room}</span>
                    </div>
                    <h4 className="font-bold text-white font-sans">{item.subject}</h4>
                    <p className="text-[10px] text-slate-400 font-sans">{item.instructor}</p>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </div>
      )}

      {/* 2. TIMETABLE & SCHEDULE VIEW */}
      {activeTab === 'timetable' && (() => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // Filter slots by selected day, search, and timePeriod
        const daySlots = timetableSlots.filter(
          (slot) => (slot.day || 'Monday').toLowerCase() === selectedDay.toLowerCase()
        );

        const filteredSlots = daySlots.filter((slot) => {
          if (timetableSearch.trim()) {
            const q = timetableSearch.toLowerCase();
            const matchSub = (slot.subject || '').toLowerCase().includes(q);
            const matchRoom = (slot.room || '').toLowerCase().includes(q);
            const matchInst = (slot.instructor || '').toLowerCase().includes(q);
            if (!matchSub && !matchRoom && !matchInst) return false;
          }

          if (timePeriodFilter === 'am') {
            return (slot.time || '').toLowerCase().includes('am');
          } else if (timePeriodFilter === 'pm') {
            return (slot.time || '').toLowerCase().includes('pm');
          }
          return true;
        });

        // Metrics for the day
        const totalDayClasses = daySlots.length;
        const labClasses = daySlots.filter((s) => (s.subject || '').toLowerCase().includes('lab') || (s.subject || '').toLowerCase().includes('practical')).length;
        const theoryClasses = totalDayClasses - labClasses;

        return (
          <div className="space-y-6 font-sans">
            {/* Top Overview Pods */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Active Day</span>
                <span className="text-xl font-black text-amber-400 font-sans flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {selectedDay}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">Semester 6 CSE</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Lectures Today</span>
                <span className="text-xl font-black text-white font-sans">{totalDayClasses} Sessions</span>
                <span className="text-[10px] text-slate-400 font-mono block">Scheduled Classes</span>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 block">Practical Labs</span>
                <span className="text-xl font-black text-blue-400 font-sans">{labClasses} Labs</span>
                <span className="text-[10px] text-slate-400 font-mono block">Hands-on Sessions</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block">Theory Slots</span>
                <span className="text-xl font-black text-emerald-400 font-sans">{theoryClasses} Lectures</span>
                <span className="text-[10px] text-slate-400 font-mono block">Classroom Theory</span>
              </div>
            </div>

            {/* Navigation & Controls Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
              {/* Day Selector with Counts */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scroll-x">
                {days.map((day) => {
                  const count = timetableSlots.filter((s) => (s.day || 'Monday').toLowerCase() === day.toLowerCase()).length;
                  const isSelected = selectedDay.toLowerCase() === day.toLowerCase();

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-mono transition whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                          : 'text-slate-400 hover:text-white bg-slate-950/60 border border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span>{day}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Today Jump & iCal Export */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportIcs}
                  className="px-3 py-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Export full semester timetable to Apple Calendar, Google Calendar, or Outlook (.ics)"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sync to Calendar (.ics)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const today = dayNames[new Date().getDay()];
                    setSelectedDay(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(today) ? today : 'Monday');
                  }}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Today</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by course, room code, or instructor..."
                  value={timetableSearch}
                  onChange={(e) => setTimetableSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-100 placeholder:opacity-60 focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition font-sans"
                />
                {timetableSearch && (
                  <button
                    onClick={() => setTimetableSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Time Period Filter Chips */}
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5 shrink-0 self-start sm:self-auto">
                {[
                  { id: 'all', label: 'All Times' },
                  { id: 'am', label: 'Morning (AM)' },
                  { id: 'pm', label: 'Afternoon (PM)' }
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setTimePeriodFilter(chip.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition cursor-pointer ${
                      timePeriodFilter === chip.id
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slot Cards Grid */}
            {filteredSlots.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/30 border border-white/5 text-center space-y-3">
                <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Lectures Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {timetableSearch || timePeriodFilter !== 'all'
                    ? 'No scheduled classes match your current search or time filter.'
                    : `No classes are scheduled on ${selectedDay}. Enjoy your academic study break!`}
                </p>
                {(timetableSearch || timePeriodFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setTimetableSearch('');
                      setTimePeriodFilter('all');
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-xs text-white rounded-lg font-mono transition cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSlots.map((slot, idx) => {
                  const isLab = (slot.subject || '').toLowerCase().includes('lab') || (slot.subject || '').toLowerCase().includes('practical');

                  return (
                    <DashboardCard key={slot.id || idx} className="space-y-4 relative overflow-hidden group hover:border-amber-400/30 transition-all flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Time & Type Badges */}
                        <div className="flex justify-between items-center gap-2">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-white/10 text-[10px] font-mono text-amber-400 font-bold">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {slot.time}
                          </span>

                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                            isLab
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {isLab ? 'Practical Lab' : 'Theory'}
                          </span>
                        </div>

                        {/* Subject Title */}
                        <div>
                          <h4 className="font-bold text-white text-sm group-hover:text-amber-400 transition leading-snug">
                            {slot.subject}
                          </h4>
                        </div>

                        {/* Location and Instructor Meta */}
                        <div className="space-y-1.5 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="font-mono text-[11px] text-slate-300">{slot.room || 'Room TBA'}</span>
                          </div>
                          {slot.instructor && (
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="text-[11px] text-slate-300 font-sans">
                                {slot.instructor}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer: Live Biometric Readiness & Fast Check-In Action */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-emerald-400 flex items-center gap-1.5 font-mono text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Biometric Ready</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setMarkModalOpen(true);
                            setMarkFeedback(null);
                            if (slot.id) {
                              setManualSessionId(`SES-${slot.id}`);
                            }
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-amber-400 hover:text-slate-950 text-slate-300 text-[10px] font-mono font-bold rounded-lg border border-white/10 hover:border-amber-400 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Check In</span>
                        </button>
                      </div>
                    </DashboardCard>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* 2. ATTENDANCE HISTORIC PANEL */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <DashboardCard>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-sm font-sans">Attendance Heatmap</h3>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                16-Week Semester Density
              </span>
            </div>
            <AttendanceHeatmap />
          </DashboardCard>

          {/* Historical Logs List */}
          <DashboardCard>
            <h3 className="font-extrabold text-sm font-sans mb-4">Historical Records</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs leading-normal">
                <thead>
                  <tr className="border-b border-white/5 font-mono text-slate-500 uppercase text-[9px]">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Subject</th>
                    <th className="pb-3">Session</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { date: '2026-06-18', subject: 'Deep Learning Systems', id: 'SES-09', status: 'Present', method: 'Dynamic QR Scan' },
                    { date: '2026-06-17', subject: 'Software Engineering', id: 'SES-08', status: 'Present', method: 'Dynamic QR Scan' },
                    { date: '2026-06-16', subject: 'Discrete Mathematics', id: 'SES-07', status: 'Late', method: 'Manual Override' },
                    { date: '2026-06-15', subject: 'Distributed Databases', id: 'SES-06', status: 'Absent', method: 'None (No-check)' }
                  ].map((log, idx) => (
                    <tr key={idx} className="text-slate-330 hover:text-white transition">
                      <td className="py-3 font-mono text-[10px]">{log.date}</td>
                      <td className="py-3 font-bold font-sans">{log.subject}</td>
                      <td className="py-3 font-mono text-[10px]">{log.id}</td>
                      <td className="py-3">
                        <StatusBadge status={log.status as any} />
                      </td>
                      <td className="py-3 font-sans text-slate-400 text-[11px]">{log.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>
      )}

      {/* 3. PERFORMANCE ANALYTICS PANEL */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardCard className="lg:col-span-2">
              <h3 className="font-extrabold text-sm font-sans mb-4">Attendance Trend Analysis</h3>
              <CustomAreaChart data={trendData} height={220} />
            </DashboardCard>
            <DashboardCard>
              <h3 className="font-extrabold text-sm font-sans mb-4">Insights & Risk Indices</h3>
              <div className="space-y-4 text-xs font-sans">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 text-amber-450 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    Tardy Risk Alert
                  </div>
                  <p>You have registered 2 late arrivals in Distributed Databases. An additional late check-in will automatically count as a full absence record.</p>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-emerald-400 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Dean Honors Qualification
                  </div>
                  <p>Your average compliance score of 81.5% qualifies you for the top-tier attendance dean list honors criteria.</p>
                </div>
              </div>
            </DashboardCard>
          </div>

          {/* AI Bunk & Attendance Goal Simulator */}
          <DashboardCard className="space-y-5 border border-amber-400/20 bg-linear-to-br from-amber-500/3 to-slate-900/60">
            {/* Header controls bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Bunk & Compliance Goal Simulator</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Mathematical margin calculator & What-If scenario sandbox</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Subject Scope Selector */}
                <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-mono text-slate-400">Scope:</span>
                  <select
                    value={bunkSubject}
                    onChange={(e) => {
                      setBunkSubject(e.target.value);
                      setSimMissed(0);
                      setSimAttended(0);
                    }}
                    className="bg-transparent text-xs text-white outline-none cursor-pointer font-sans"
                  >
                    <option value="all" className="bg-slate-900 text-white">All Subjects (Overall)</option>
                    {subjects.map((s) => (
                      <option key={s.code} value={s.code} className="bg-slate-900 text-white">
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Goal Slider control */}
                <div className="flex items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[11px] font-mono text-slate-400">Target:</span>
                  <input
                    type="range"
                    min="60"
                    max="95"
                    step="1"
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(Number(e.target.value))}
                    className="w-20 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-amber-400 w-9 text-right">{targetGoal}%</span>
                </div>
              </div>
            </div>

            {/* Calculations Engine */}
            {(() => {
              let currPresent = 0;
              let currTotal = 0;
              let activeScopeName = "Overall Aggregate";

              if (bunkSubject === 'all') {
                currPresent = stats?.subjects?.reduce((acc: number, s: any) => acc + s.present, 0) || 76;
                currTotal = stats?.subjects?.reduce((acc: number, s: any) => acc + s.total, 0) || 94;
                activeScopeName = "All Courses Aggregate";
              } else {
                const found = subjects.find(s => s.code === bunkSubject || s.name === bunkSubject);
                if (found) {
                  currPresent = found.present;
                  currTotal = found.total;
                  activeScopeName = `${found.name} (${found.code})`;
                } else {
                  currPresent = 18;
                  currTotal = 24;
                  activeScopeName = bunkSubject;
                }
              }

              const targetPct = targetGoal / 100;
              const currentPct = currTotal > 0 ? currPresent / currTotal : 0;
              const safeBunks = currentPct >= targetPct ? Math.floor((currPresent - targetPct * currTotal) / targetPct) : 0;
              const neededConsecutive = currentPct < targetPct ? Math.ceil((targetPct * currTotal - currPresent) / (1 - targetPct)) : 0;

              // Simulation projection
              const projectedPresent = currPresent + simAttended;
              const projectedTotal = currTotal + simAttended + simMissed;
              const projectedPct = projectedTotal > 0 ? (projectedPresent / projectedTotal) * 100 : 0;
              const deltaPct = projectedPct - (currentPct * 100);

              return (
                <div className="space-y-4 text-xs font-sans">
                  {/* Metric Baseline Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Current Rate</span>
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-30">{activeScopeName}</span>
                      </div>
                      <span className="text-2xl font-black text-white font-sans">
                        {Math.round(currentPct * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {currPresent} present of {currTotal} total sessions
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-xl border space-y-1 ${safeBunks > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-950/40 border-white/5 text-slate-400'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase tracking-widest block">Safe Bunk Allowance</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300">MARGIN</span>
                      </div>
                      <span className="text-2xl font-black font-sans">
                        {safeBunks} {safeBunks === 1 ? 'Class' : 'Classes'}
                      </span>
                      <span className="text-[10px] block opacity-80 font-mono">
                        Can miss safely while staying at or above {targetGoal}%
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-xl border space-y-1 ${neededConsecutive > 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-950/40 border-white/5 text-slate-400'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase tracking-widest block">Catch-up Requirement</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300">DEFICIT</span>
                      </div>
                      <span className="text-2xl font-black font-sans">
                        {neededConsecutive} {neededConsecutive === 1 ? 'Class' : 'Classes'}
                      </span>
                      <span className="text-[10px] block opacity-80 font-mono">
                        Consecutive attendances needed to reach {targetGoal}%
                      </span>
                    </div>
                  </div>

                  {/* Interactive What-If Simulation Sandbox */}
                  <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-white text-xs font-sans">Interactive Scenario Simulation</span>
                      </div>
                      {(simMissed > 0 || simAttended > 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSimMissed(0);
                            setSimAttended(0);
                          }}
                          className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      {/* Miss Classes Control */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Simulate Missing Classes</span>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setSimMissed(prev => Math.max(0, prev - 1))}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center transition cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono text-base font-black text-rose-400">
                            {simMissed} {simMissed === 1 ? 'class' : 'classes'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSimMissed(prev => prev + 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center transition cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Attend Classes Control */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Simulate Attending Classes</span>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setSimAttended(prev => Math.max(0, prev - 1))}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center transition cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono text-base font-black text-emerald-400">
                            {simAttended} {simAttended === 1 ? 'class' : 'classes'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSimAttended(prev => prev + 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center transition cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Projected Outcome Card */}
                      <div className={`p-3 rounded-xl border space-y-1 ${projectedPct >= targetGoal ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Projected Attendance</span>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-2xl font-black font-sans ${projectedPct >= targetGoal ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {projectedPct.toFixed(1)}%
                          </span>
                          {(simMissed > 0 || simAttended > 0) && (
                            <span className={`text-[11px] font-mono font-bold ${deltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {deltaPct >= 0 ? `+${deltaPct.toFixed(1)}%` : `${deltaPct.toFixed(1)}%`}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-mono block ${projectedPct >= targetGoal ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {projectedPct >= targetGoal ? 'Status: Above Target' : 'Status: Below Target'}
                        </span>
                      </div>
                    </div>

                    {/* Preset Scenario Testing Chips */}
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Quick Scenario Presets:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { label: '🏖️ College Fest (-6 Classes)', missed: 6, attended: 0 },
                          { label: '🤒 Sick Leave (-3 Classes)', missed: 3, attended: 0 },
                          { label: '🎯 10-Class Power Sprint (+10)', missed: 0, attended: 10 },
                          { label: '⚡ Next Week Attendance (+15)', missed: 0, attended: 15 },
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              setSimMissed(preset.missed);
                              setSimAttended(preset.attended);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-[11px] font-mono transition cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Nexa AI Advisory Advice Box */}
                  <div className="p-3.5 rounded-xl bg-amber-400/5 border border-amber-400/20 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 leading-relaxed text-xs">
                      <span className="font-bold text-white font-sans block">Nexa AI Academic Advisory</span>
                      <p className="text-slate-300">
                        {projectedPct >= targetGoal
                          ? `You are in a healthy academic standing for ${activeScopeName}. With ${safeBunks} safe bunk allowances remaining, you can safely miss emergency lectures without breaching your ${targetGoal}% compliance goal.`
                          : `Warning: You are currently below your ${targetGoal}% compliance objective for ${activeScopeName}. You must attend ${neededConsecutive} consecutive sessions to reach compliance and avoid formal attendance sanction warnings.`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DashboardCard>
        </div>
      )}

      {/* 4. LEAVE WORKSPACE */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-lg text-white font-sans uppercase">Leave Portal</h3>
            <button
              onClick={() => setLeaveModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl border border-primary/20 hover:bg-blue-650 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* Leave balance grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Sick Leave', val: leaveBalance?.sick ?? 10, total: 10, color: 'text-rose-400' },
              { label: 'Personal Leave', val: leaveBalance?.personal ?? 15, total: 15, color: 'text-blue-400' },
              { label: 'Emergency Leave', val: leaveBalance?.emergency ?? 5, total: 5, color: 'text-amber-400' },
              { label: 'Academic Leave', val: leaveBalance?.academic ?? 12, total: 12, color: 'text-emerald-400' }
            ].map((b, i) => (
              <div key={i} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">{b.label}</span>
                <span className={`text-xl font-black ${b.color} font-sans`}>{b.val} / {b.total}</span>
                <span className="text-[9px] text-slate-400 block mt-1">days left</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {leaves.map((leave) => (
              <DashboardCard key={leave.id} className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                    {leave.type} Request
                  </span>
                  <StatusBadge status={leave.status as any} />
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400 font-mono text-[10px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Duration: {leave.start} to {leave.end}
                  </div>
                  <p className="text-white font-sans mt-2 font-semibold">{leave.reason}</p>
                </div>

                {leave.reviewer && (
                  <div className="pt-3.5 border-t border-white/5 text-[10px] text-slate-500 font-mono uppercase tracking-wider flex justify-between items-center">
                    <span>Approved By:</span>
                    <span className="text-white font-bold font-sans">{leave.reviewer}</span>
                  </div>
                )}
              </DashboardCard>
            ))}
          </div>

          {/* Modal overlay */}
          <AnimatePresence>
            {leaveModalOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setLeaveModalOpen(false)}
                  className="fixed inset-0 bg-black z-50 pointer-events-auto backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-55 overflow-hidden flex flex-col p-6"
                >
                  <h3 className="font-black text-lg text-white font-sans uppercase mb-4">
                    New Leave Request
                  </h3>

                  <form onSubmit={handleApplyLeave} className="space-y-4 text-xs font-sans">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                        Leave Type
                      </label>
                      <select
                        value={newLeave.type}
                        onChange={(e) => setNewLeave(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:ring-1 focus:ring-primary transition outline-none font-sans"
                      >
                        <option value="Sick">Sick Leave</option>
                        <option value="Casual">Casual Leave</option>
                        <option value="Medical">Medical Leave</option>
                        <option value="Academic">Academic Duty Leave</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={newLeave.start}
                          onChange={(e) => setNewLeave(prev => ({ ...prev, start: e.target.value }))}
                          className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:ring-1 focus:ring-primary transition outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={newLeave.end}
                          onChange={(e) => setNewLeave(prev => ({ ...prev, end: e.target.value }))}
                          className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:ring-1 focus:ring-primary transition outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                        Reason Details
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Detail your request justification..."
                        value={newLeave.reason}
                        onChange={(e) => setNewLeave(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-100 placeholder:opacity-60 focus:ring-1 focus:ring-primary transition outline-none font-sans"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setLeaveModalOpen(false)}
                        className="w-1/2 py-3 bg-white/5 hover:bg-white/10 text-slate-355 rounded-xl font-bold transition text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 py-3 bg-primary hover:bg-blue-650 text-white rounded-xl font-bold transition text-xs border border-primary/20"
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 5. AI ANALYST CLIENT */}
      {activeTab === 'chat' && (
        <DashboardCard className="h-112.5 flex flex-col p-6">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm font-sans text-white">AI Academic Hub</h3>
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">
                ArcFace Insights Layer Online
              </span>
            </div>
          </div>

          {/* Messages board */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex max-w-[85%] flex-col gap-1.5 p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'ai'
                    ? 'bg-slate-950/50 border border-white/5 text-slate-300 mr-auto rounded-tl-none'
                    : 'bg-primary text-white border border-primary/10 ml-auto rounded-tr-none'
                }`}
              >
                <p className="font-sans">{msg.text}</p>
              </div>
            ))}
            {chatLoading && (
              <div className="bg-slate-950/50 border border-white/5 text-slate-400 mr-auto rounded-2xl rounded-tl-none p-3.5 text-xs max-w-50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          {/* Input field */}
          <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask AI Analyst..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-100 placeholder:opacity-60 focus:ring-1 focus:ring-primary transition outline-none font-sans"
            />
            <button
              type="submit"
              className="p-3 bg-primary hover:bg-blue-650 text-white rounded-xl transition border border-primary/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </DashboardCard>
      )}

      {/* Mark Attendance Modal (QR & Live Face Verification) */}
      <AnimatePresence>
        {markModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setMarkModalOpen(false);
                setMarkFeedback(null);
              }}
              className="fixed inset-0 bg-black z-50 pointer-events-auto backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-12 left-1/2 -translate-x-1/2 w-[92vw] max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl z-55 overflow-hidden flex flex-col p-6"
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white font-sans uppercase leading-none">
                      Mark Attendance
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Instant Session Verification</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMarkModalOpen(false);
                    setMarkFeedback(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Method Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-white/5 mb-5 text-xs font-semibold">
                <button
                  onClick={() => {
                    setMarkMethod('token');
                    setMarkFeedback(null);
                  }}
                  className={`py-2 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                    markMethod === 'token'
                      ? 'bg-white/10 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Session / QR Token</span>
                </button>
                <button
                  onClick={() => {
                    setMarkMethod('face');
                    setMarkFeedback(null);
                  }}
                  className={`py-2 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                    markMethod === 'face'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Face Biometrics</span>
                </button>
              </div>

              <form onSubmit={handleMarkAttendance} className="space-y-4 text-xs font-sans">
                {/* Session ID input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                      Active Session ID
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const activeSess = await api.getActiveSession();
                          if (activeSess && (activeSess.session_id || activeSess.id)) {
                            setManualSessionId(activeSess.session_id || activeSess.id);
                            setMarkFeedback({
                              success: true,
                              message: `Connected to live session for ${activeSess.subject || 'Class'}`
                            });
                          } else {
                            setMarkFeedback({
                              success: false,
                              message: 'No live class session active at the moment.'
                            });
                          }
                        } catch {
                          setMarkFeedback({ success: false, message: 'Could not connect to live session.' });
                        }
                      }}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      Detect Live Class
                    </button>
                  </div>
                  <input
                    type="text"
                    value={manualSessionId}
                    onChange={(e) => setManualSessionId(e.target.value)}
                    placeholder="Auto-detected or enter Session ID"
                    className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:ring-1 focus:ring-amber-400/50 transition outline-none font-mono"
                  />
                </div>

                {markMethod === 'token' ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                      Rotating QR Code or 6-Digit Passcode
                    </label>
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Paste token_... or enter room passcode"
                      className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:ring-1 focus:ring-amber-400/50 transition outline-none font-mono"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Ask your instructor for the active session code or scan the rolling QR on the classroom projector.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                      Live Webcam Preview
                    </label>
                    <div className="relative w-full h-48 bg-slate-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-4 border-2 border-dashed border-amber-400/40 rounded-xl pointer-events-none flex items-center justify-center">
                        <span className="text-[10px] font-mono text-amber-400/80 bg-slate-950/80 px-2 py-1 rounded">
                          Align Face Here
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Ensure good lighting. The system matches your live face with enrolled biometrics via ArcFace AI.
                    </span>
                  </div>
                )}

                {markFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      markFeedback.success
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {markFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{markFeedback.message}</span>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMarkModalOpen(false);
                      setMarkFeedback(null);
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isMarking}
                    className="flex-1 py-3 bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isMarking ? (
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{isMarking ? 'Verifying...' : 'Submit Check-In'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

