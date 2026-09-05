'use client';

import React from 'react';
import { 
  Download, 
  Clock, 
  FolderOpen, 
  ShieldAlert, 
  CheckCircle2, 
  Play, 
  Smartphone, 
  UserCheck, 
  ShieldCheck 
} from 'lucide-react';

interface Step {
  num: number;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  {
    num: 1,
    title: 'Tap Download APK',
    desc: 'Click the primary Download APK button above to initiate the secure download of the Smart Attendance AI package.',
    icon: Download,
  },
  {
    num: 2,
    title: 'Wait for Download',
    desc: 'Monitor the browser progress bar until the 113.68 MB release file finishes downloading completely.',
    icon: Clock,
  },
  {
    num: 3,
    title: 'Open Downloaded File',
    desc: 'Tap the download notification or locate Smart-Attendance-AI-v1.1.0.apk in your Android Downloads folder.',
    icon: FolderOpen,
  },
  {
    num: 4,
    title: 'System Security Prompt',
    desc: 'Android will display a security dialog requesting permission to install apps from this browser or file manager.',
    icon: ShieldAlert,
  },
  {
    num: 5,
    title: 'Enable Unknown Sources',
    desc: 'Toggle "Allow from this source" for your browser or file manager when prompted. (Restricted to this trusted app only).',
    icon: CheckCircle2,
  },
  {
    num: 6,
    title: 'Confirm Installation',
    desc: 'Tap "Install" on the Android package installer popup to unpack and register the application.',
    icon: Play,
  },
  {
    num: 7,
    title: 'Launch Smart Attendance AI',
    desc: 'Locate the Smart Attendance AI icon on your Android home screen or app drawer and tap to open.',
    icon: Smartphone,
  },
  {
    num: 8,
    title: 'Authenticate & Access',
    desc: 'Log in using your authorized Student, Teacher, Parent, or Admin credentials to access live attendance workflows.',
    icon: UserCheck,
  },
];

export const ApkInstallationGuide: React.FC = () => {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
          <Smartphone className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Android Installation Walkthrough
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Step-by-step setup guide for installing Smart Attendance AI on Android devices
          </p>
        </div>
      </div>

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all hover:border-indigo-500/40 hover:bg-slate-950/90"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                    {step.num}
                  </span>
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Note Box */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-slate-300">
        <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
        <div className="space-y-1">
          <span className="font-semibold text-emerald-300 block">Security Best Practices</span>
          <p>
            Download exclusively from this official project website (<code className="text-cyan-300">smartface.pro</code>). You do not need to disable Google Play Protect globally. Revoke browser install permissions after setup for maximum device hygiene.
          </p>
        </div>
      </div>
    </div>
  );
};
