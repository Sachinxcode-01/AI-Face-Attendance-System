'use client';

import React, { useState } from 'react';
import { Menu, X, ArrowRight, Fingerprint, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);

  // Prevent open redirect vulnerabilities by validating relative internal paths
  const safeRedirect = (target: string): string => {
    if (!target || typeof target !== 'string') return '/login';
    const trimmed = target.trim();
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
      return trimmed;
    }
    return '/login';
  };

  const portals = [
    { name: 'Student Portal', href: safeRedirect('/login') },
    { name: 'Parent Portal', href: safeRedirect('/login') },
    { name: 'Teacher Portal', href: safeRedirect('/login') },
    { name: 'Admin Portal', href: safeRedirect('/login') },
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 flex justify-center p-4 md:p-6 pointer-events-none">
        <nav className="w-full max-w-7xl h-16 md:h-20 flex items-center justify-between px-6 md:px-8 rounded-2xl glass-panel pointer-events-auto backdrop-blur-md transition-all duration-300">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all duration-300">
              <Fingerprint className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider font-sans text-white group-hover:text-primary transition-colors">
                SMARTFACE
              </span>
              <span className="text-[9px] tracking-[0.25em] font-mono text-slate-400">
                AI ATTENDANCE
              </span>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link href="/" className="text-xs font-medium font-sans tracking-wide text-slate-300 hover:text-white transition-colors relative group py-2">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
            
            <Link href="/#features" className="text-xs font-medium font-sans tracking-wide text-slate-300 hover:text-white transition-colors relative group py-2">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Link>

            {/* Portals Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setPortalsOpen(true)}
              onMouseLeave={() => setPortalsOpen(false)}
            >
              <button
                className="text-xs font-medium font-sans tracking-wide text-slate-300 hover:text-white transition-colors flex items-center gap-1 py-2 cursor-pointer outline-none"
              >
                <span>Portals</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${portalsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {portalsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-1 w-48 rounded-xl bg-slate-900 border border-white/10 p-2 shadow-2xl backdrop-blur-md z-50 flex flex-col gap-1"
                  >
                    {portals.map((portal) => (
                      <Link
                        key={portal.name}
                        href={portal.href}
                        onClick={() => setPortalsOpen(false)}
                        className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition"
                      >
                        {portal.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/#mobile" className="text-xs font-medium font-sans tracking-wide text-slate-300 hover:text-white transition-colors relative group py-2">
              Mobile App
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Link>

            <Link href="/docs" className="text-xs font-medium font-sans tracking-wide text-slate-300 hover:text-white transition-colors relative group py-2">
              Documentation
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Link>

            <Link href="/contact" className="text-xs font-medium font-sans tracking-wide text-slate-300 hover:text-white transition-colors relative group py-2">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition"
            >
              Sign In
            </Link>
            
            <Link
              href="/login"
              className="relative inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-primary text-white border border-primary/20 overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
