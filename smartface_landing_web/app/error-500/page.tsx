'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ServerErrorPage() {
  const [reconnecting, setReconnecting] = useState(false);
  const [status, setStatus] = useState('DATABASE_DISCONNECT_FATAL');

  const handleReconnect = () => {
    setReconnecting(true);
    setTimeout(() => {
      setReconnecting(false);
      setStatus('CONNECTION_RE_ESTABLISHED_OK');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Visual neon backdrops */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.04),transparent_60%)]" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white/[0.04] border border-white/10 rounded-[32px] p-8 text-center backdrop-blur-[30px] shadow-2xl space-y-6 relative"
      >
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <AlertTriangle className="w-10 h-10 text-amber-400 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold block">
            Error Code: 500
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight font-sans">
            Internal Server Error
          </h2>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xs mx-auto">
            The FastAPI authentication pipeline has experienced an unhandled network rejection context.
          </p>
        </div>

        {/* Telemetry Stack Trace Terminal Block */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-left font-mono text-[10px] text-slate-400 space-y-1 max-h-[120px] overflow-y-auto pr-1">
          <div className="text-white font-bold pb-1 border-b border-white/5 flex justify-between">
            <span>DIAGNOSTIC TELEMETRY LOG</span>
            <span className={status.includes('OK') ? 'text-emerald-400 animate-pulse' : 'text-amber-400 animate-pulse'}>
              ● {status}
            </span>
          </div>
          <div>[STACK] RuntimeError: Lost connection to replica set core_cluster.</div>
          <div>[STACK] at src.config.database.get_db() line 42</div>
          <div>[STACK] at fastapi.dependencies.utils.solve_dependencies() line 228</div>
          <div>[STACK] Connection retry failed (limit: 5). Firing event sentinel...</div>
        </div>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleReconnect}
            disabled={reconnecting}
            className="py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${reconnecting ? 'animate-spin' : ''}`} />
            <span>{reconnecting ? 'Reconnecting...' : 'Re-verify API'}</span>
          </button>

          <Link
            href="/"
            className="py-3.5 border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>

      </motion.div>

    </div>
  );
}
