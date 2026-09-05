'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForbiddenPage() {
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRequested(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background radial spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.05),transparent_60%)]" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/[0.04] border border-white/10 rounded-[32px] p-8 text-center backdrop-blur-[30px] shadow-2xl space-y-6 relative"
      >
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <ShieldAlert className="w-10 h-10 text-rose-400 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[9px] font-mono text-rose-400 uppercase tracking-widest font-bold block">
            Error Code: 403
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight font-sans">
            Access Forbidden
          </h2>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xs mx-auto">
            You do not possess the required hierarchical role privileges (RBAC) to load this command panel.
          </p>
        </div>

        {requested ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-left text-xs text-emerald-400 font-sans">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <div>
              <span className="font-bold block">Request Dispatched</span>
              <span>Dean and security administrators have been notified to review your context.</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleRequest}
            disabled={loading}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-rose-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] cursor-pointer"
          >
            {loading ? 'Submitting request...' : 'Request Access Privilege'}
            <Send className="w-4 h-4" />
          </button>
        )}

        <div className="pt-2">
          <Link
            href="/"
            className="w-full py-3 border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Core Workspace</span>
          </Link>
        </div>

      </motion.div>

    </div>
  );
}
