'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background radial spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05),transparent_60%)]" />
      
      {/* 3D Orb Backdrop glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />

      {/* Main glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white/[0.04] border border-white/10 rounded-[32px] p-8 text-center backdrop-blur-[30px] shadow-2xl space-y-6 relative overflow-hidden"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes radar-pulse {
            0% { transform: scale(0.8); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 0.4; }
            100% { transform: scale(0.8); opacity: 0.8; }
          }
          .animate-radar {
            animation: radar-pulse 3s infinite ease-in-out;
          }
        `}} />

        {/* Circular Biometric Radar Scanner Loader */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-full animate-radar">
          <Sparkles className="w-8 h-8 text-primary animate-spin-slow" />
          <div className="absolute inset-0 rounded-full border border-dashed border-primary/40 animate-spin" style={{ animationDuration: '8s' }} />
        </div>

        <div className="space-y-3">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block animate-pulse">
            Establishing Session Connection
          </span>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
            Loading Biometrics...
          </h3>
          
          {/* Skeleton Loaders / Shimmers */}
          <div className="space-y-2 pt-2">
            <div className="h-2 w-3/4 mx-auto rounded bg-white/5 animate-pulse" />
            <div className="h-1.5 w-1/2 mx-auto rounded bg-white/5 animate-pulse" />
          </div>
        </div>

      </motion.div>

    </div>
  );
}
