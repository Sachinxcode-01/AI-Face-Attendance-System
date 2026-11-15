'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Bot, 
  Send, 
  Award, 
  Sparkles,
  MapPin,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { 
  DEMO_PROFILES, 
  MOCK_STUDENT_ATTENDANCE, 
  MOCK_SUBJECT_STATS, 
  MOCK_TIMETABLE 
} from '@/lib/demo-data';

export default function StudentPortalPage() {
  const profile = DEMO_PROFILES.student;
  const [activeTab, setActiveTab] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'>('Mon');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'nexa', text: `Hi ${profile.name}! I am Nexa, your SmartFace academic copilot. Your overall attendance is 88.6% with a 14-day Golden Blaze streak! How can I assist you today?` },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    // Simulate Nexa AI Copilot response
    setTimeout(() => {
      let reply = `Based on your recent attendance history, your Neural Networks course is at 92.8%. If you attend the next 2 lectures, your semester projection climbs to 94.1%!`;
      if (userText.toLowerCase().includes('leave')) {
        reply = `You currently have 4 safe absence buffer slots in Operating Systems before dropping below the university's 75% requirement. You can safely submit a leave request via the Leave tab.`;
      }
      setChatMessages((prev) => [...prev, { sender: 'nexa', text: reply }]);
    }, 600);
  };

  const filteredTimetable = MOCK_TIMETABLE.filter((t) => t.day === activeTab);

  return (
    <div className="min-h-screen bg-[#070A14] text-[#C8CCDF]">
      <Navbar currentRole="student" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Hero Banner: Welcome + Gamified Streak Badge */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-950/60 via-[#0E1428] to-purple-950/50 p-6 sm:p-8 backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-2">
                <span>Roll No: {profile.rollNo}</span>
                <span>•</span>
                <span>{profile.department}</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Welcome back, {profile.name}!
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                All morning biometrics logged. Next scheduled lecture starts in 45 minutes.
              </p>
            </div>

            {/* Streak Flame Component */}
            <div className="flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 sm:p-5">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30">
                <Flame className="h-8 w-8 animate-pulse text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-black text-white">{profile.streakDays} Days</span>
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30">
                    {profile.streakTier}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  6 more days until <span className="text-amber-400 font-semibold">Diamond Inferno</span> tier
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Stats & Live Insights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#0E1428] p-5">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
              <span>Overall Attendance</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-white">88.6%</span>
              <span className="text-xs text-emerald-400 font-medium">+2.1% this week</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">Above mandatory 75% limit</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0E1428] p-5">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
              <span>Classes Attended</span>
              <UserCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-white">95</span>
              <span className="text-xs text-gray-400">/ 107 total</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">12 authorized absences</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0E1428] p-5">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
              <span>Biometric Accuracy</span>
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-white">99.4%</span>
              <span className="text-xs text-purple-400 font-medium">ArcFace ONNX</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">Sub-300ms verification</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0E1428] p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Nexa AI Assistant</span>
              <Bot className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-xs text-gray-300 my-2">Ask questions regarding absences, predictions & buffers.</p>
            <button
              onClick={() => setAiChatOpen(true)}
              className="w-full py-1.5 px-3 rounded-xl bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 text-xs font-semibold border border-indigo-500/30 transition-colors"
            >
              Open Nexa Chat
            </button>
          </div>
        </div>

        {/* Main Grid: Subject Breakdown & Weekly Timetable */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Subject Breakdown & Recent Logs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Subject Attendance Cards */}
            <div className="rounded-2xl border border-white/10 bg-[#0E1428] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>Subject Attendance Breakdown</span>
                </h3>
                <span className="text-xs text-gray-400">Required: 75%</span>
              </div>

              <div className="space-y-4">
                {MOCK_SUBJECT_STATS.map((sub, idx) => (
                  <div key={idx} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{sub.subject}</span>
                      <span className="text-sm font-bold text-white">{sub.percentage}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${sub.percentage}%`,
                          backgroundColor: sub.color,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{sub.attended} of {sub.total} classes attended</span>
                      <span>{sub.percentage >= 75 ? '🟢 Eligible for Finals' : '🔴 Shortage Warning'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Biometric Check-ins */}
            <div className="rounded-2xl border border-white/10 bg-[#0E1428] p-6">
              <h3 className="font-display text-base font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span>Recent Biometric Check-in Records</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/5 text-gray-400">
                    <tr>
                      <th className="pb-3 font-semibold">Subject</th>
                      <th className="pb-3 font-semibold">Time & Date</th>
                      <th className="pb-3 font-semibold">Location</th>
                      <th className="pb-3 font-semibold">Verification Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {MOCK_STUDENT_ATTENDANCE.map((rec) => (
                      <tr key={rec.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-medium text-white">{rec.subject}</td>
                        <td className="py-3 text-gray-400">{rec.date} • {rec.time}</td>
                        <td className="py-3 text-gray-400">{rec.room}</td>
                        <td className="py-3">
                          {rec.status === 'verified_face' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                              <span>ArcFace Match ({((rec.confidence || 0.99) * 100).toFixed(1)}%)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                              <span>Rotating QR Verified</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Col: Interactive Timetable */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0E1428] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span>Class Timetable</span>
                </h3>
              </div>

              {/* Day Selector Tabs */}
              <div className="grid grid-cols-6 gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/5 mb-4">
                {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveTab(day)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === day
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Slots List */}
              <div className="space-y-3">
                {filteredTimetable.length > 0 ? (
                  filteredTimetable.map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-indigo-400 font-semibold">{slot.time}</span>
                        {slot.status === 'live' && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            LIVE NOW
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">{slot.subject}</h4>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                        <span>{slot.professor}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {slot.room}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-gray-500">
                    No lectures scheduled for {activeTab}.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Floating Nexa AI Drawer / Modal */}
      {aiChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl border border-indigo-500/30 bg-[#0E1428] shadow-2xl shadow-indigo-500/20 backdrop-blur-2xl overflow-hidden flex flex-col h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-indigo-950/60 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-none">Nexa AI Copilot</h4>
                <span className="text-[10px] text-indigo-300">SmartFace LLM Advisor</span>
              </div>
            </div>
            <button
              onClick={() => setAiChatOpen(false)}
              className="text-gray-400 hover:text-white text-xs font-semibold px-2 py-1"
            >
              ✕
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white/[0.05] border border-white/10 text-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="border-t border-white/10 p-3 bg-black/30 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Nexa about attendance or leave..."
              className="flex-1 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
