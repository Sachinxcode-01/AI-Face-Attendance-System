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
  Plus
} from 'lucide-react';
import AttendanceRing from '@/components/portal/attendance-ring';
import { DashboardCard, StatusBadge, SkeletonLoader, EmptyState } from '@/components/portal/ui-helpers';
import { CustomAreaChart, AttendanceHeatmap } from '@/components/portal/custom-charts';
import { api } from '@/lib/api';

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

export default function StudentDashboard({ forceTab }: PortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'analytics' | 'leave' | 'chat'>(
    (forceTab as any) || 'overview'
  );

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

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
          <DashboardCard className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
                  Active Streak
                </span>
                <span className="text-3xl font-black text-white font-sans">{stats?.streak ?? 14} Days</span>
              </div>
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <Flame className="w-5 h-5 fill-orange-400" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-4">
              CONSECUTIVE ATTENDANCE RECORD
            </p>
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

      {/* Main tab select headers */}
      {!forceTab && (
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 scroll-x">
          {[
            { id: 'overview', name: 'Overview', icon: BookOpen },
            { id: 'attendance', name: 'Attendance Records', icon: CalendarCheck },
            { id: 'analytics', name: 'Performance Analytics', icon: Award },
            { id: 'leave', name: 'Leave Requests', icon: Calendar },
            { id: 'chat', name: 'AI Analyst Chat', icon: MessageSquare }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition ${
                activeTab === tab.id
                  ? 'bg-white/5 text-white border border-white/10'
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
                        className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:border-primary transition outline-none font-sans"
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
                          className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:border-primary transition outline-none font-mono"
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
                          className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:border-primary transition outline-none font-mono"
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
                        className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary transition outline-none font-sans"
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
        <DashboardCard className="h-[450px] flex flex-col p-6">
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
              <div className="bg-slate-950/50 border border-white/5 text-slate-400 mr-auto rounded-2xl rounded-tl-none p-3.5 text-xs max-w-[200px] flex items-center gap-2">
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
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary transition outline-none font-sans"
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

    </div>
  );
}
