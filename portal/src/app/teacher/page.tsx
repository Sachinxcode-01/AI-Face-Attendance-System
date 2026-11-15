'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { 
  QrCode, 
  Play, 
  Square, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Camera, 
  RefreshCw, 
  AlertCircle,
  FileCheck2,
  Maximize2
} from 'lucide-react';
import { DEMO_PROFILES, MOCK_LEAVE_REQUESTS } from '@/lib/demo-data';

export default function TeacherPortalPage() {
  const profile = DEMO_PROFILES.teacher;
  const [sessionActive, setSessionActive] = useState(true);
  const [qrCounter, setQrCounter] = useState(15);
  const [qrToken, setQrToken] = useState('SMARTFACE_SEC_99A4F2C');
  const [leaveRequests, setLeaveRequests] = useState(MOCK_LEAVE_REQUESTS);

  // Simulated live roster
  const [roster, setRoster] = useState([
    { id: '1', name: 'Alice Smith', rollNo: 'CS-2024-042', time: '09:02 AM', status: 'present', method: 'ArcFace (99.4%)' },
    { id: '2', name: 'Bob Martinez', rollNo: 'CS-2024-088', time: '09:04 AM', status: 'present', method: 'Dynamic QR' },
    { id: '3', name: 'Catherine Wu', rollNo: 'CS-2024-019', time: '09:06 AM', status: 'present', method: 'ArcFace (98.9%)' },
    { id: '4', name: 'David Chen', rollNo: 'CS-2024-105', time: '--', status: 'absent', method: 'Pending' },
    { id: '5', name: 'Emma Watson', rollNo: 'CS-2024-055', time: '--', status: 'absent', method: 'Pending' },
  ]);

  // Dynamic QR code token countdown timer
  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => {
      setQrCounter((prev) => {
        if (prev <= 1) {
          // Generate new token hash
          setQrToken(`SMARTFACE_SEC_${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  const toggleManualStatus = (id: string) => {
    setRoster((prev) =>
      prev.map((student) =>
        student.id === id
          ? {
              ...student,
              status: student.status === 'present' ? 'absent' : 'present',
              method: student.status === 'present' ? 'Manual Override' : 'Manual Override',
              time: student.status === 'present' ? '--' : '09:12 AM',
            }
          : student
      )
    );
  };

  const handleLeaveAction = (id: string, action: 'approved' | 'rejected') => {
    setLeaveRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: action } : req))
    );
  };

  const presentCount = roster.filter((r) => r.status === 'present').length;

  return (
    <div className="min-h-screen bg-[#070A14] text-[#C8CCDF]">
      <Navbar currentRole="teacher" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Session Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#0E1428] p-6 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2.5 w-2.5 rounded-full ${sessionActive ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                {sessionActive ? 'Live Attendance Session Active' : 'Session Stopped'}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Neural Networks & Deep Learning (Lab 402)
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Faculty: {profile.name} • Lecture Slot: 09:00 AM - 10:30 AM
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSessionActive(!sessionActive)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-lg ${
                sessionActive
                  ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/30'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {sessionActive ? (
                <>
                  <Square className="h-4 w-4 fill-white" />
                  <span>Stop Session</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Start Live Session</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Grid: Dynamic Anti-Proxy QR Projector & Live Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left 5 Cols: Dynamic QR Projector */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#0E1428] p-6 text-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-indigo-400" />
                  <span>Anti-Proxy QR Projector</span>
                </h3>
                <span className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  {qrCounter}s
                </span>
              </div>

              {/* QR Visual Box with rotating cryptographic token */}
              <div className="relative mx-auto my-6 flex h-64 w-64 items-center justify-center rounded-2xl border-2 border-indigo-500/40 bg-white p-4 shadow-2xl shadow-indigo-500/20">
                {/* Simulated high-tech QR code grid */}
                <div className="relative flex flex-col items-center justify-center w-full h-full border border-black/10 rounded-lg bg-gray-50 text-black">
                  <QrCode className="h-44 w-44 text-slate-900" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                      SF
                    </div>
                  </div>
                </div>

                {/* Laser scanline overlay */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan pointer-events-none" />
              </div>

              {/* Token Info Pill */}
              <div className="rounded-xl bg-white/[0.04] p-3 border border-white/5 text-left text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Cryptographic Token:</span>
                  <span className="font-mono text-indigo-400 font-bold">{qrToken}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Anti-Spoofing Window:</span>
                  <span className="text-emerald-400">30s Clock-drift Tolerance</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2">
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Full Screen Projector</span>
                </button>
                <button className="py-2 px-3 rounded-xl bg-indigo-600/30 border border-indigo-500/30 hover:bg-indigo-600/50 text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Kiosk Mode</span>
                </button>
              </div>
            </div>

            {/* Attendance Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#0E1428] p-5">
                <span className="text-xs text-gray-400">Present Today</span>
                <p className="font-display text-2xl font-bold text-emerald-400 mt-1">{presentCount}</p>
                <span className="text-[11px] text-gray-500">of {roster.length} registered</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0E1428] p-5">
                <span className="text-xs text-gray-400">Absent / Pending</span>
                <p className="font-display text-2xl font-bold text-red-400 mt-1">{roster.length - presentCount}</p>
                <span className="text-[11px] text-gray-500">Manual override available</span>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Student Attendance Roster & Leave Approvals */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Live Student Check-in Roster */}
            <div className="rounded-3xl border border-white/10 bg-[#0E1428] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  <span>Live Classroom Roster</span>
                </h3>
                <span className="text-xs text-gray-400">Auto-synced with Supabase & Sheets</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/5 text-gray-400">
                    <tr>
                      <th className="pb-3 font-semibold">Student Name</th>
                      <th className="pb-3 font-semibold">Roll No</th>
                      <th className="pb-3 font-semibold">Time</th>
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold text-right">Status / Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {roster.map((student) => (
                      <tr key={student.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-semibold text-white">{student.name}</td>
                        <td className="py-3 text-gray-400 font-mono">{student.rollNo}</td>
                        <td className="py-3 text-gray-400">{student.time}</td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                            student.status === 'present' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {student.method}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => toggleManualStatus(student.id)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                              student.status === 'present'
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-red-500/20 hover:text-red-300'
                                : 'bg-red-500/20 text-red-300 hover:bg-emerald-500/20 hover:text-emerald-300'
                            }`}
                          >
                            {student.status === 'present' ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Present</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Absent</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leave Approvals Queue */}
            <div className="rounded-3xl border border-white/10 bg-[#0E1428] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-amber-400" />
                  <span>Student Leave Applications</span>
                </h3>
                <span className="text-xs text-amber-400 font-medium">Pending Review</span>
              </div>

              <div className="space-y-3">
                {leaveRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{req.studentName}</span>
                        <span className="text-xs text-gray-400">({req.rollNo})</span>
                        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300 border border-indigo-500/20">
                          {req.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300">{req.reason}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Dates: {req.startDate} to {req.endDate}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleLeaveAction(req.id, 'approved')}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleLeaveAction(req.id, 'rejected')}
                            className="rounded-lg bg-red-600/30 text-red-300 px-3 py-1.5 text-xs font-semibold hover:bg-red-600/50 border border-red-500/30 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                          req.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
