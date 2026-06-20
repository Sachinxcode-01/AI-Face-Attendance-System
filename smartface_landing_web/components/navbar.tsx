'use client';

import React, { useState } from 'react';
import { Menu, X, ArrowRight, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Core AI', href: '#core' },
    { name: 'QR Verification', href: '#qr' },
    { name: 'Command Center', href: '#command' },
    { name: 'Dashboards', href: '#dashboards' },
    { name: 'Network', href: '#network' },
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
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-medium font-sans tracking-wide text-slate-300 hover:text-white transition-colors relative group py-2"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition"
            >
              Sign In
            </Link>
            
            {/* Magnetic glowing button */}
            <a
              href="#demo"
              className="relative inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-primary text-white border border-primary/20 overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <span>Book Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
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
            {/* Header placeholder spacer */}
            <div className="h-20" />

            {/* Mobile Nav Links */}
            <div className="flex flex-col gap-6 py-6">
              {navLinks.map((link, idx) => (
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-bold text-slate-100 hover:text-primary transition-colors py-2 border-b border-white/5"
                >
                  {link.name}
                </motion.a>
              ))}
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
              <a
                href="#demo"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3.5 rounded-xl bg-primary text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition"
              >
                Book Demo
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
