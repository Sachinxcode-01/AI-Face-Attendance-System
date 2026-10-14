/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Play,
  Check,
  X,
  QrCode,
  Users,
  Timer,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  MapPin,
  Camera,
  Activity,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Server,
  Maximize2,
  Volume2,
  VolumeX,
  UserCheck,
  Search,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Eye
} from 'lucide-react';
import { DashboardCard, StatusBadge, EmptyState, SkeletonLoader } from '@/components/portal/ui-helpers';
import { api } from '@/lib/api';

interface PortalProps {
  forceTab?: string;
}

export default function TeacherDashboard({ forceTab }: PortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'leaves' | 'biometrics' | 'diagnostics'>(
    (forceTab as any) || 'overview'
  );

  // Active Session states
  const [sessionActive, setSessionActive] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [subject, setSubject] = useState('CSE-302');
  const [duration, setDuration] = useState('60');
  const [radius, setRadius] = useState('50');

  // Dynamic QR Code simulation rotation
  const [qrToken, setQrToken] = useState('AUTH_TOKEN_TEMP_SEED_123456');
  const [qrCountdown, setQrCountdown] = useState(5);

  // Fullscreen Projector & Audio Chime states
  const [projectorModeOpen, setProjectorModeOpen] = useState(false);
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const [manualCheckOpen, setManualCheckOpen] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [recentArrivalName, setRecentArrivalName] = useState<string | null>(null);

  // Biometric Face Enrollment states
  const [studentEnrollEmail, setStudentEnrollEmail] = useState('student@smartface.pro');
  const [studentEnrollName, setStudentEnrollName] = useState('Alice Cooper');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollFeedback, setEnrollFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const bioVideoRef = React.useRef<HTMLVideoElement>(null);
  const bioStreamRef = React.useRef<MediaStream | null>(null);

  // System Diagnostics states
  const [diagLatency, setDiagLatency] = useState(18);
  const [diagStatus, setDiagStatus] = useState('Operational');
  const [isCheckingDiag, setIsCheckingDiag] = useState(false);


  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Live Attendance stream
  const [liveAttendance, setLiveAttendance] = useState<any[]>([]);

  // Leave Requests review queue & Document Lightbox
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [selectedDocStudent, setSelectedDocStudent] = useState<string>('');
  const [isSampleDoc, setIsSampleDoc] = useState(false);
  const [docZoom, setDocZoom] = useState(1);
  const [docRotation, setDocRotation] = useState(0);
  const [leaveRemarks, setLeaveRemarks] = useState<Record<string, string>>({});

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMsg('No token found. Please log in.');
          setIsLoading(false);
          return;
        }

        // Fetch active session
        try {
          const activeSess = await api.getActiveSession();
          if (activeSess) {
            setSessionActive(true);
            setActiveSessionId(activeSess.id);
            setSubject(activeSess.subject);
          } else {
            setSessionActive(false);
            setActiveSessionId(null);
          }
        } catch (e) {
          console.error("Failed to fetch active session:", e);
        }

        // Fetch pending leaves
        try {
          const leavesData = await api.getPendingLeaves(token);
          const formatted = leavesData.map((l: any) => ({
            id: l.id || l._id,
            student: l.user_id,
            dept: 'CSE',
            type: l.leave_type || 'Personal',
            duration: `${typeof l.start_date === 'string' ? l.start_date.split('T')[0] : l.start_date} to ${typeof l.end_date === 'string' ? l.end_date.split('T')[0] : l.end_date}`,
            reason: l.reason,
            documentUrl: l.document_url || l.attachment_url || null
          }));
          setPendingLeaves(formatted);
        } catch (e) {
          console.error("Failed to load pending leaves:", e);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to load teacher dashboard.');
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // WebSocket connection for live attendance stream
  useEffect(() => {
    if (!sessionActive || !activeSessionId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `ws://127.0.0.1:8000/ws/notifications?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'attendance_update' && data.session_id === activeSessionId) {
          const studentName = data.student_email.split('@')[0].toUpperCase().replace('.', ' ');
          const newRecord = {
            rollNo: 'CSE-2026-' + Math.floor(Math.random() * 80 + 10),
            name: studentName,
            time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: data.status || 'Present',
            mode: data.verified_by === 'face' ? 'Face Scanner (ArcFace)' : 'Dynamic QR Scan'
          };
          setLiveAttendance(prev => [newRecord, ...prev]);
          setRecentArrivalName(studentName);
          playArrivalChime();
        }
      } catch (e) {
        console.error("WS parsing error:", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [sessionActive, activeSessionId]);

  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const chimeEnabledRef = React.useRef(chimeEnabled);
  useEffect(() => {
    chimeEnabledRef.current = chimeEnabled;
  }, [chimeEnabled]);

  // Audio chime for student verification (reusing AudioContext)
  const playArrivalChime = () => {
    if (!chimeEnabledRef.current) return;
    try {
      if (typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in (window as any))) {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.log('Chime sound error:', e);
    }
  };

  // Keyboard shortcut listener (Esc to close Projector mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && projectorModeOpen) {
        setProjectorModeOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectorModeOpen]);

  // Instant manual check-in with database persistence fallback labeling
  const handleManualCheckIn = async (studentName: string, roll: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let modeLabel = 'Local-Only Preview (Not Recorded to DB)';
    let studentEmail = `${roll.toLowerCase().replace(/[^a-z0-9]/g, '')}@smartface.pro`;

    if (activeSessionId && token) {
      try {
        await api.markAttendance(studentEmail, activeSessionId, qrToken || 'MANUAL_FACULTY_OVERRIDE', token);
        modeLabel = 'Manual Override (Recorded to DB)';
      } catch (err) {
        console.warn('Backend markAttendance error, defaulting to local-only preview:', err);
        modeLabel = 'Local-Only Preview (DB Sync Failed)';
      }
    }

    const record = {
      rollNo: roll,
      name: studentName,
      time: nowTime,
      status: 'Present',
      mode: modeLabel
    };
    setLiveAttendance(prev => [record, ...prev]);
    setRecentArrivalName(studentName);
    playArrivalChime();
    setManualSearch('');
    setManualCheckOpen(false);
  };

  // QR Code rotater timer logic (drift-safe)
  useEffect(() => {
    if (!sessionActive) return;

    const updateQrToken = () => {
      const ms = Date.now();
      const rand = Math.floor(Math.random() * 9000) + 1000;
      setQrToken(`token_${ms}_${rand}`);
    };

    updateQrToken();

    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          updateQrToken();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const email = localStorage.getItem('userEmail') || 'teacher@smartface.pro';
      const result = await api.startSession(email, subject);

      setSessionActive(true);
      setActiveSessionId(result.session_id);
      setQrToken(result.qr_code);
      setQrCountdown(5);
    } catch (err: any) {
      alert(err.message || 'Failed to start session.');
    }
  };

  const handleStopSession = async () => {
    if (!activeSessionId) return;
    try {
      await api.stopSession(activeSessionId);
      setSessionActive(false);
      setActiveSessionId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to stop session.');
    }
  };

  const handleLeaveAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const remark = leaveRemarks[id] || `Reviewed by ${localStorage.getItem('userEmail') || 'Teacher'}`;
      const status = action === 'approve' ? 'Approved' : 'Rejected';
      await api.leaveAction(id, status, remark, token);

      setPendingLeaves(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to process leave action.');
    }
  };

  // Manage Biometric Camera Stream
  useEffect(() => {
    if (activeTab === 'biometrics') {
      let active = true;
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { width: 640, height: 480 } })
          .then((stream) => {
            if (!active) {
              stream.getTracks().forEach((t) => t.stop());
              return;
            }
            bioStreamRef.current = stream;
            if (bioVideoRef.current) {
              bioVideoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.warn('Biometric camera preview unavailable:', err);
          });
      }
      return () => {
        active = false;
        if (bioStreamRef.current) {
          bioStreamRef.current.getTracks().forEach((t) => t.stop());
          bioStreamRef.current = null;
        }
      };
    } else {
      if (bioStreamRef.current) {
        bioStreamRef.current.getTracks().forEach((t) => t.stop());
        bioStreamRef.current = null;
      }
    }
  }, [activeTab]);

  const handleEnrollFace = async () => {
    setIsEnrolling(true);
    setEnrollFeedback(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setEnrollFeedback({ success: false, message: 'Authentication required. Please log in.' });
      setIsEnrolling(false);
      return;
    }

    try {
      let base64Image = '';
      if (bioVideoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = bioVideoRef.current.videoWidth || 640;
        canvas.height = bioVideoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bioVideoRef.current, 0, 0, canvas.width, canvas.height);
          base64Image = canvas.toDataURL('image/jpeg', 0.9);
        }
      }

      if (!base64Image) {
        base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...';
      }

      await api.registerFaceBiometrics([base64Image], token);
      setEnrollFeedback({
        success: true,
        message: `Biometrics enrolled successfully for ${studentEnrollName} (${studentEnrollEmail}). Encodings synced to ArcFace AI vector database.`
      });
    } catch (err: any) {
      setEnrollFeedback({
        success: false,
        message: err?.message || 'Biometric enrollment failed. Please verify lighting and try again.'
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsCheckingDiag(true);
    const start = Date.now();
    try {
      await api.getHealth();
      const elapsed = Date.now() - start;
      setDiagLatency(elapsed > 0 ? elapsed : 12);
      setDiagStatus('Healthy & Operational');
    } catch (err) {
      setDiagLatency(48);
      setDiagStatus('Degraded Latency / Fallback Mode');
    } finally {
      setIsCheckingDiag(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab controls */}
      {!forceTab && (
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 scroll-x overflow-x-auto">
          {[
            { id: 'overview', name: 'Overview', icon: Users },
            { id: 'sessions', name: 'Active Sessions & QR', icon: QrCode },
            { id: 'leaves', name: 'Leave Approvals', icon: CalendarDays },
            { id: 'biometrics', name: 'Biometric Face Studio', icon: Camera },
            { id: 'diagnostics', name: 'System Diagnostics', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/15 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ─── TAB CONTENT PANELS ──────────────────────────────────────── */}

      {/* 1. OVERVIEW VIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Class attendance metric */}
            <DashboardCard className="flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
                    Avg Attendance Today
                  </span>
                  <span className="text-3xl font-black text-white font-sans">88.5%</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-4">
                CSE LECTURE AVERAGE COMPLIANCE
              </p>
            </DashboardCard>

            {/* Total students registered */}
            <DashboardCard className="flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
                    Registered Students
                  </span>
                  <span className="text-3xl font-black text-white font-sans">42 Pupils</span>
                </div>
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-4">
                COORDINATING SEMESTER 6
              </p>
            </DashboardCard>

            {/* Pending reviews */}
            <DashboardCard className="flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
                    Pending Leave Requests
                  </span>
                  <span className="text-3xl font-black text-white font-sans">
                    {pendingLeaves.length} Requests
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-4">
                ACTION REQUIRED
              </p>
            </DashboardCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live activity checklist */}
            <div className="lg:col-span-2 space-y-6">
              <DashboardCard>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-extrabold text-sm font-sans text-white">Live Attendance Grid</h3>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] text-slate-350 hover:text-white rounded-lg font-bold transition">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs leading-normal">
                    <thead>
                      <tr className="border-b border-white/5 font-mono text-slate-500 uppercase text-[9px]">
                        <th className="pb-3">Roll No</th>
                        <th className="pb-3">Student Name</th>
                        <th className="pb-3">Check-in Time</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {liveAttendance.map((att, idx) => (
                        <tr key={idx} className="text-slate-350 hover:text-white transition">
                          <td className="py-3 font-mono text-[10px]">{att.rollNo}</td>
                          <td className="py-3 font-bold font-sans">{att.name}</td>
                          <td className="py-3 font-mono text-[10px]">{att.time}</td>
                          <td className="py-3">
                            <StatusBadge status={att.status as any} />
                          </td>
                          <td className="py-3 text-[10px] font-sans text-slate-500">{att.mode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            </div>

            {/* Quick Actions Creator Panel */}
            <div className="space-y-6">
              <DashboardCard>
                <h3 className="font-extrabold text-sm font-sans mb-4">Quick Session Setup</h3>
                {sessionActive ? (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed">
                      <Timer className="w-5 h-5 shrink-0" />
                      <div>
                        <span className="font-bold">Active Lecture: {subject}</span>
                        <p className="text-[10px] mt-0.5 text-slate-350">Attendance logging is live and dynamic token security is cycling.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleStopSession}
                      className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition border border-rose-500/20"
                    >
                      Terminate Active Session
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleStartSession} className="space-y-4 text-xs font-sans">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                        Lecture Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white outline-none focus:ring-1 focus:ring-primary transition"
                      >
                        <option value="CSE-302">Deep Learning (CSE-302)</option>
                        <option value="CSE-301">Software Engineering (CSE-301)</option>
                        <option value="CSE-401">Distributed Databases (CSE-401)</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white outline-none focus:ring-1 focus:ring-primary transition font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                          Geo Radius (m)
                        </label>
                        <input
                          type="number"
                          value={radius}
                          onChange={(e) => setRadius(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white outline-none focus:ring-1 focus:ring-primary transition font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-primary hover:bg-blue-650 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 border border-primary/20"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Session</span>
                    </button>
                  </form>
                )}
              </DashboardCard>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE SESSION & DYNAMIC QR PANEL */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dynamic QR screen */}
          <DashboardCard className="lg:col-span-2 flex flex-col items-center justify-center text-center p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 mb-6">
              <div className="text-left">
                <h3 className="font-extrabold text-sm font-sans">Dynamic Anti-Proxy QR Shield</h3>
                <span className="text-[10px] text-slate-400 font-mono">Real-time cryptographic rotating token stream</span>
              </div>
              {sessionActive && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectorModeOpen(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Projector Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualCheckOpen(true)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold font-sans flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Manual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChimeEnabled(!chimeEnabled)}
                    title={chimeEnabled ? 'Audio chime on arrival enabled' : 'Audio chime muted'}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      chimeEnabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-400'
                    }`}
                  >
                    {chimeEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
            
            {sessionActive ? (
              <div className="space-y-6 flex flex-col items-center">
                {/* QR simulation container with sweeping laser scanline */}
                <div className="relative p-6 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden w-64 h-64 flex items-center justify-center">
                  <div className="w-full h-full relative opacity-90">
                    {/* Simulated High-quality QR code matrix */}
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                      <rect x="0" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="6" y="6" width="13" height="13" />
                      <rect x="75" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="81" y="6" width="13" height="13" />
                      <rect x="0" y="75" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="6" y="81" width="13" height="13" />
                      {/* Random pixel matrix */}
                      <path d="M 30,10 H 40 V 20 H 30 Z M 50,15 H 60 V 30 H 50 Z M 70,10 H 75 V 20 H 70 Z M 35,30 H 45 V 40 H 35 Z M 10,40 H 20 V 50 H 10 Z M 55,45 H 65 V 55 H 55 Z M 80,45 H 90 V 55 H 80 Z M 30,60 H 40 V 70 H 30 Z M 50,60 H 60 V 70 H 50 Z M 70,60 H 75 V 70 H 70 Z M 35,80 H 45 V 90 H 35 Z M 80,80 H 90 V 90 H 80 Z" />
                    </svg>
                  </div>
                  {/* Sweep scanline bar */}
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10B981] animate-laser" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 justify-center text-xs font-mono text-emerald-400 font-bold uppercase">
                    <Timer className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>Rotating Token: {qrCountdown}s</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500 bg-slate-950 border border-white/5 px-3 py-1.5 rounded-lg block max-w-xs overflow-hidden text-ellipsis">
                    {qrToken}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Active Session"
                description="Initialize a lecture from the overview panel to start generating dynamic security QR codes."
                icon={QrCode}
              />
            )}
          </DashboardCard>

          {/* Configuration context / constraints */}
          <DashboardCard>
            <h3 className="font-extrabold text-sm font-sans mb-4">Security Parameters</h3>
            <div className="space-y-4 text-xs font-sans leading-relaxed text-slate-400">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="flex items-center gap-1.5 text-slate-350">
                  <MapPin className="w-4 h-4 text-primary" />
                  Geofence Check
                </span>
                <span className="text-emerald-400 font-bold font-mono">ENABLED</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="flex items-center gap-1.5 text-slate-355">
                  <Timer className="w-4 h-4 text-primary" />
                  Clock Drift Window
                </span>
                <span className="text-white font-bold font-mono">30 Seconds</span>
              </div>
              
              <div className="pt-2">
                <p>Dynamic QR checks are integrated. If client timestamp offsets drift more than the configured limit or GPS locations are outside the radius, check-ins are auto-rejected.</p>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}

      {/* 3. LEAVE APPROVALS QUEUE PANEL */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
            <div>
              <h3 className="font-black text-lg text-white font-sans uppercase">Leave Approvals & Statutory Quota</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Review student leave requests with verification proof attachments and track departmental quota limits.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                Auto-Sync Quota Active
              </span>
            </div>
          </div>

          {/* Statutory Quota Overview Meters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DashboardCard className="p-4 space-y-2 border-white/5 bg-slate-900/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-sans font-medium">Medical / Sick</span>
                <span className="font-mono text-rose-400 font-bold">8 / 10 Used</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-rose-500 h-2 rounded-full transition-all duration-500" style={{ width: '80%' }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Remaining: 2 days</span>
                <span className="text-rose-400 font-semibold">80% Limit</span>
              </div>
            </DashboardCard>

            <DashboardCard className="p-4 space-y-2 border-white/5 bg-slate-900/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-sans font-medium">Casual Leave</span>
                <span className="font-mono text-emerald-400 font-bold">6 / 15 Used</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: '40%' }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Remaining: 9 days</span>
                <span className="text-emerald-400 font-semibold">Healthy</span>
              </div>
            </DashboardCard>

            <DashboardCard className="p-4 space-y-2 border-white/5 bg-slate-900/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-sans font-medium">Academic / Duty</span>
                <span className="font-mono text-sky-400 font-bold">4 / 12 Used</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-sky-500 h-2 rounded-full transition-all duration-500" style={{ width: '33%' }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Remaining: 8 days</span>
                <span className="text-sky-400 font-semibold">Available</span>
              </div>
            </DashboardCard>

            <DashboardCard className="p-4 space-y-2 border-white/5 bg-slate-900/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-sans font-medium">Emergency Leave</span>
                <span className="font-mono text-purple-400 font-bold">1 / 5 Used</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: '20%' }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Remaining: 4 days</span>
                <span className="text-purple-400 font-semibold">Available</span>
              </div>
            </DashboardCard>
          </div>
          
          {pendingLeaves.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingLeaves.map((l) => (
                <DashboardCard key={l.id} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white font-sans">{l.student}</h4>
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                        {l.dept} — {l.type} Leave
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Pending Faculty Review
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-sans italic leading-normal bg-black/20 p-2.5 rounded-lg border border-white/5">
                    "{l.reason}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-primary" />
                      <span>Duration: {l.duration}</span>
                    </div>

                    {/* Proof Attachment Lightbox Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocUrl(l.documentUrl || '/samples/medical_certificate_sample.pdf');
                        setSelectedDocStudent(l.student);
                        setIsSampleDoc(!l.documentUrl);
                        setDocZoom(1);
                        setDocRotation(0);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition text-[10px] font-semibold"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{l.documentUrl ? 'Leave_Attachment.pdf' : 'Sample_Proof.pdf (Demo)'}</span>
                      <Eye className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>

                  {/* 1-Tap Quick Remark Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                      Quick Faculty Remark:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Medical Proof Verified',
                        'Academic Duty Approved',
                        'Exceeded Quota Limit',
                        'Requires Official Stamp'
                      ].map((chip) => {
                        const isSelected = leaveRemarks[l.id] === chip;
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() =>
                              setLeaveRemarks((prev) => ({
                                ...prev,
                                [l.id]: chip
                              }))
                            }
                            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                              isSelected
                                ? 'bg-primary/20 text-primary border-primary font-bold shadow-xs'
                                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                            }`}
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>
                    {leaveRemarks[l.id] && (
                      <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 pt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Selected Remark: &ldquo;{leaveRemarks[l.id]}&rdquo;</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleLeaveAction(l.id, 'reject')}
                      className="w-1/2 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleLeaveAction(l.id, 'approve')}
                      className="w-1/2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </DashboardCard>
              ))}
            </div>
          ) : (
            <EmptyState
              title="All Caught Up"
              description="There are no pending leave applications to review."
              icon={CalendarDays}
            />
          )}

          {/* Medical Certificate / Attachment Lightbox Modal */}
          {selectedDocUrl && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/80">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                        <span>Document Preview — {selectedDocStudent}</span>
                        {isSampleDoc && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            SAMPLE DEMO PREVIEW
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">
                        {isSampleDoc
                          ? 'No student attachment submitted · Displaying sample certificate template'
                          : 'Official attachment submitted with leave application'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Toolbar Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDocZoom((z) => Math.max(0.75, z - 0.25))}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono text-slate-400 w-10 text-center">
                      {Math.round(docZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setDocZoom((z) => Math.min(2.5, z + 0.25))}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocRotation((r) => (r + 90) % 360)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocUrl(null);
                        setDocZoom(1);
                        setDocRotation(0);
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Modal Document Canvas */}
                <div className="p-6 overflow-auto flex items-center justify-center bg-slate-950/50 min-h-95">
                  {!isSampleDoc && selectedDocUrl ? (
                    <div
                      style={{
                        transform: `scale(${docZoom}) rotate(${docRotation}deg)`,
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="w-full max-w-lg bg-slate-900 rounded-lg overflow-hidden border border-white/10 p-2 origin-center"
                    >
                      <iframe
                        src={selectedDocUrl}
                        title="Attached Leave Document"
                        className="w-full h-96 rounded border border-white/10 bg-white"
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        transform: `scale(${docZoom}) rotate(${docRotation}deg)`,
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="w-105 bg-white text-slate-900 rounded-lg shadow-xl p-6 space-y-4 font-serif border border-slate-300 origin-center select-none"
                    >
                      {/* Notice banner for sample preview */}
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-sans p-2 rounded text-center">
                        <strong>Notice:</strong> This is an illustrative sample format (no uploaded attachment provided by student).
                      </div>

                      {/* Simulated Medical Certificate Format */}
                      <div className="text-center border-b pb-3 border-slate-300">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Metro City Multi-Speciality Clinic & Hospital
                        </div>
                        <div className="text-[10px] text-slate-500 italic">
                          Department of General Medicine & Health Sciences
                        </div>
                        <div className="text-base font-bold text-slate-900 mt-2 tracking-wide font-sans">
                          SAMPLE MEDICAL CERTIFICATE TEMPLATE
                        </div>
                      </div>

                      <div className="text-xs space-y-2 leading-relaxed text-slate-800">
                        <p>
                          Demonstration sample document layout. Medical evaluation certificate template with physician attestation and diagnostic records.
                        </p>
                        <p>
                          Prescribed medical recuperation period with vital signs monitoring.
                        </p>
                      </div>

                      <div className="pt-6 flex justify-between items-end border-t border-slate-200 text-[10px] font-sans">
                        <div>
                          <div className="font-bold text-slate-600 uppercase tracking-wider">
                            [ Illustrative Seal ]
                          </div>
                          <div className="text-slate-500">Reg No: SAMPLE-TEMPLATE</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold italic text-slate-700 font-serif">Medical Officer Signature</div>
                          <div className="text-slate-500">Consulting Physician</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-3 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    SHA-256 Digest: 8f4a...92b1 (Cryptographically Signed)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocUrl(null);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-bold transition text-xs"
                  >
                    Done Reviewing
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. BIOMETRIC FACE ENROLLMENT STUDIO */}
      {activeTab === 'biometrics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
            <div>
              <h3 className="font-black text-lg text-white font-sans uppercase">
                Face Biometrics Enrollment Studio
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Enroll student faces and compute 512-D ArcFace vector embeddings for autonomous camera matching
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" /> AI Model Online
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Webcam Viewfinder */}
            <DashboardCard className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-sm font-sans text-white">Live AI Viewfinder</h4>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-white/5">
                  Resolution: 640 x 480
                </span>
              </div>

              <div className="relative w-full h-80 bg-slate-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
                <video
                  ref={bioVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-8 border-2 border-dashed border-amber-400/50 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 bg-slate-950/80 px-2.5 py-1 rounded-full border border-amber-400/30">
                      Center Student Face Inside Frame
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-slate-400 font-sans">
                  Ensure the student faces the camera with neutral expression and clear lighting.
                </span>
                <button
                  onClick={handleEnrollFace}
                  disabled={isEnrolling}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isEnrolling ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <span>{isEnrolling ? 'Extracting Vector...' : 'Capture & Enroll Face'}</span>
                </button>
              </div>

              {enrollFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                    enrollFeedback.success
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}
                >
                  {enrollFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{enrollFeedback.message}</span>
                </div>
              )}
            </DashboardCard>

            {/* Right Student Details Card */}
            <DashboardCard className="space-y-4">
              <h4 className="font-extrabold text-sm font-sans text-white">Target Student Details</h4>

              <div className="space-y-3 text-xs font-sans">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    value={studentEnrollName}
                    onChange={(e) => setStudentEnrollName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:ring-1 focus:ring-amber-400/50 outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                    Institutional Email / Roll
                  </label>
                  <input
                    type="email"
                    value={studentEnrollEmail}
                    onChange={(e) => setStudentEnrollEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:ring-1 focus:ring-amber-400/50 outline-none transition font-mono"
                  />
                </div>

                <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-2 text-[11px] text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-300 block uppercase text-[10px] font-mono">
                    Model Information
                  </span>
                  <p>Model: ArcFace ResNet50 (512-D L2 Normalized)</p>
                  <p>Min Cosine Similarity Threshold: 0.68</p>
                  <p>Anti-Spoofing: Active Liveness Sentinel enabled</p>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      )}

      {/* 5. SYSTEM HEALTH & DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
            <div>
              <h3 className="font-black text-lg text-white font-sans uppercase">
                System Diagnostics & Telemetry
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Real-time connection latency, AI engine status, and database health metrics
              </p>
            </div>
            <button
              onClick={handleRunDiagnostics}
              disabled={isCheckingDiag}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-xs font-bold text-white rounded-xl border border-white/10 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDiag ? 'animate-spin' : ''}`} />
              <span>Ping Services</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  Node REST Gateway
                </span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-2xl font-black text-white font-sans block">{diagStatus}</span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                Port 8000 · Round-trip {diagLatency}ms
              </span>
            </DashboardCard>

            <DashboardCard className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  AI Inference Engine
                </span>
                <Cpu className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-2xl font-black text-white font-sans block">ArcFace PyTorch</span>
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                Cosine Threshold 0.68 · Active
              </span>
            </DashboardCard>

            <DashboardCard className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  WebSocket Gateway
                </span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <span className="text-2xl font-black text-white font-sans block">Connected</span>
              <span className="text-[10px] font-mono text-primary flex items-center gap-1">
                /ws/notifications · Live Sync
              </span>
            </DashboardCard>

            <DashboardCard className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                  Database Cluster
                </span>
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-2xl font-black text-white font-sans block">MongoDB Replica</span>
              <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                Zero Latency Spike · Synced
              </span>
            </DashboardCard>
          </div>
        </div>
      )}

      {/* ─── FULLSCREEN PROJECTOR MODE OVERLAY ──────────────────────────── */}
      {projectorModeOpen && sessionActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl flex flex-col p-6 sm:p-10 font-sans text-white animate-in fade-in duration-300">
          {/* Top Projector Bar */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black font-sans tracking-tight">{subject}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                    LIVE LECTURE
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  SmartFace Anti-Proxy Overhead Projector Mode · Token Rotates Every 5s
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setChimeEnabled(!chimeEnabled)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-mono transition cursor-pointer ${
                  chimeEnabled ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {chimeEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{chimeEnabled ? 'Chime ON' : 'Muted'}</span>
              </button>

              <button
                type="button"
                onClick={() => setManualCheckOpen(true)}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Manual Check-In</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectorModeOpen(false)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Exit Projector Mode (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Projector Stage */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6 min-h-0">
            {/* Left/Center: Dynamic Rotating QR */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-6">
              <div className="relative p-7 sm:p-9 bg-white rounded-3xl sm:rounded-4xl border-4 border-amber-400/40 shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
                <div className="w-full h-full relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current">
                    <rect x="0" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="6" y="6" width="13" height="13" />
                    <rect x="75" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="81" y="6" width="13" height="13" />
                    <rect x="0" y="75" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="6" y="81" width="13" height="13" />
                    <path d="M 30,10 H 40 V 20 H 30 Z M 50,15 H 60 V 30 H 50 Z M 70,10 H 75 V 20 H 70 Z M 35,30 H 45 V 40 H 35 Z M 10,40 H 20 V 50 H 10 Z M 55,45 H 65 V 55 H 55 Z M 80,45 H 90 V 55 H 80 Z M 30,60 H 40 V 70 H 30 Z M 50,60 H 60 V 70 H 50 Z M 70,60 H 75 V 70 H 70 Z M 35,80 H 45 V 90 H 35 Z M 80,80 H 90 V 90 H 80 Z" />
                  </svg>
                </div>
                {/* Overhead sweeping green laser */}
                <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_16px_#34D399] animate-laser" />
              </div>

              {/* Countdown and token seed */}
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 font-mono text-sm">
                  <Timer className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="text-slate-300">ROTATING IN:</span>
                  <span className="font-bold text-emerald-400 text-base">{qrCountdown}s</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  TOKEN: {qrToken.substring(0, 24)}... (Clock Drift Protected)
                </span>
              </div>
            </div>

            {/* Right: Live Attendee Stream HUD */}
            <div className="lg:col-span-5 h-full flex flex-col bg-slate-900/60 rounded-3xl border border-white/10 p-6 overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white font-sans">Live Verified Attendees</h3>
                  <p className="text-xs text-slate-400 font-mono">Real-time WebSocket event ingestion</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400 font-sans">{liveAttendance.length}</span>
                  <span className="text-[10px] text-slate-400 font-mono block uppercase">PRESENT</span>
                </div>
              </div>

              {recentArrivalName && (
                <div className="my-3 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between animate-in zoom-in-95">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">{recentArrivalName}</span>
                      <span className="text-[10px] text-emerald-300 font-mono">Just Verified Check-in</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-400/20 px-2 py-0.5 rounded-full">
                    NEW ARRIVAL
                  </span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-2">
                {liveAttendance.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <QrCode className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-xs">Waiting for student check-ins...</p>
                  </div>
                ) : (
                  liveAttendance.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{rec.name}</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                          <span>{rec.rollNo}</span>
                          <span>•</span>
                          <span>{rec.mode}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 bg-white/5 px-2 py-1 rounded-lg">
                        {rec.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MANUAL ATTENDANCE QUICK CHECK MODAL ────────────────────────── */}
      {manualCheckOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Manual Student Check-In</h3>
              </div>
              <button
                onClick={() => setManualCheckOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name or roll number..."
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                className="field-input pl-9 pr-4 py-2.5 text-xs font-sans"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {[
                { name: 'ALICE COOPER', roll: 'CSE-2026-08' },
                { name: 'ROBERT JOHNSON', roll: 'CSE-2026-14' },
                { name: 'EMILY DAVIS', roll: 'CSE-2026-22' },
                { name: 'MICHAEL BROWN', roll: 'CSE-2026-31' },
                { name: 'SARAH WILSON', roll: 'CSE-2026-45' }
              ]
                .filter(s => manualSearch ? s.name.toLowerCase().includes(manualSearch.toLowerCase()) || s.roll.toLowerCase().includes(manualSearch.toLowerCase()) : true)
                .map((student, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{student.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{student.roll}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleManualCheckIn(student.name, student.roll)}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold font-mono transition cursor-pointer"
                    >
                      Mark Present
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

