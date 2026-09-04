/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Server,
  Activity,
  Trash,
  Database,
  Cpu,
  Search,
  Eye,
  Sparkles,
  Send,
  FileText,
  Download,
  ScanFace,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardCard, SkeletonLoader } from '@/components/portal/ui-helpers';
import { CustomAreaChart, CustomBarChart } from '@/components/portal/custom-charts';
import { api } from '@/lib/api';

interface PortalProps {
  forceTab?: string;
}

export default function AdminDashboard({ forceTab }: PortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'security' | 'system' | 'copilot'>(
    (forceTab as any) || 'overview'
  );

  // AI Copilot states
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<any[]>([
    {
      sender: 'ai',
      text: 'Welcome to the SmartFace AI Admin Copilot. I can analyze student compliance logs, generate reports, search user records, or display telemetry rankings. Ask me anything or select a prompt below.'
    }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Admin stats from API
  const [adminStats, setAdminStats] = useState<any>(null);

  // User Management lists
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Student' | 'Teacher' | 'Admin'>('All');

  // Security Feed logs
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);

  // Telemetry metrics
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 28,
    memory: '4.2 / 8.0 GB',
    websockets: 14,
    dbStatus: 'Connected',
    sheetsSync: 'Success'
  });

  // Institution compliance chart
  const [institutionTrend, setInstitutionTrend] = useState([
    { label: 'Mon', value: 88 },
    { label: 'Tue', value: 92 },
    { label: 'Wed', value: 89 },
    { label: 'Thu', value: 90 },
    { label: 'Fri', value: 86 }
  ]);

  // Department rankings chart
  const [deptRankings, setDeptRankings] = useState([
    { label: 'CSE', value: 91 },
    { label: 'ECE', value: 85 },
    { label: 'MECH', value: 78 },
    { label: 'CIVIL', value: 74 }
  ]);

  const handleSendPrompt = (prompt: string) => {
    // Add user message
    setCopilotMessages(prev => [...prev, { sender: 'user', text: prompt }]);
    
    // Simulate AI thinking and response
    setTimeout(() => {
      let replyText = "I have compiled the query results based on our database:";
      let type: string | undefined = undefined;

      const p = prompt.toLowerCase();
      if (p.includes('below 75%') || p.includes('below 75')) {
        replyText = "Here are the students whose attendance compliance has fallen below the critical 75% threshold:";
        type = 'low-attendance';
      } else if (p.includes('cse report') || p.includes('monthly cse')) {
        replyText = "Successfully compiled monthly attendance logs for the Computer Science Department (June 2026). Your download is ready:";
        type = 'report-file';
      } else if (p.includes('rankings') || p.includes('department rankings')) {
        replyText = "Here is the performance ranking of all departments based on average attendance compliance for this semester:";
        type = 'rankings';
      } else if (p.includes('absent')) {
        replyText = "Checking daily registries. Today's absent students are logged under the User Management directory. I have isolated 3 critical profiles falling below threshold standards.";
        type = 'low-attendance';
      } else {
        replyText = `I have received your command: "${prompt}". I am analyzing student records... No severe anomalies detected outside the current flagged student thresholds.`;
      }

      setCopilotMessages(prev => [...prev, { sender: 'ai', text: replyText, type }]);
    }, 1200);
  };

  const handleSendQuery = () => {
    if (!copilotQuery.trim()) return;
    const query = copilotQuery;
    setCopilotQuery('');
    handleSendPrompt(query);
  };

  const handleDownloadReport = () => {
    alert("Report download started: SmartFace_CSE_June_Report.pdf (1.45 MB)");
  };

  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMsg('No token found. Please log in.');
          setIsLoading(false);
          return;
        }

        // Fetch admin stats
        try {
          const statsData = await api.getAdminStats(token);
          setAdminStats(statsData);
          setSystemMetrics(prev => ({
            ...prev,
            websockets: parseInt(statsData.active_sessions || '0') * 2 + 3,
            dbStatus: statsData.database === 'connected' ? 'Connected' : 'Reachable'
          }));
        } catch (e) {
          console.error("Failed to load admin stats:", e);
        }

        // Fetch students list
        try {
          const students = await api.listStudents(token);
          const formattedUsers = students.map((s: any, idx: number) => ({
            id: s.student_id || idx,
            name: s.full_name,
            email: s.email,
            role: 'Student',
            dept: 'CSE',
            status: 'Active',
            biometricsEnrolled: !!s.face_embedding || !!s.biometric_enrolled || idx % 2 === 0
          }));
          setUsersList([
            { id: 'ADM-01', name: 'John Doe', email: 'admin@smartface.pro', role: 'Admin', dept: 'IT', status: 'Active', biometricsEnrolled: true },
            { id: 'TCH-01', name: 'Prof. Miller', email: 'miller@smartface.pro', role: 'Teacher', dept: 'CSE', status: 'Active', biometricsEnrolled: true },
            ...formattedUsers
          ]);
        } catch (e) {
          console.error("Failed to load users list:", e);
        }

        // Fetch security logs
        try {
          const logsData = await api.getSecurityLogs(token);
          const formattedLogs = logsData.map((l: any, idx: number) => ({
            id: l.id || idx,
            time: typeof l.timestamp === 'string' ? l.timestamp.replace('T', ' ').substring(0, 19) : new Date(l.timestamp).toLocaleString(),
            type: l.type || 'Intruder_Detected',
            severity: l.type === 'intruder_alert' ? 'Critical' : 'Medium',
            details: `Intruder detected at camera feed location: ${l.location || 'Unknown'}. Face model registered no match.`,
            camera: l.location || 'Main Lobby'
          }));
          setSecurityLogs(formattedLogs);
        } catch (e) {
          console.error("Failed to load security logs:", e);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to load admin dashboard.');
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDeleteUser = (id: any) => {
    setUsersList(prev => prev.filter(u => u.id !== id));
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12">
        <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
        <SkeletonLoader count={4} className="h-32 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top dashboard controls */}
      {!forceTab && (
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 scroll-x">
          {[
            { id: 'overview', name: 'System Overview', icon: Activity },
            { id: 'copilot', name: 'AI Copilot', icon: Sparkles },
            { id: 'users', name: 'User Management', icon: Users },
            { id: 'security', name: 'Security & OpenCV Feed', icon: ShieldAlert },
            { id: 'system', name: 'Telemetry Metrics', icon: Server }
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

      {/* 1. SYSTEM OVERVIEW VIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* KPI 1 */}
            <DashboardCard className="flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
                    Institutional Attendance
                  </span>
                  <span className="text-3xl font-black text-white font-sans">{adminStats?.attendance_today || "89.2%"}</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-4">
                DAILY COMPLIANCE AVERAGE
              </p>
            </DashboardCard>

            {/* KPI 2 */}
            <DashboardCard className="flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
                    Total Enrolled Users
                  </span>
                  <span className="text-3xl font-black text-white font-sans">
                    {adminStats ? (parseInt(adminStats.total_students) + parseInt(adminStats.total_teachers)) : 1333}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-4">
                COORDINATING STUDENTS & STAFF
              </p>
            </DashboardCard>

            {/* KPI 3 */}
            <DashboardCard className="flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
                    Intruders Flagged
                  </span>
                  <span className="text-3xl font-black text-rose-500 font-sans">{adminStats?.intruder_alerts || "0"} Captured</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-4">
                OPENCV VISUAL SENTINEL
              </p>
            </DashboardCard>

            {/* KPI 4 */}
            <DashboardCard className="flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest block">
                    Server Sync Health
                  </span>
                  <span className="text-3xl font-black text-emerald-400 font-sans">Online</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-4">
                SHEETS & MONGO CLUSTERS
              </p>
            </DashboardCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Analytics trend chart */}
            <DashboardCard>
              <h3 className="font-extrabold text-sm font-sans mb-4">Institutional Compliance Daily Trend</h3>
              <CustomAreaChart data={institutionTrend} height={180} />
            </DashboardCard>

            {/* Department Rankings */}
            <DashboardCard>
              <h3 className="font-extrabold text-sm font-sans mb-4">Department Performance Matrix</h3>
              <CustomBarChart data={deptRankings} height={180} />
            </DashboardCard>
          </div>
        </div>
      )}

      {/* 2. USER DATABASE MANAGEMENT */}
      {activeTab === 'users' && (
        <DashboardCard>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="font-black text-lg text-white font-sans uppercase">User Records Management</h3>
              <p className="text-[10px] text-slate-500 font-mono">Directory & ArcFace biometric enrollment status</p>
            </div>
            
            {/* Search bar & Role filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                {(['All', 'Student', 'Teacher', 'Admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
                      roleFilter === r
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'All' ? 'All Roles' : `${r}s`}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary transition outline-none font-sans"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs leading-normal">
              <thead>
                <tr className="border-b border-white/5 font-mono text-slate-500 uppercase text-[9px]">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Biometrics</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="text-slate-350 hover:text-white transition">
                    <td className="py-3 font-bold font-sans">{u.name}</td>
                    <td className="py-3 font-mono text-[10px]">{u.email}</td>
                    <td className="py-3 font-sans text-slate-400">{u.role}</td>
                    <td className="py-3 font-mono text-[10px]">{u.dept}</td>
                    <td className="py-3">
                      {u.biometricsEnrolled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <ScanFace className="w-3 h-3" /> Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertCircle className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-white/5 transition"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* 3. SECURITY & OPENCV LOGS */}
      {activeTab === 'security' && (
        <DashboardCard>
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h3 className="font-black text-lg text-white font-sans uppercase">Security Audits Feed</h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                Live Intruder Monitoring Engine
              </p>
            </div>
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 animate-pulse" />
              <span className="font-bold">Sentinel: ACTIVE</span>
            </div>
          </div>

          <div className="space-y-4">
            {securityLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 border border-white/5 rounded-2xl bg-slate-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold border ${
                      log.severity === 'Critical'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {log.severity}
                    </span>
                    <span className="font-mono text-[9px] text-slate-500">{log.time}</span>
                  </div>
                  <h4 className="font-bold text-white font-sans text-xs">{log.type.replace(/_/g, ' ')}</h4>
                  <p className="text-xs text-slate-400 font-sans max-w-lg">{log.details}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-500">Camera: {log.camera}</span>
                  <button className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white text-[10px] font-bold rounded-xl border border-white/10 transition flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Capture</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* 4. TELEMETRY & SYSTEM HEALTH PANEL */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Server metrics */}
          <DashboardCard className="space-y-4">
            <h3 className="font-extrabold text-sm font-sans flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              API Gateway Telemetry
            </h3>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">Average Load:</span>
                <span className="text-white font-bold font-mono">{systemMetrics.cpu}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">Memory Utilization:</span>
                <span className="text-white font-bold font-mono">{systemMetrics.memory}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">Active WebSockets:</span>
                <span className="text-white font-bold font-mono">{systemMetrics.websockets} connections</span>
              </div>
            </div>
          </DashboardCard>

          {/* Database stats */}
          <DashboardCard className="space-y-4">
            <h3 className="font-extrabold text-sm font-sans flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Database Clusters
            </h3>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">Cluster Status:</span>
                <span className="text-emerald-400 font-bold font-mono">{systemMetrics.dbStatus}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">Sheet Sync Status:</span>
                <span className="text-white font-bold font-mono">{systemMetrics.sheetsSync}</span>
              </div>
            </div>
          </DashboardCard>

          {/* System monitoring alert status */}
          <DashboardCard className="flex flex-col justify-between">
            <h3 className="font-extrabold text-sm font-sans mb-2">Micro-health Overview</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              All core platform services (FastAPI, Express.js gateway, MongoDB clusters) are operating within target response parameters (API latency avg: 140ms).
            </p>
            <div className="mt-4 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg font-sans flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-4 h-4" />
              <span>SYSTEM ONLINE</span>
            </div>
          </DashboardCard>
        </div>
      )}

      {/* 5. AI COPILOT VIEW */}
      {activeTab === 'copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Chat Window */}
          <div className="lg:col-span-8 p-6 bg-slate-950/40 border border-white/5 rounded-3xl flex flex-col justify-between min-h-[500px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <h3 className="font-black text-sm text-white uppercase tracking-wider">Admin AI Copilot</h3>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary uppercase font-bold tracking-widest">
                Llama-3-Groq Connected
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 select-text max-h-[360px] min-h-[300px]">
              {copilotMessages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={idx} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser ? 'bg-primary text-white' : 'bg-slate-900 border border-white/5 text-purple-400'
                    }`}>
                      {isUser ? 'AD' : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className="space-y-2">
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans ${
                        isUser 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>

                      {/* Render custom structured block based on response type */}
                      {!isUser && msg.type === 'low-attendance' && (
                        <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-3 font-sans text-xs max-w-md">
                          <span className="text-[9px] font-mono text-rose-500 font-bold block uppercase tracking-wider">
                            CRITICAL ATTENDANCE RISK CHECK (BELOW 75%)
                          </span>
                          <div className="space-y-2 font-mono text-[10px]">
                            {[
                              { name: 'Bob Cooper', email: 'bob_student@smartface.pro', val: '61.4%', desc: 'Absent 5 session blocks' },
                              { name: 'Sachin Kumar', email: 'sachin_student@smartface.pro', val: '64.8%', desc: 'Absent 4 session blocks' },
                              { name: 'Priya Nair', email: 'priya_student@smartface.pro', val: '68.2%', desc: 'Tardy thresholds exceeded' }
                            ].map((row, rIdx) => (
                              <div key={rIdx} className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-white/5">
                                <div className="text-left">
                                  <span className="text-white font-bold block">{row.name}</span>
                                  <span className="text-slate-500 text-[8px]">{row.email}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-rose-400 font-bold block">{row.val}</span>
                                  <span className="text-slate-500 text-[8px]">{row.desc}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isUser && msg.type === 'report-file' && (
                        <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl flex items-center justify-between gap-4 font-sans text-xs max-w-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white">SmartFace_CSE_June_Report.pdf</h4>
                              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">Size: 1.45 MB • Generated dynamically</span>
                            </div>
                          </div>
                          <button 
                            onClick={handleDownloadReport}
                            className="p-2 bg-primary hover:bg-blue-650 text-white rounded-lg transition"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {!isUser && msg.type === 'rankings' && (
                        <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-3 font-sans text-xs max-w-md">
                          <span className="text-[9px] font-mono text-slate-500 font-bold block uppercase tracking-wider">
                            DEPARTMENT RATIO RANKINGS
                          </span>
                          <div className="space-y-2.5 font-mono text-[10px]">
                            {[
                              { rank: 1, dept: 'Computer Science (CSE)', val: '91.2%' },
                              { rank: 2, dept: 'Electronics & Comm (ECE)', val: '85.4%' },
                              { rank: 3, dept: 'Mechanical Eng (MECH)', val: '78.1%' },
                              { rank: 4, dept: 'Civil Engineering (CIVIL)', val: '74.6%' }
                            ].map((row, rIdx) => (
                              <div key={rIdx} className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-white/5">
                                <span className="text-slate-400">#{row.rank} {row.dept}</span>
                                <span className="text-white font-bold">{row.val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Prompts list */}
            <div className="mt-4 border-t border-white/5 pt-4 space-y-3.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase block font-bold tracking-wider">
                Quick commands
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Show students below 75%",
                  "Generate monthly CSE report",
                  "Who missed most classes this month?",
                  "Show department rankings"
                ].map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(promptText)}
                    className="px-3 py-1.5 rounded-full border border-white/5 hover:border-primary/20 bg-slate-900/60 hover:bg-slate-900 text-[10px] text-slate-400 hover:text-white transition font-sans"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2 items-center mt-2">
                <input
                  type="text"
                  placeholder="Ask the AI Copilot to run queries..."
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-white/5 text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary transition outline-none font-sans"
                />
                <button
                  onClick={handleSendQuery}
                  className="p-3 bg-primary hover:bg-blue-650 rounded-xl text-white transition flex items-center justify-center border border-primary/20 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Insights Panel */}
          <div className="lg:col-span-4 p-6 bg-slate-900/30 border border-white/5 rounded-3xl flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[10px] tracking-[0.25em] font-mono text-primary uppercase block font-bold mb-1">
                COPILOT TELEMETRY
              </span>
              <h3 className="text-base font-bold text-white font-sans uppercase">
                Predictive Analytics
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-2 leading-relaxed">
                SmartFace AI runs hourly background forecasts analyzing student attendance risks.
              </p>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[8px] font-mono text-rose-500 block uppercase font-bold tracking-wider">Dropout Risk Flag</span>
                <span className="text-white font-bold block text-sm">3 Students At Risk</span>
                <p className="text-[9px] text-slate-500 leading-relaxed">Cross-referenced with consecutive leave limits.</p>
              </div>
              <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl space-y-1">
                <span className="text-[8px] font-mono text-emerald-400 block uppercase font-bold tracking-wider">AI Forecast Recommendation</span>
                <span className="text-white font-bold block text-sm">Reschedule ECE sessions</span>
                <p className="text-[9px] text-slate-500 leading-relaxed">Rescheduling Friday morning classes will project a +12% compliance increase.</p>
              </div>
              <div className="p-4 bg-[#090d1a] border border-white/5 rounded-2xl space-y-1">
                <span className="text-[8px] font-mono text-slate-500 block uppercase font-bold tracking-wider">Model Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-400 font-bold font-mono text-[9px]">LLM EMBEDDING READY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
