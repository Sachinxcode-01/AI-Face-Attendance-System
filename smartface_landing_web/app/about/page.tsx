'use client';

import React from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { DashboardCard } from '@/components/portal/ui-helpers';
import { 
  Github, 
  User, 
  Users, 
  Cpu, 
  ShieldCheck, 
  CheckCircle, 
  Sparkles, 
  Terminal, 
  ArrowUpRight, 
  Code2, 
  Heart,
  Layers,
  GraduationCap,
  Bell,
  Activity,
  Workflow
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const highlights = [
    { text: "AI Face Recognition using ArcFace", icon: Cpu, desc: "High-accuracy face representation vectors and sub-second matching." },
    { text: "Smart Attendance Management", icon: CheckCircle, desc: "Autonomous roll calls with instant verification." },
    { text: "Dynamic QR Verification", icon: Workflow, desc: "Time-synced rotating QR codes preventing geo-spoofing." },
    { text: "Real-Time Monitoring", icon: Activity, desc: "Live dashboard stream of room logs and biometric check-ins." },
    { text: "Intruder Detection System", icon: ShieldCheck, desc: "Autonomous alerts trigger on unknown face capture." },
    { text: "AI Analytics & Insights", icon: Sparkles, desc: "Deep performance forecasting and student risk modeling." },
    { text: "Student Mobile Application", icon: User, desc: "Personal analytics, leaves tracking, and smart QR client." },
    { text: "Parent Monitoring Portal", icon: Users, desc: "Direct transparency, automated email, and SMS notifications." },
    { text: "Teacher Dashboard", icon: GraduationCap, desc: "Session controller, manual overrule, and export logs." },
    { text: "Admin Command Center", icon: Terminal, desc: "Platform metrics, settings configuration, and API manager." },
    { text: "Automated Reports & Alerts", icon: Bell, desc: "SMTP alert pipelines and scheduled Google Sheets syncing." },
    { text: "Enterprise Security Architecture", icon: Layers, desc: "Hierarchical role-based access control (RBAC) and data guards." },
  ];

  const technologies = [
    { name: "Python", category: "Core AI & Backend", color: "from-blue-600 to-cyan-500" },
    { name: "FastAPI", category: "High Performance API", color: "from-emerald-500 to-teal-400" },
    { name: "Flutter", category: "Cross-Platform Mobile", color: "from-blue-400 to-indigo-500" },
    { name: "MongoDB", category: "Flexible Document DB", color: "from-green-600 to-emerald-500" },
    { name: "ArcFace AI", category: "Deep Neural Network", color: "from-purple-600 to-pink-500" },
    { name: "ONNX Runtime", category: "GPU-Accelerated Inference", color: "from-yellow-600 to-amber-500" },
    { name: "WebSockets", category: "Real-Time Synchronization", color: "from-red-500 to-orange-500" },
    { name: "Groq AI", category: "LPU Intelligence", color: "from-orange-600 to-red-600" },
    { name: "Gemini AI", category: "Large Language Model", color: "from-blue-500 to-indigo-600" },
    { name: "Next.js", category: "Frontend SSR Hub", color: "from-slate-700 to-slate-900" },
    { name: "React", category: "UI Engine Componentry", color: "from-cyan-400 to-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-space text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background cyber grid & glow effects */}
      <div className="absolute inset-0 cyber-grid opacity-[0.15] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Global Navbar */}
      <Navbar />

      {/* Main Content Space */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 pt-32 pb-24 relative z-10 flex flex-col gap-20">
        
        {/* Header Hero Section */}
        <section className="text-center max-w-3xl mx-auto flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono font-bold text-primary tracking-wider uppercase mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>Meet The Developers</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl font-black font-sans tracking-tight text-white leading-tight"
          >
            Built by <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-purple-400">Sachin K</span> & <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Team Xcoderz</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base text-slate-400 font-sans leading-relaxed"
          >
            Transforming traditional school processes into a modern, intelligent, and secure biometric ecosystem. Designed for ultimate stability, enterprise safety, and sub-second facial matching.
          </motion.p>
        </section>

        {/* Profiles Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Creator Profile Card */}
          <DashboardCard glow={true} className="flex flex-col gap-8 h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
                    SK
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-sans">Sachin K</h3>
                    <p className="text-xs font-mono text-primary uppercase tracking-wider font-bold">Founder & Lead Developer</p>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                Platform Strategist
              </span>
            </div>

            <div className="flex flex-col gap-4 text-sm text-slate-300 leading-relaxed font-sans">
              <p>
                Sachin K is an AI Engineer and Full Stack Developer who founded the SmartFace AI ecosystem. With a passion for neural networks and biometric architectures, he directed the core system designs and mobile integrations to bring enterprise-grade attendance platforms to life.
              </p>
              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold mb-2">Key Areas of Focus:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Project Architecture</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>AI Integration & Models</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Face Recognition System</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Attendance Workflow Design</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Mobile App Development</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Platform Strategy</span>
                  </li>
                </ul>
              </div>
            </div>
          </DashboardCard>

          {/* Team Xcoderz Card */}
          <DashboardCard glow={true} className="flex flex-col gap-8 h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
                    XC
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-sans">Team Xcoderz</h3>
                    <p className="text-xs font-mono text-purple-400 uppercase tracking-wider font-bold">Core Development Team</p>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                Specialized Squad
              </span>
            </div>

            <div className="flex flex-col gap-4 text-sm text-slate-300 leading-relaxed font-sans">
              <p>
                Team Xcoderz is a dedicated collective of backend, database, security, and UI engineering specialists. They are responsible for implementing highly scalable data paths, secure database indexes, robust APIs, and interactive analytics reporting systems.
              </p>
              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold mb-2">Key Areas of Focus:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Backend Development</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Frontend Engineering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Security Systems</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Cloud Infrastructure</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Quality Assurance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>Performance Optimization</span>
                  </li>
                </ul>
              </div>
            </div>
          </DashboardCard>

        </section>

        {/* Mission Statement Block */}
        <section className="relative rounded-3xl p-8 md:p-12 bg-white/[0.03] border border-white/5 backdrop-blur-xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="flex flex-col gap-4 max-w-2xl relative z-10">
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-widest font-bold">
              <Code2 className="w-4 h-4" />
              <span>Our Mission</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-sans tracking-tight">
              Building the Future of Biometric Institutional Safety
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              &ldquo;To build the future of smart attendance, biometric verification, educational analytics, and institutional security through innovative AI-driven technologies.&rdquo;
            </p>
          </div>
          <div className="relative z-10 bg-gradient-to-br from-primary/10 to-purple-500/10 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[200px] text-center">
            <Heart className="w-8 h-8 text-rose-500 animate-pulse mb-3" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Created with</span>
            <span className="text-sm font-bold text-white font-sans mt-0.5">Passion & Quality</span>
          </div>
        </section>

        {/* Project Highlights Grid */}
        <section className="flex flex-col gap-10">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
            <h2 className="text-2xl font-bold font-sans text-white tracking-tight">Project Capabilities</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every detail engineered from scratch for high-performance and high-security compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((hl, idx) => {
              const Icon = hl.icon;
              return (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 flex gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-xs font-bold text-white font-sans">{hl.text}</h4>
                    <p className="text-[11px] text-slate-400 leading-normal">{hl.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Technology Stackbadges */}
        <section className="flex flex-col gap-10">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
            <h2 className="text-2xl font-bold font-sans text-white tracking-tight">Powered By</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modern programming ecosystems and computational models backing every sub-system.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {technologies.map((tech, idx) => (
              <div 
                key={idx}
                className="relative overflow-hidden p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1 hover:border-white/10 transition-colors"
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tech.color}`} />
                <span className="text-xs font-bold text-white font-sans mt-1">{tech.name}</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{tech.category}</span>
              </div>
            ))}
          </div>
        </section>

        {/* GitHub Call to Action */}
        <section className="w-full">
          <DashboardCard glow={true} className="p-8 md:p-12 text-center flex flex-col items-center gap-6 relative overflow-hidden">
            {/* Background spotlight shine */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative z-10">
              <Github className="w-8 h-8 text-white" />
            </div>

            <div className="flex flex-col gap-2 max-w-xl relative z-10">
              <h2 className="text-2xl font-bold font-sans text-white tracking-tight">Open Source & Community Driven</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                SmartFace AI is fully open sourced under the MIT license. Explore code patterns, clone repositories, and build the future of biometric attendance with us.
              </p>
            </div>

            <div className="relative z-10 w-full max-w-md p-4 rounded-2xl bg-slate-950/60 border border-white/5 font-mono text-left text-xs text-slate-300 flex items-center justify-between gap-4">
              <span className="truncate select-all pr-2">https://github.com/Sachinxcode-01/AI-Face-Attendance-System.git</span>
              <a 
                href="https://github.com/Sachinxcode-01/AI-Face-Attendance-System" 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-xl bg-primary hover:bg-blue-600 text-white font-sans font-bold transition shadow-lg shadow-primary/20"
              >
                <span>View Repo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </DashboardCard>
        </section>

      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
