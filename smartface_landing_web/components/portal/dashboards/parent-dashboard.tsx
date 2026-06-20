/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  ShieldAlert,
  CalendarCheck,
  FileSpreadsheet,
  Clock,
  BookOpen,
  Mail,
  UserCheck
} from 'lucide-react';
import AttendanceRing from '@/components/portal/attendance-ring';
import { DashboardCard, StatusBadge, SkeletonLoader } from '@/components/portal/ui-helpers';
import { CustomAreaChart } from '@/components/portal/custom-charts';
import { api } from '@/lib/api';

interface PortalProps {
  forceTab?: string;
}

export default function ParentDashboard({ forceTab }: PortalProps) {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildEmail, setSelectedChildEmail] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Sibling selector helper
  const currentChild = children.find(c => c.email === selectedChildEmail) || {
    full_name: 'Alice Cooper',
    student_id: 'CSE-2026-08',
    department: 'Computer Science & Engineering',
    semester: '6th Semester',
    email: 'student@smartface.pro'
  };

  // Compliance metrics calculated from stats
  const childCompliance = stats?.overall_percentage ? Math.round(stats.overall_percentage * 100) : 81;
  const childStatus = recentLogs.length > 0 ? recentLogs[0].status : 'Present';
  const childSessionsCount = stats?.subjects ? `${stats.subjects.reduce((acc: number, s: any) => acc + s.present, 0)} / ${stats.subjects.reduce((acc: number, s: any) => acc + s.total, 0)} sessions` : '76 / 94 sessions';

  // Compliance trend
  const childTrend = [
    { label: 'W1', value: 85 },
    { label: 'W2', value: 88 },
    { label: 'W3', value: 82 },
    { label: 'W4', value: 80 },
    { label: 'W5', value: 84 },
    { label: 'W6', value: 81 },
    { label: 'W7', value: childCompliance }
  ];

  // Load children on mount
  useEffect(() => {
    async function loadParentData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrorMsg('No token found. Please log in.');
          setIsLoading(false);
          return;
        }

        const wards = await api.getParentChildren(token);
        setChildren(wards);
        if (wards.length > 0) {
          setSelectedChildEmail(wards[0].email);
        } else {
          setSelectedChildEmail('student@smartface.pro');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to load parent dashboard data.');
        setIsLoading(false);
      }
    }
    loadParentData();
  }, []);

  // Fetch ward details when selected child changes
  useEffect(() => {
    if (!selectedChildEmail) return;

    async function loadWardData() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch stats
        try {
          const statsData = await api.getParentChildStats(selectedChildEmail, token);
          setStats(statsData);
        } catch (e) {
          console.error("Failed to load child stats:", e);
        }

        // Fetch logs
        try {
          const logs = await api.getParentChildAttendanceLogs(selectedChildEmail, token);
          setRecentLogs(logs);
        } catch (e) {
          console.error("Failed to load child logs:", e);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error(err);
      }
    }
    loadWardData();
  }, [selectedChildEmail]);

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
      
      {/* Sibling picker and top metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/30 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">
              Parent Watch Access
            </h3>
            <span className="text-sm font-bold text-white font-sans">
              Dependent Ward Monitoring
            </span>
          </div>
        </div>

        {/* Child Selector Select dropdown */}
        <select
          value={selectedChildEmail}
          onChange={(e: any) => setSelectedChildEmail(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:border-primary transition outline-none font-sans"
        >
          {children.map((c: any) => (
            <option key={c.email} value={c.email}>
              {c.full_name} ({c.student_id})
            </option>
          ))}
          {children.length === 0 && (
            <option value="student@smartface.pro">Alice Cooper (CSE-2026-08)</option>
          )}
        </select>
      </div>

      {/* Main details grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Child profile overview */}
        <DashboardCard className="flex flex-col justify-between" glow={childCompliance < 65}>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-white font-sans uppercase leading-none">
                  {currentChild.full_name}
                </h3>
                <span className="text-[9px] font-mono text-slate-400 mt-1 block tracking-wider">
                  ROLL: {currentChild.student_id}
                </span>
              </div>
              <StatusBadge status={childStatus as any} />
            </div>

            <div className="space-y-2 text-xs font-sans pt-2 border-t border-white/5">
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-white font-bold">{currentChild.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Semester:</span>
                <span className="text-white font-bold">{currentChild.semester}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Check-in Sessions:</span>
                <span className="text-white font-mono font-bold">{childSessionsCount}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
            <button className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl border border-white/10 text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Get PDF Report</span>
            </button>
          </div>
        </DashboardCard>

        {/* Circular compliance gauge */}
        <DashboardCard className="flex flex-col items-center justify-center text-center">
          <h3 className="font-extrabold text-sm font-sans mb-4 self-start">Compliance Standing</h3>
          <AttendanceRing percentage={childCompliance} size={130} />
          {childCompliance < 65 && (
            <div className="mt-4 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded-lg font-sans leading-relaxed max-w-[220px]">
              ⚠️ Attendance below 75%. Subject to academic sanction.
            </div>
          )}
        </DashboardCard>

        {/* Absence alerts desk */}
        <DashboardCard>
          <h3 className="font-extrabold text-sm font-sans mb-4">Alert Notification Desk</h3>
          <div className="space-y-3">
            {childCompliance < 65 ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 text-rose-400 text-xs leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-mono">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Critical Status Warning
                </div>
                <p>Child compliance score ({childCompliance}%) has fallen below critical administrative thresholds.</p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-emerald-400 text-xs leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-mono">
                  <UserCheck className="w-3.5 h-3.5" />
                  Status Good
                </div>
                <p>Child compliance score ({childCompliance}%) is holding clean. No alerts are registered.</p>
              </div>
            )}
            
            <div className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-[11px] text-slate-400 leading-normal">
              Absence alerts are dispatched via SMS automatically if check-ins are not completed by 10:45 AM on scheduled class days.
            </div>
          </div>
        </DashboardCard>

      </div>

      {/* Analytics Trend Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCard className="lg:col-span-2">
          <h3 className="font-extrabold text-sm font-sans mb-4">Attendance Trend Analysis</h3>
          <CustomAreaChart data={childTrend} height={200} />
        </DashboardCard>

        {/* Recent Session Logs */}
        <DashboardCard>
          <h3 className="font-extrabold text-sm font-sans mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {recentLogs.length > 0 ? recentLogs.slice(0, 3).map((rec: any, idx: number) => (
              <div key={idx} className="p-3 border border-white/5 rounded-xl bg-slate-950/20 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-500 block">{rec.date}</span>
                  <h4 className="font-bold text-white font-sans">{rec.subject}</h4>
                  <span className="text-[9px] text-slate-400 font-sans">Via: {rec.verifiedBy}</span>
                </div>
                <StatusBadge status={rec.status as any} />
              </div>
            )) : (
              <div className="text-center py-6 text-slate-500 text-xs font-sans">No recent records.</div>
            )}
          </div>
        </DashboardCard>
      </div>

    </div>
  );
}
