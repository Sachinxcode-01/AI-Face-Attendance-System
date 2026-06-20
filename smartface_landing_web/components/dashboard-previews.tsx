'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  GraduationCap,
  Settings,
  ShieldAlert,
  Play,
  RotateCw,
  Send,
  MessageSquare,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

export default function DashboardPreviews() {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'admin'>('student');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(300); // 5 mins
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState([
    { sender: 'user', text: 'Hi! What is my attendance in Algorithms?' },
    { sender: 'ai', text: 'Hello! Your current attendance in Algorithms (CS-402) is 92.4% (24 out of 26 lectures). You are in excellent standing.' },
  ]);

  // Session timer simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSessionActive && sessionTime > 0) {
      timer = setInterval(() => {
        setSessionTime((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (sessionTime === 0) {
      setIsSessionActive(false);
      setSessionTime(300);
    }
    return () => clearInterval(timer);
  }, [isSessionActive, sessionTime]);

  const handleStartSession = () => {
    setIsSessionActive(!isSessionActive);
    if (!isSessionActive) setSessionTime(300);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newLog = [...chatLog, { sender: 'user', text: chatMessage }];
    setChatLog(newLog);
    setChatMessage('');

    setTimeout(() => {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Got it. I scanned your records for other subjects. You currently stand at 75% in Circuits (EE-201) and have submitted 1 approved leave request. Would you like to review the leave details?`,
        },
      ]);
    }, 1000);
  };

  return (
    <section id="dashboards" className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10">
      
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="text-[10px] tracking-[0.3em] font-mono text-primary uppercase block mb-1">
          Control Center Mockups
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Three Dashboards. One System.
        </h2>
        <p className="text-slate-400 mt-2 max-w-lg mx-auto text-sm md:text-base">
          Tailored user interfaces designed specifically for students, teachers, and system administrators.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex justify-center mb-8">
        <div className="flex gap-2 p-1.5 bg-slate-900/60 border border-white/5 rounded-2xl backdrop-blur-md">
          {[
            { id: 'student', name: 'Student App', icon: <User className="w-3.5 h-3.5" /> },
            { id: 'teacher', name: 'Teacher Console', icon: <GraduationCap className="w-3.5 h-3.5" /> },
            { id: 'admin', name: 'Admin Portal', icon: <Settings className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'student' | 'teacher' | 'admin')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Preview Body */}
      <div className="w-full min-h-[500px] rounded-3xl glass-panel glow-border p-6 md:p-8 relative overflow-hidden flex flex-col justify-between">
        
        {/* Floating cyber grid overlay inside the dashboard panel */}
        <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none -z-10" />

        <AnimatePresence mode="wait">
          
          {/* STUDENT DASHBOARD */}
          {activeTab === 'student' && (
            <motion.div
              key="student-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full"
            >
              {/* Left Column: Personal Stats & Courses */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Header card with student details */}
                <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center font-bold text-white text-lg">
                    PN
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Priya Nair</h3>
                    <p className="text-xs text-slate-400 font-mono">Roll Number: 109 • CS-4th Year</p>
                  </div>
                </div>

                {/* Grid of Subject attendance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Algorithms', code: 'CS-402', rate: 92.4, color: '#10b981' },
                    { name: 'Circuits', code: 'EE-201', rate: 75.0, color: '#f59e0b' },
                    { name: 'Calculus', code: 'MA-301', rate: 88.0, color: '#3b82f6' },
                  ].map((subj) => (
                    <div key={subj.code} className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col items-center">
                      {/* Attendance Ring */}
                      <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="transparent"
                            stroke={subj.color}
                            strokeWidth="4"
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 * (1 - subj.rate / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-bold font-mono text-white">
                          {subj.rate.toFixed(0)}%
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white text-center">{subj.name}</span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase mt-1">{subj.code}</span>
                    </div>
                  ))}
                </div>

                {/* Submissions / Leave status */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Medical Leave approved</span>
                      <span className="text-[10px] text-slate-400 font-mono">Date: 2026-06-18 • Dean approved</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                    APPROVED
                  </span>
                </div>
              </div>

              {/* Right Column: AI Assistant Chat Mockup */}
              <div className="lg:col-span-5 flex flex-col justify-between p-4 bg-slate-900/80 border border-white/5 rounded-2xl h-[380px]">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-3">
                  <MessageSquare className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    AI Student Assistant
                  </span>
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {chatLog.map((chat, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[85%] ${
                        chat.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-slate-500 uppercase mb-1">
                        {chat.sender === 'user' ? 'You' : 'SmartFace AI'}
                      </span>
                      <p
                        className={`text-xs px-3.5 py-2.5 rounded-2xl ${
                          chat.sender === 'user'
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none'
                        }`}
                      >
                        {chat.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-white/5 pt-3 mt-3">
                  <input
                    type="text"
                    placeholder="Ask about your attendance..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/5 focus:border-primary/50 outline-none rounded-xl text-xs text-white"
                  />
                  <button type="submit" className="p-2 rounded-xl bg-primary hover:bg-blue-600 text-white transition">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* TEACHER DASHBOARD */}
          {activeTab === 'teacher' && (
            <motion.div
              key="teacher-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full"
            >
              {/* Left Column: Session Controls & QR Rotation */}
              <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 bg-slate-900/60 border border-white/5 rounded-2xl text-center">
                <span className="text-[10px] tracking-[0.2em] font-mono text-slate-400 uppercase mb-2">
                  Session Scheduler
                </span>
                
                <h4 className="text-lg font-bold text-white mb-6">
                  {isSessionActive ? 'ATTENDANCE SESSION ACTIVE' : 'LAUNCH NEW ATTENDANCE'}
                </h4>

                {/* Animated countdown / QR box */}
                <div className="relative w-44 h-44 flex items-center justify-center border border-white/5 rounded-2xl bg-white/5 p-4 mb-6">
                  {isSessionActive ? (
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-black font-mono text-emerald-400">
                        {Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest mt-1 block">
                        Rotating OTP Token...
                      </span>
                      <div className="w-12 h-12 border border-emerald-400/20 bg-emerald-400/5 rounded-lg flex items-center justify-center mt-3 animate-pulse">
                        <RotateCw className="w-5 h-5 text-emerald-400 animate-spin-slow" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Play className="w-10 h-10 text-primary mb-2 opacity-50" />
                      <span className="text-xs text-slate-400 max-w-[120px]">Ready to launch CS-402 Session.</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleStartSession}
                  className={`w-full py-3.5 rounded-xl font-sans text-xs font-semibold text-white tracking-wide transition-all shadow-md ${
                    isSessionActive
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/10'
                      : 'bg-primary hover:bg-blue-600 shadow-primary/10'
                  }`}
                >
                  {isSessionActive ? 'Terminate Current Session' : 'Start CS-402 Attendance (5 min)'}
                </button>
              </div>

              {/* Right Column: Live verification feed */}
              <div className="lg:col-span-7 flex flex-col justify-between p-4 bg-slate-900/80 border border-white/5 rounded-2xl h-[380px]">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Live Check-in Feed
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 animate-pulse">
                    RECEIVING METRICS
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {isSessionActive ? (
                    <>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] font-mono">
                        <span className="text-emerald-400">[00:01:10] Priya Nair (Roll 109) checked in.</span>
                        <span className="text-slate-500">Confidence: 98.9%</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] font-mono">
                        <span className="text-emerald-400">[00:01:45] Sachin Kumar (Roll 102) checked in.</span>
                        <span className="text-slate-500">Confidence: 99.7%</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] font-mono">
                        <span className="text-emerald-400">[00:02:15] Amit Sen (Roll 112) checked in.</span>
                        <span className="text-slate-500">Confidence: 97.4%</span>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs gap-2">
                      <span>No active session logs. Launch a session to receive check-ins.</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ADMIN PORTAL */}
          {activeTab === 'admin' && (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full"
            >
              {/* Left Column: Security Logs & Intruder Alerts */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Security Intruder Log
                  </h4>
                </div>

                {/* Alarm Card */}
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-rose-400 block">Intruder Flagged: Camera 02</span>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      An unknown face was identified lingering in classroom B for more than 5 seconds.
                    </p>
                    <span className="text-[10px] text-rose-400/80 font-mono block">
                      Snapshot: data/Intruders/intruder_235715.jpg saved. SMTP supervisor alert fired.
                    </span>
                  </div>
                </div>

                {/* Normal Logs */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-slate-300">Intruder Engine camera socket connected.</span>
                  </div>
                  <span className="text-slate-500">Classroom A</span>
                </div>
              </div>

              {/* Right Column: Integration & Sync Status */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Active Sync Connectors
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col justify-between gap-3">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      Google Sheets
                    </span>
                    <div className="flex items-baseline gap-1 text-white font-bold text-base">
                      <span>Live Sync</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse mb-1 ml-1" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 leading-normal">
                      Synced spreadsheet rows: 2,410 check-ins mapped automatically.
                    </span>
                  </div>

                  <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col justify-between gap-3">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      API Rate Limiter
                    </span>
                    <div className="flex items-baseline gap-1 text-white font-bold text-base">
                      <span>98.6% Capacity</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 leading-normal">
                      Active bucket limiting: Auth routes are safe from brute force.
                    </span>
                  </div>
                </div>

                {/* System status */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Database Engine Uptime:</span>
                    <span className="text-emerald-400 font-bold">14 days 2 hours</span>
                  </div>
                  <span className="text-slate-500">MongoDB</span>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </section>
  );
}
