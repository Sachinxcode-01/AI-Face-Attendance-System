'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Smartphone, CheckCircle, FileCheck, Layers } from 'lucide-react';
import { APP_RELEASE } from '@/config/app-release';
import { ApkDownloadModal } from '@/components/download/ApkDownloadModal';
import { ApkDownloadButton } from '@/components/download/ApkDownloadButton';

export const ApkDownloadHero: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const triggerDirectDownload = () => {
    const link = document.createElement('a');
    link.href = APP_RELEASE.apiDownloadUrl;
    link.download = APP_RELEASE.apkFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="download-app" className="relative">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-slate-900/70 p-6 md:p-12 backdrop-blur-2xl shadow-2xl shadow-indigo-950/40">
        {/* Glow Gradients */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column Text & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
              <Smartphone className="h-3.5 w-3.5" /> SMART ATTENDANCE AI FOR ANDROID
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Download <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400">Smart Attendance AI</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Access attendance, schedules, reports, notifications, QR scanning, and secure face verification directly from your Android device.
            </p>

            {/* Release Badges Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 font-medium">
                <Layers className="h-3.5 w-3.5 text-indigo-400" /> Version {APP_RELEASE.versionName}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 font-medium">
                <FileCheck className="h-3.5 w-3.5 text-cyan-400" /> {APP_RELEASE.fileSize}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> SHA-256 Verified
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <ApkDownloadButton
                onOpenModal={() => setIsModalOpen(true)}
                variant="primary"
                className="w-full sm:w-auto"
              />

              <a
                href="#installation-guide"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                View Installation Guide
              </a>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              Compatible with Android 7.0 (Nougat) and higher. No global Play Protect changes required.
            </p>
          </div>

          {/* Right Column Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-full max-w-sm"
            >
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-cyan-400 blur-2xl opacity-20 rounded-full" />

              {/* Phone Container */}
              <div className="relative rounded-3xl border-4 border-slate-800 bg-slate-950 p-4 shadow-2xl shadow-indigo-950/60 overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950">
                <div className="w-24 h-4 bg-slate-900 mx-auto rounded-b-xl border-x border-b border-slate-800 mb-4" />

                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5 text-center space-y-4">
                  {/* App Emblem */}
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 p-0.5 shadow-lg shadow-indigo-500/30">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                      <Smartphone className="h-8 w-8" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">Smart Attendance AI</h3>
                    <p className="text-xs text-slate-400">pro.smartface.attendance</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5 text-left">
                    <div className="flex justify-between text-slate-400">
                      <span>Package:</span>
                      <span className="text-slate-200 font-mono">v1.1.0</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Biometrics:</span>
                      <span className="text-cyan-300">InsightFace Core</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Security:</span>
                      <span className="text-emerald-400">AES-256 + Hash</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3" /> Android APK Compiled & Signed
                    </span>
                  </div>
                </div>

                <div className="w-28 h-1 bg-slate-700 mx-auto rounded-full mt-4" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Download Modal Confirmation */}
      <ApkDownloadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirmDownload={triggerDirectDownload}
      />
    </section>
  );
};
