'use client';

import React, { useState } from 'react';
import { Menu, X, Fingerprint, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);


  const portals = [
    { name: 'Student Portal', href: '/student' },
    { name: 'Lecturer / Teacher Portal', href: '/teacher' },
    { name: 'Admin Sentinel Panel', href: '/admin' },
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 flex justify-center p-4 md:p-6 pointer-events-none">
        <nav className="w-full max-w-7xl h-16 md:h-18 flex items-center justify-between px-6 md:px-8 rounded-2xl bg-slate-950/75 border border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto backdrop-blur-xl transition-all duration-300">
          
          {/* Brand Logo & Engine Badge */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-blue-600/15 border border-blue-500/30 group-hover:border-blue-400/60 group-hover:bg-blue-600/25 transition-all duration-300">
                <Fingerprint className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight font-sans text-white group-hover:text-blue-300 transition-colors">
                  SmartFace
                </span>
                <span className="text-[9px] tracking-wider font-mono text-slate-400">
                  BIOMETRIC CORE
                </span>
              </div>
            </Link>

            {/* Live Operational Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Engine Online</span>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 bg-white/3 p-1 rounded-xl border border-white/5">
            <Link href="/" className="text-xs font-medium font-sans px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/6 transition-all">
              Home
            </Link>
            
            <Link href="/#features" className="text-xs font-medium font-sans px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/6 transition-all">
              Features
            </Link>

            {/* Portals Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setPortalsOpen(true)}
              onMouseLeave={() => setPortalsOpen(false)}
            >
              <button
                className="text-xs font-medium font-sans px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/6 transition-all flex items-center gap-1 cursor-pointer outline-none"
              >
                <span>Portals</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${portalsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {portalsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-slate-900/95 border border-white/10 p-1.5 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-0.5"
                  >
                    {portals.map((portal) => (
                      <Link
                        key={portal.name}
                        href={portal.href}
                        onClick={() => setPortalsOpen(false)}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-blue-600/20 transition-all flex items-center justify-between"
                      >
                        <span>{portal.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">→</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/download" className="text-xs font-medium font-sans px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/6 transition-all flex items-center gap-1.5">
              <span>App</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono">APK</span>
            </Link>

            <Link href="/docs" className="text-xs font-medium font-sans px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/6 transition-all">
              Docs
            </Link>

            <Link href="/contact" className="text-xs font-medium font-sans px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/6 transition-all">
              Contact
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link
              href="/login"
              className="text-xs font-medium text-slate-300 hover:text-white px-3.5 py-2 hover:bg-white/5 rounded-xl transition-all"
            >
              Sign In
            </Link>

            <Link
              href="/login"
              className="relative inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl bg-white text-slate-950 hover:bg-slate-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all"
            >
              <span>Console Access</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-white transition-all"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-lg flex flex-col justify-between p-8 md:hidden"
          >
            <div className="h-20" />

            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-4 py-6 overflow-y-auto max-h-[60vh] pr-2">
              <Link href="/" onClick={() => setIsOpen(false)} className="block text-base font-bold text-slate-100 hover:text-primary transition-colors py-2 border-b border-white/5">
                Home
              </Link>
              <Link href="/#features" onClick={() => setIsOpen(false)} className="block text-base font-bold text-slate-100 hover:text-primary transition-colors py-2 border-b border-white/5">
                Features
              </Link>
              
              <div className="space-y-2 border-b border-white/5 py-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Portals</span>
                {portals.map((portal) => (
                  <Link
                    key={portal.name}
                    href={portal.href}
                    onClick={() => setIsOpen(false)}
                    className="block pl-3 text-sm text-slate-400 hover:text-primary transition"
                  >
                    {portal.name}
                  </Link>
                ))}
              </div>

              <Link href="/#mobile" onClick={() => setIsOpen(false)} className="block text-base font-bold text-slate-100 hover:text-primary transition-colors py-2 border-b border-white/5">
                Mobile App
              </Link>
              <Link href="/docs" onClick={() => setIsOpen(false)} className="block text-base font-bold text-slate-100 hover:text-primary transition-colors py-2 border-b border-white/5">
                Documentation
              </Link>
              <Link href="/contact" onClick={() => setIsOpen(false)} className="block text-base font-bold text-slate-100 hover:text-primary transition-colors py-2 border-b border-white/5">
                Contact
              </Link>
            </div>

            {/* Mobile CTAs */}
            <div className="flex flex-col gap-4">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3.5 rounded-xl border border-white/10 text-sm font-semibold text-white hover:bg-white/5 transition"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3.5 rounded-xl bg-primary text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-blue-600 transition"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
