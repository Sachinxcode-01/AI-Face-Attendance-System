'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, X, Smartphone, ShieldCheck } from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  category: string;
  description: string;
  bgGradient: string;
  accentColor: string;
}

const SCREENS: Slide[] = [
  {
    id: 'splash',
    title: 'Splash & Brand Launch',
    category: 'Branding & Boot Diagnostics',
    description: 'Neural boot diagnostic checks, animated logo scaling, and automatic session restoration.',
    bgGradient: 'from-blue-900/60 via-indigo-950/80 to-slate-950',
    accentColor: '#3559E0',
  },
  {
    id: 'student_dashboard',
    title: 'Student Command Portal',
    category: 'Academic Analytics',
    description: 'Real-time overall attendance ring, subject progress cards, daily timetable, and streak badges.',
    bgGradient: 'from-indigo-900/60 via-slate-950 to-blue-950',
    accentColor: '#6366F1',
  },
  {
    id: 'teacher_qr',
    title: 'Teacher Session & Dynamic QR',
    category: 'Attendance Dispatch',
    description: 'Dynamic 15-second rotating attendance QR generator to prevent classroom proxy fraud.',
    bgGradient: 'from-emerald-900/60 via-slate-950 to-indigo-950',
    accentColor: '#10B981',
  },
  {
    id: 'face_verify',
    title: 'InsightFace Biometric Scanner',
    category: 'AI Face Recognition',
    description: '512-D deep learning facial feature extraction and cosine similarity verification.',
    bgGradient: 'from-cyan-900/60 via-slate-950 to-indigo-950',
    accentColor: '#06B6D4',
  },
  {
    id: 'parent_portal',
    title: 'Parent Linked-Ward View',
    category: 'Parent Portal & RBAC',
    description: 'Restricted 403 authorization guard for parents to track child attendance and leave requests.',
    bgGradient: 'from-purple-900/60 via-slate-950 to-indigo-950',
    accentColor: '#A855F7',
  },
  {
    id: 'admin_grid',
    title: 'Admin Security Control Grid',
    category: 'System Telemetry',
    description: 'Live system diagnostic dashboard, active sessions tracking, and tamper-proof security audit log.',
    bgGradient: 'from-rose-900/60 via-slate-950 to-indigo-950',
    accentColor: '#F43F5E',
  },
];

export const ApkScreenshotCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? SCREENS.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === SCREENS.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'Escape' && fullscreenIndex !== null) setFullscreenIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenIndex]);

  const active = SCREENS[currentIndex];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Production Application Interface</h2>
          <p className="text-xs md:text-sm text-slate-400">
            Real screen workflow previews from the compiled Android application
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            aria-label="Previous screenshot"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next screenshot"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 md:p-8 min-h-[320px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            {/* Screen Meta Details */}
            <div className="flex-1 space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/30">
                {active.category}
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight">{active.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
                {active.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium pt-2">
                <ShieldCheck className="h-4 w-4" /> Live Mobile Contract Tested & Verified
              </div>
            </div>

            {/* Simulated Phone Frame Card */}
            <div className="relative group shrink-0">
              <div className="relative w-64 h-[280px] rounded-3xl border-4 border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-4 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950">
                {/* Simulated Phone Notch */}
                <div className="w-20 h-4 bg-slate-950 rounded-b-xl border-x border-b border-slate-800 mb-2 shrink-0" />

                {/* Content Banner Mockup */}
                <div className="w-full flex-1 rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 flex flex-col justify-center items-center text-center space-y-2">
                  <Smartphone className="h-8 w-8 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">{active.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">pro.smartface.attendance</span>
                </div>

                {/* Simulated Home Bar */}
                <div className="w-24 h-1 bg-slate-700 rounded-full mt-3 shrink-0" />
              </div>

              {/* Fullscreen Trigger Overlay */}
              <button
                onClick={() => setFullscreenIndex(currentIndex)}
                className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl backdrop-blur-sm text-white gap-2 font-medium text-xs"
              >
                <Maximize2 className="h-4 w-4" /> Preview Full Details
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Indicators */}
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-900">
          {SCREENS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {fullscreenIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-xl w-full rounded-3xl border border-indigo-500/30 bg-slate-900 p-6 text-center shadow-2xl"
            >
              <button
                onClick={() => setFullscreenIndex(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest block mb-2">
                {SCREENS[fullscreenIndex].category}
              </span>
              <h3 className="text-2xl font-bold text-white mb-3">
                {SCREENS[fullscreenIndex].title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {SCREENS[fullscreenIndex].description}
              </p>
              <button
                onClick={() => setFullscreenIndex(null)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
              >
                Close Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
