'use client';

import React from 'react';
import { Cpu, Smartphone, Shield, HardDrive, Camera } from 'lucide-react';
import { APP_RELEASE } from '@/config/app-release';

export const ApkRequirementsCard: React.FC = () => {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">System Requirements</h3>
          <p className="text-xs text-slate-400">Extracted directly from AAPT Android Badging Metadata</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Minimum Android OS
          </span>
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-cyan-400" /> {APP_RELEASE.minimumAndroidVersion}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Recommended OS
          </span>
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-400" /> {APP_RELEASE.recommendedAndroidVersion}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Supported Architectures
          </span>
          <span className="text-sm font-mono text-cyan-300">
            {APP_RELEASE.targetArchitecture}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Required Storage
          </span>
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-emerald-400" /> ~150 MB (113.68 MB APK)
          </span>
        </div>
      </div>

      {/* Permissions List */}
      <div className="mt-6 pt-6 border-t border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
          Hardware & System Permissions Required
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {APP_RELEASE.permissionsRequired.map((perm, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 p-2 rounded-xl bg-slate-950/40 border border-slate-800">
              <Camera className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>{perm}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
