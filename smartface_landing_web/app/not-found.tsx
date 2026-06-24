'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { EyeOff, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Visual cyber mesh backdrops */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_60%)]" />
      
      {/* Pulsing floating wireframe orb background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-[90px] pointer-events-none animate-pulse-slow" />

      {/* Main glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/[0.04] border border-white/10 rounded-[32px] p-8 text-center backdrop-blur-[30px] shadow-2xl relative overflow-hidden space-y-6"
      >
        {/* Holographic scanner laser line decoration */}
        <div className="absolute left-0 right-0 h-[1.5px] bg-primary opacity-60 shadow-[0_0_10px_#3b82f6] top-1/3 animate-pulse pointer-events-none" />

        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <EyeOff className="w-10 h-10 text-primary animate-bounce" />
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-[#020617] animate-ping" />
        </div>

        <div className="space-y-2">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
            Error Code: 404
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight font-sans">
            Page Not Located
          </h2>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xs mx-auto">
            The target biometric endpoint or page route was not found in the SmartFace database.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Link
            href="/"
            className="w-full py-3.5 bg-primary hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Core Workspace</span>
          </Link>

          <Link
            href="/docs"
            className="w-full py-3.5 border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>View API Route Specs</span>
          </Link>
        </div>

      </motion.div>

    </div>
  );
}
