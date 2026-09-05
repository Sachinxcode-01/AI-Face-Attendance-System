'use client';

import React, { useState } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { 
  BookOpen, 
  Terminal, 
  Cpu, 
  Fingerprint, 
  ShieldAlert, 
  FileSpreadsheet, 
  ArrowLeft, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('get-started');

  const sections = [
    { id: 'get-started', name: 'Getting Started', icon: BookOpen },
    { id: 'ai-engine', name: 'Core AI Engine (ArcFace)', icon: Cpu },
    { id: 'biometrics', name: 'Biometric Enrollment', icon: Fingerprint },
    { id: 'sentinel', name: 'Intruder Sentinel', icon: ShieldAlert },
    { id: 'sheets-sync', name: 'Google Sheets Integration', icon: FileSpreadsheet },
    { id: 'api-reference', name: 'REST API Reference', icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-space text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Glow Backdrops */}
      <div className="absolute inset-0 cyber-grid opacity-[0.12] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Global Navbar */}
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 pt-32 pb-24 relative z-10 flex flex-col gap-8">
        
        {/* Top Navigation Row: Back Button & Breadcrumbs */}
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
            <span className="text-slate-300 font-bold">Documentation</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono font-bold text-primary uppercase">
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            <span>Developer Handbook</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase font-sans">
            Technical Documentation
          </h1>
          <p className="text-xs text-slate-400 font-sans max-w-2xl">
            Reference guide for the SmartFace AI biometric attendance network. Learn model characteristics, API endpoints, leave pipelines, and security configurations.
          </p>
        </div>

        {/* Split Docs Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
          
          {/* Left Sidebar Sections Navigation */}
          <aside className="lg:col-span-3 space-y-1.5 sticky top-24">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block px-2.5 mb-2">
              Sections
            </span>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSection(sec.id);
                    document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer outline-none ${
                    isActive 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(37,99,235,0.08)]' 
                      : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{sec.name}</span>
                  </div>
                  <ChevronRight className={`w-3 h-3 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                </button>
              );
            })}
          </aside>

          {/* Right Docs Text Container */}
          <article className="lg:col-span-9 space-y-16 bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md max-h-[70vh] overflow-y-auto pr-3 scroll-smooth">
            
            {/* Section 1: Getting Started */}
            <section id="get-started" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2 font-sans uppercase">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>1. Getting Started</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                SmartFace AI provides automated biometric check-ins for educational environments. The system operates on active face tracking to resolve classrooms, leaves, and threats without physical card taps or barcodes.
              </p>
              <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono text-primary font-bold block uppercase tracking-wider">Quickstart Workflow</span>
                <ol className="list-decimal pl-4 text-xs text-slate-400 space-y-1.5 leading-relaxed font-sans">
                  <li>Enroll student accounts with profile data and active mobile contacts.</li>
                  <li>Perform the 3-angle biometric scanner calibration (Front, Left, Right).</li>
                  <li>Camera terminals capture video inputs and match feature grids with stored vector embeddings.</li>
                  <li>Check-in timestamps populate database models and trigger automated parent SMTP emails.</li>
                </ol>
              </div>
            </section>

            {/* Section 2: Core AI Engine (ArcFace) */}
            <section id="ai-engine" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2 font-sans uppercase">
                <Cpu className="w-5 h-5 text-primary" />
                <span>2. Core AI Engine (ArcFace)</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Our recognition backend relies on the ArcFace deep learning convolution model optimized into ONNX weights. Video grids are localized with MTCNN face finders, normalized to 112x112 pixel grids, and projected into a 512-dimensional angular hyperspace.
              </p>
              
              <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <span className="text-xs font-bold text-blue-400 block font-sans">💡 Recognition Parameters</span>
                <ul className="text-xs text-slate-400 mt-2 space-y-1 font-mono">
                  <li>• ArcFace angular margin: m = 0.5</li>
                  <li>• Feature scale output: s = 64</li>
                  <li>• Similarity metric: Cosine distance &gt; 0.65 threshold</li>
                  <li>• Hardware support: CPU / CUDA / CoreML (ONNX Runtime)</li>
                </ul>
              </div>
            </section>

            {/* Section 3: Biometric Enrollment */}
            <section id="biometrics" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2 font-sans uppercase">
                <Fingerprint className="w-5 h-5 text-primary" />
                <span>3. Biometric Enrollment</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Calibration requires 3 captured angles to map volumetric contours. The OpenCV engine triggers multiple security filters before saving dataset assets:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
                  <span className="text-xs font-bold text-white block">Lighting & Liveness</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Luminance histogram checks filter out shadowed inputs. Real-time eye dilation checks ensure a live user.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
                  <span className="text-xs font-bold text-white block">Blur & Centering</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Laplacian variance filters evaluate motion blur. Feature landmarks check if face is aligned inside the guide frame.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Intruder Sentinel */}
            <section id="sentinel" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2 font-sans uppercase">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>4. Intruder Sentinel</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Cameras scan lobby vectors continuously. If an unknown face with a similarity index under 0.45 is captured more than twice, an intruder pipeline is fired:
              </p>
              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-rose-400 block font-sans">Intruder Incident Trigger</span>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Instantly snaps a JPG bounding box, saves to MongoDB collection `security_logs`, and dispatches SMTP critical warnings to campus administrators.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Google Sheets Sync */}
            <section id="sheets-sync" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2 font-sans uppercase">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <span>5. Google Sheets Integration</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Daily reports auto-sync via standard Google API OAuth credentials. The sync schedules run on background cron jobs to update sheet spreadsheets:
              </p>
              <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl">
                <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto">
{`# Sample Crontab execution task
0 18 * * 1-5 python -m src.cron.sync_google_sheets --run-now`}
                </pre>
              </div>
            </section>

            {/* Section 6: REST API Reference */}
            <section id="api-reference" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2 font-sans uppercase">
                <Terminal className="w-5 h-5 text-primary" />
                <span>6. REST API Reference</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Integrate with SmartFace AI endpoints directly. All requests must carry the standard header <code className="text-[11px] bg-slate-900 px-1 py-0.5 rounded text-primary">Authorization: Bearer &lt;JWT_Token&gt;</code>.
              </p>

              <div className="space-y-3">
                {/* Endpoint 1 */}
                <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/30">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold">POST</span>
                    <code className="text-xs font-mono font-bold text-white">/auth/face-register</code>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-sans">Upload 3 base64 camera vectors to calibrate biometrics.</p>
                </div>
                
                {/* Endpoint 2 */}
                <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/30">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono font-bold">GET</span>
                    <code className="text-xs font-mono font-bold text-white">/auth/me</code>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-sans">Return profile claims matching current JWT authentication context.</p>
                </div>
              </div>
            </section>

          </article>

        </div>

      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
