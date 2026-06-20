'use client';

import React, { useState } from 'react';
import { Fingerprint, ShieldCheck, ArrowRight, Github, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <footer className="w-full bg-slate-950 border-t border-white/5 pt-16 pb-12 relative z-10">
      
      {/* Background space blur */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-7xl px-6 md:px-8 mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12">
        
        {/* Brand Column */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <a href="#" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Fingerprint className="w-4.5 h-4.5 text-primary" />
            </div>
            <span className="text-sm font-bold tracking-wider font-sans text-white">
              SMARTFACE AI
            </span>
          </a>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-sm">
            Autonomous biometric classroom attendance and intruder sentinel protection. Built on high-accuracy ArcFace ONNX neural models and active SMTP SMTP alert pipelines.
          </p>
          <div className="flex items-center gap-4 text-slate-400 mt-2">
            <a href="#" className="hover:text-white transition"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="hover:text-white transition"><Linkedin className="w-4 h-4" /></a>
            <a href="#" className="hover:text-white transition"><Github className="w-4 h-4" /></a>
          </div>
        </div>

        {/* Sitemap Columns */}
        <div className="md:col-span-5 grid grid-cols-3 gap-6">
          <div className="flex flex-col gap-3.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
              Portals Available
            </span>
            <Link href="/login" className="text-xs text-slate-400 hover:text-white transition">Student Portal</Link>
            <Link href="/login" className="text-xs text-slate-400 hover:text-white transition">Parent Portal</Link>
            <Link href="/login" className="text-xs text-slate-400 hover:text-white transition">Teacher Portal</Link>
            <Link href="/login" className="text-xs text-slate-400 hover:text-white transition">Admin Portal</Link>
          </div>

          <div className="flex flex-col gap-3.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
              Core Systems
            </span>
            <a href="#features" className="text-xs text-slate-400 hover:text-white transition">Attendance Management</a>
            <a href="#features" className="text-xs text-slate-400 hover:text-white transition">Leave Management</a>
            <a href="#features" className="text-xs text-slate-400 hover:text-white transition">Analytics & Trends</a>
            <a href="#features" className="text-xs text-slate-400 hover:text-white transition">Reports Generator</a>
          </div>

          <div className="flex flex-col gap-3.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
              Infrastructure
            </span>
            <a href="#features" className="text-xs text-slate-400 hover:text-white transition">Notifications System</a>
            <a href="#features" className="text-xs text-slate-400 hover:text-white transition">Security Center (RBAC)</a>
            <a href="#features" className="text-xs text-slate-400 hover:text-white transition">System Monitoring</a>
          </div>
        </div>

        {/* Newsletter Signup Column */}
        <div className="md:col-span-3 flex flex-col gap-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
            Subscribe to Insights
          </span>
          <p className="text-xs text-slate-400 leading-relaxed">
            Get the latest updates on deep learning models and enterprise classroom protection.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-3 pr-10 py-2.5 bg-white/5 border border-white/5 focus:border-primary/50 outline-none rounded-xl text-xs text-white placeholder-slate-500 font-sans"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary hover:bg-blue-600 text-white transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
          {submitted && (
            <span className="text-[10px] font-mono text-emerald-400 animate-pulse">
              ✓ Subscribed! Welcome to SmartFace AI.
            </span>
          )}
        </div>

      </div>

      {/* Legal & Security Compliance Bar */}
      <div className="w-full max-w-7xl px-6 md:px-8 mx-auto border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        
        {/* Licensing */}
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <span className="text-[11px] text-slate-500 font-mono">
            © {new Date().getFullYear()} SmartFace AI. MIT Licensed Platform.
          </span>
          <span className="text-[9px] text-slate-600 font-mono">
            Designed for next-gen academic biometric automation.
          </span>
        </div>

        {/* Security badges */}
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 border border-white/5 text-[9px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SOC2 COMPLIANT</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 border border-white/5 text-[9px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>GDPR DECLARED</span>
          </div>
        </div>

      </div>

    </footer>
  );
}
