/* eslint-disable */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  BookOpen,
  CalendarCheck,
  Flame,
  Award,
  Shield,
  Smartphone,
  CheckCircle,
  Clock
} from 'lucide-react';
import { DashboardCard, UserAvatar } from '@/components/portal/ui-helpers';

export default function ProfilePage() {
  const profileDetails = {
    name: 'Alice Cooper',
    role: 'Student',
    rollNo: 'CSE-2026-08',
    email: 'alice@smartface.pro',
    phone: '+1 (555) 019-2834',
    department: 'Computer Science & Engineering',
    semester: '6th Semester',
    admittedYear: '2023',
    gpa: '3.86 CGPA',
    avatar: 'AC'
  };

  const attendanceStats = {
    totalLectures: 94,
    present: 76,
    late: 8,
    absent: 10,
    compliance: '81.5%',
    streak: '14 Days'
  };

  return (
    <div className="space-y-6">
      
      {/* Profile banner card */}
      <DashboardCard className="flex flex-col md:flex-row md:items-center justify-between gap-6" glow>
        <div className="flex items-center gap-4">
          <UserAvatar name={profileDetails.name} role={profileDetails.role} size="lg" />
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white font-sans uppercase leading-none">
              {profileDetails.name}
            </h2>
            <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">
              Roll No: {profileDetails.rollNo} | {profileDetails.department}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-sans font-bold">
          <CheckCircle className="w-4.5 h-4.5" />
          <span>Biometrics Enrolled</span>
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Bio / Academic Details */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardCard className="space-y-4">
            <h3 className="font-extrabold text-sm font-sans flex items-center gap-2 text-white">
              <BookOpen className="w-4.5 h-4.5 text-primary" />
              Biographical & Academic Dossier
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-3 bg-slate-950/20 border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                  Institutional Email
                </span>
                <span className="text-white font-semibold font-mono">{profileDetails.email}</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                  Mobile Number
                </span>
                <span className="text-white font-semibold font-mono">{profileDetails.phone}</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                  Current Year / Semester
                </span>
                <span className="text-white font-semibold">{profileDetails.semester} ({profileDetails.admittedYear} Batch)</span>
              </div>
              <div className="p-3 bg-slate-950/20 border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                  GPA standing
                </span>
                <span className="text-white font-semibold">{profileDetails.gpa}</span>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Right: Summary Statistics Quick View */}
        <DashboardCard className="space-y-4">
          <h3 className="font-extrabold text-sm font-sans flex items-center gap-2 text-white">
            <CalendarCheck className="w-4.5 h-4.5 text-primary" />
            Attendance Standing
          </h3>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400">Total Lecture Sessions:</span>
              <span className="text-white font-bold font-mono">{attendanceStats.totalLectures}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400">Present Count:</span>
              <span className="text-emerald-400 font-bold font-mono">{attendanceStats.present}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400">Late Arrivals:</span>
              <span className="text-amber-400 font-bold font-mono">{attendanceStats.late}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400">Absent Classes:</span>
              <span className="text-rose-500 font-bold font-mono">{attendanceStats.absent}</span>
            </div>
            <div className="flex justify-between items-center pt-2 text-sm">
              <span className="text-slate-300 font-bold">Average Compliance:</span>
              <span className="text-emerald-400 font-black font-mono">{attendanceStats.compliance}</span>
            </div>
          </div>
        </DashboardCard>

      </div>

    </div>
  );
}
