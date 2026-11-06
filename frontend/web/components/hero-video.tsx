'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Scan, 
  CheckCircle2, 
  Activity, 
  QrCode, 
  RefreshCw, 
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentProfile {
  name: string;
  roll: string;
  department: string;
  avatarSeed: string;
  confidence: number;
  time: string;
  status: 'verified' | 'flagged' | 'scanning';
  liveness: number;
}

const SAMPLE_PROFILES: StudentProfile[] = [
  {
    name: 'Elena Rostova',
    roll: '2024-CS-042',
    department: 'Computer Science • Year 3',
    avatarSeed: 'elena',
    confidence: 99.87,
    time: '10:04:12 AM',
    status: 'verified',
    liveness: 0.996
  },
  {
    name: 'Marcus Chen',
    roll: '2024-AI-118',
    department: 'Robotics & AI • Year 2',
    avatarSeed: 'marcus',
    confidence: 99.64,
    time: '10:04:26 AM',
    status: 'verified',
    liveness: 0.998
  },
  {
    name: 'Aisha Patel',
    roll: '2024-DS-089',
    department: 'Data Science • Year 4',
    avatarSeed: 'aisha',
    confidence: 99.91,
    time: '10:04:41 AM',
    status: 'verified',
    liveness: 0.995
  }
];

export default function ModernHeroScanner() {
  const [activeTab, setActiveTab] = useState<'face' | 'qr' | 'liveness'>('face');
  const [profileIndex, setProfileIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<'idle' | 'detecting' | 'embedding' | 'verified'>('verified');
  const [liveConfidence, setLiveConfidence] = useState(99.87);
  const [liveLogCount, setLiveLogCount] = useState(1482);

  const currentProfile = SAMPLE_PROFILES[profileIndex];

  const handleTriggerScan = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep('detecting');

    setTimeout(() => {
      setScanStep('embedding');
    }, 600);

    setTimeout(() => {
      const nextIdx = (profileIndex + 1) % SAMPLE_PROFILES.length;
      setProfileIndex(nextIdx);
      setLiveConfidence(SAMPLE_PROFILES[nextIdx].confidence + (Math.random() * 0.1 - 0.05));
      setLiveLogCount(prev => prev + 1);
      setScanStep('verified');
      setIsScanning(false);
    }, 1300);
  }, [isScanning, profileIndex]);

  // Automatic gentle rotation of simulated scans
  useEffect(() => {
    const timer = setInterval(() => {
      handleTriggerScan();
    }, 6000);
    return () => clearInterval(timer);
  }, [handleTriggerScan]);

  return (
    <div className="w-full h-full flex items-center justify-center relative select-none">
      {/* Ambient background light field */}
      <div className="absolute -inset-4 bg-linear-to-tr from-primary/20 via-indigo-500/10 to-violet-500/15 rounded-[40px] blur-3xl pointer-events-none -z-10" />

      {/* 21st ShineBorder Security Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative rounded-3xl p-px overflow-hidden shadow-2xl"
      >
        {/* Animated Scanner Shine Border Layer from 21st Component */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none -z-10" />
          <div className="absolute inset-0 bg-linear-to-b from-primary via-indigo-400 to-violet-400 animate-shine-scan opacity-60 blur-xs" />
        </div>

        {/* Inner Content Layer */}
        <div className="relative z-10 w-full rounded-[23px] bg-slate-950/90 border border-white/8 p-5 backdrop-blur-2xl">
          {/* Subtle top edge specular highlight */}
          <div className="absolute top-0 inset-x-8 h-px bg-linear-to-r from-transparent via-accent/50 to-transparent" />

          {/* ── CARD HEADER: Device Status & Mode Selector ── */}
          <div className="flex items-center justify-between pb-4 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping absolute opacity-75" />
                <span className="w-2 h-2 rounded-full bg-accent" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold tracking-wide text-white font-sans">
                    Kiosk Node #01
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-mono font-medium">
                    ArcFace 512D
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Latency: 14ms • Room CS-402
                </p>
              </div>
            </div>

            {/* Interactive Mode Pills */}
            <div className="flex items-center gap-1 bg-white/4 p-1 rounded-xl border border-white/6">
              <button
                onClick={() => setActiveTab('face')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                  activeTab === 'face'
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Face ID
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                QR Sync
              </button>
            </div>
          </div>

        {/* ── VIEWPORT: Biometric Scanner Surface ── */}
        <div className="relative mt-4 aspect-4/3 rounded-2xl bg-linear-to-b from-slate-900/90 to-slate-950/90 border border-white/8 overflow-hidden flex flex-col items-center justify-center">
          
          {/* Subtle Grid Matrix Background */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* Dynamic Biometric Face Mesh / Reticle */}
          {activeTab === 'face' && (
            <div className="relative w-44 h-44 flex items-center justify-center">
              
              {/* Outer Alignment Brackets */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400/80 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400/80 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400/80 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400/80 rounded-br-lg" />
              </div>

              {/* Realistic Geometric Face Silhouette */}
              <svg 
                className="w-36 h-36 text-blue-500/20"
                viewBox="0 0 100 100" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.2"
              >
                {/* Face Oval */}
                <ellipse cx="50" cy="50" rx="34" ry="42" className="stroke-blue-400/40" />
                
                {/* Eyebrows & Eyes Landmark Anchors */}
                <circle cx="38" cy="42" r="2.5" className="fill-blue-400 stroke-none" />
                <circle cx="62" cy="42" r="2.5" className="fill-blue-400 stroke-none" />
                
                {/* Eyebrow vectors */}
                <path d="M 32 37 Q 38 34 44 37" className="stroke-blue-400/60" strokeLinecap="round" />
                <path d="M 56 37 Q 62 34 68 37" className="stroke-blue-400/60" strokeLinecap="round" />

                {/* Nose bridge vector */}
                <path d="M 50 42 L 50 54 L 54 57" className="stroke-blue-400/60" strokeLinecap="round" strokeLinejoin="round" />

                {/* Lips vector */}
                <path d="M 42 67 Q 50 71 58 67" className="stroke-blue-400/60" strokeLinecap="round" />
                <path d="M 44 67 Q 50 63 56 67" className="stroke-blue-400/40" strokeLinecap="round" />

                {/* Cheek and Chin contour vertices */}
                <circle cx="28" cy="54" r="1.5" className="fill-blue-400/60" />
                <circle cx="72" cy="54" r="1.5" className="fill-blue-400/60" />
                <circle cx="50" cy="78" r="1.5" className="fill-blue-400/60" />
              </svg>

              {/* Scanning Ray - Ultra Subtle, High-End Pulse */}
              <motion.div
                animate={{
                  y: [-60, 60, -60],
                  opacity: [0.3, 0.9, 0.3]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-x-2 h-px bg-linear-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)] pointer-events-none"
              />

              {/* Verified Badge Overlay */}
              <AnimatePresence>
                {scanStep === 'verified' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] rounded-2xl"
                  >
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-xl">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-bold text-white tracking-wide font-sans">
                        Identity Verified
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 font-semibold">
                        {liveConfidence.toFixed(2)}% Match Score
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Dynamic QR Mode View */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-lg">
                <QrCode className="w-28 h-28 text-slate-900" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
                <span>Anti-Proxy Token: Active</span>
              </div>
            </div>
          )}

          {/* Floating status tag on the bottom-right of viewport */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 border border-white/8 text-[9px] font-mono text-slate-400 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-emerald-400" />
            <span>Anti-Spoof 3D: PASS</span>
          </div>

          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 border border-white/8 text-[9px] font-mono text-slate-400 flex items-center gap-1">
            <Activity className="w-2.5 h-2.5 text-blue-400" />
            <span>Embedding: 512-Float</span>
          </div>
        </div>

        {/* ── STUDENT DETAILS / VERIFICATION TICKET ── */}
        <div className="mt-4 p-3.5 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 p-px relative">
              <div className="w-full h-full rounded-[11px] bg-slate-900 flex items-center justify-center font-bold text-xs text-white uppercase">
                {currentProfile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white font-sans">
                  {currentProfile.name}
                </h4>
                <span className="text-[9px] font-mono text-slate-400">
                  {currentProfile.roll}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                {currentProfile.department}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold block mb-0.5">
              CHECK-IN CONFIRMED
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              {currentProfile.time}
            </span>
          </div>
        </div>

          {/* ── INTERACTIVE CONTROLS ── */}
          <div className="mt-3.5 flex items-center justify-between gap-2 pt-1">
            <div className="text-[10px] text-slate-400 font-mono">
              Audit Ledger: <span className="text-accent font-semibold">#{liveLogCount}</span>
            </div>

            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Scan className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Processing Vector...' : 'Simulate Live Scan'}</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
