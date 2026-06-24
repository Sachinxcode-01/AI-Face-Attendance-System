'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, RotateCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MaintenancePage() {
  const [timeLeft, setTimeLeft] = useState(1440); // 24 minutes

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04),transparent_60%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/[0.04] border border-white/10 rounded-[32px] p-8 text-center backdrop-blur-[30px] shadow-2xl space-y-6 relative"
      >
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-primary/10 border border-primary/20 rounded-2xl">
          <Cpu className="w-10 h-10 text-primary animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <span className="text-[9px] font-mono text-primary uppercase tracking-widest font-bold block">
            System Maintenance
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight font-sans">
            Optimizing Nodes
          </h2>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xs mx-auto">
            We are compiling optimized vector indexes and tuning the ArcFace model matrices.
          </p>
        </div>

        {/* Countdown Timer Grid */}
        <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl text-center space-y-1.5">
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Estimated Resume Time</span>
          <span className="text-2xl font-mono font-bold text-white tracking-widest">{formatTime(timeLeft)}</span>
        </div>

        {/* Status logs */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-left font-mono text-[9px] text-slate-400 space-y-1">
          <div className="text-white font-bold pb-1 border-b border-white/5 flex justify-between">
            <span>UPGRADE PIPELINE STATUS</span>
            <span className="text-primary animate-pulse">● COMPILING</span>
          </div>
          <div>[TASK 1/3] Re-indexing biometric collections... DONE</div>
          <div>[TASK 2/3] Compressing MTCNN cascades... DONE</div>
          <div>[TASK 3/3] Deploying ArcFace ONNX runtime... RUNNING</div>
        </div>

        <div className="pt-2 grid grid-cols-2 gap-4">
          <button
            onClick={() => window.location.reload()}
            className="py-3 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white border border-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Check Status</span>
          </button>
          
          <Link
            href="/"
            className="py-3 border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

      </motion.div>

    </div>
  );
}
