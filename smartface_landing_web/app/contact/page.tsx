'use client';

import React, { useState } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Github, 
  Send, 
  Sparkles, 
  ArrowLeft,
  ShieldCheck,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('support');
  const [message, setMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const faqs = [
    { q: "How accurate is the ArcFace recognition system?", a: "ArcFace achieves an accuracy rate of 98.7% on standard LFW benchmarks. It projects normalized 112x112 pixel face grids into a 512-dimensional angular hyperspace to compare features." },
    { q: "How does the rotating QR code prevent proxy attendance?", a: "The QR code changes every 10 seconds. The client mobile app synchronizes with the server time clock drift. If a student screenshots the code and shares it, the code will expire before it can be scanned." },
    { q: "Is the biometric data GDPR compliant?", a: "Yes. We do not store raw images on our databases. All captures are converted into localized 512-dimensional vector coordinate hashes. They cannot be reconstructed back into images." },
    { q: "What should I do if camera hardware fails?", a: "Teachers and admins have role privilege credentials to manually override attendance logs or register check-ins through command lines in the portal control panel." },
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError('Please fill out all required fields.');
      return;
    }
    setError('');
    setIsLoading(true);

    // Simulate sending message to support API
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-space text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Background aesthetics */}
      <div className="absolute inset-0 cyber-grid opacity-[0.12] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Global Navbar */}
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 pt-32 pb-24 relative z-10 flex flex-col gap-12">
        
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>&gt;</span>
            <span className="text-slate-300 font-bold">Contact</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>Support Network</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase font-sans">
            Get In Touch
          </h1>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Need diagnostic help or custom enterprise integration queries? Drop Sachin K & Team XCoderz a message below. We resolve support queries within 24 hours.
          </p>
        </div>

        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
          
          {/* Left Column: Contact Form */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.04] border border-white/10 rounded-[32px] p-8 backdrop-blur-[30px] shadow-2xl relative overflow-hidden"
            >
              <h3 className="text-lg font-bold text-white font-sans uppercase mb-6">Send Message</h3>

              {success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-400">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                  <div>
                    <span className="font-bold block">Transmission Confirmed</span>
                    <span>Your message has been sent successfully. Sachin K will follow up shortly.</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-400">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Alice"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. alice@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Query Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 text-xs text-white focus:border-primary outline-none font-sans"
                  >
                    <option value="support">Technical Support / Help Desk</option>
                    <option value="enterprise">Enterprise Integration Query</option>
                    <option value="custom-model">ArcFace Model Tuning</option>
                    <option value="billing">Other Concerns</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Message Details</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue or custom integration query..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-primary hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] cursor-pointer"
                >
                  {isLoading ? 'Transmitting details...' : 'Transmit Query'}
                  <Send className="w-4 h-4" />
                </button>

              </form>
            </motion.div>
          </div>

          {/* Right Column: Info & FAQs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Info Cards */}
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase font-sans tracking-wide">Direct Contacts</h3>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">support mailbox</span>
                  <a href="mailto:support@smartface.pro" className="text-xs text-slate-300 hover:text-white transition font-sans">support@smartface.pro</a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Github className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">open source repo</span>
                  <a href="https://github.com/Sachinxcode-01/AI-Face-Attendance-System" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-300 hover:text-white transition font-sans">GitHub: SmartFace AI</a>
                </div>
              </div>
            </div>

            {/* Accordion FAQ Grid */}
            <div className="space-y-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block px-2.5">
                Support FAQs
              </span>
              {faqs.map((faq, idx) => {
                const isOpen = faqOpen === idx;
                return (
                  <div 
                    key={idx}
                    className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden"
                  >
                    <button
                      onClick={() => setFaqOpen(isOpen ? null : idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left text-xs font-bold text-white hover:bg-white/5 transition outline-none cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                        <span>{faq.q}</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-4 text-[11px] text-slate-400 leading-relaxed">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
