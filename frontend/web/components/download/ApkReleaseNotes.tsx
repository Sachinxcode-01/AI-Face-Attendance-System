'use client';

import React from 'react';
import { Sparkles, CheckCircle2, Tag } from 'lucide-react';
import { APP_RELEASE } from '@/config/app-release';

export const ApkReleaseNotes: React.FC = () => {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">What&apos;s New in Version {APP_RELEASE.versionName}</h3>
            <p className="text-xs text-slate-400">Official Release Changelog ({APP_RELEASE.releaseDate})</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Tag className="h-3.5 w-3.5" /> Stable Build {APP_RELEASE.versionCode}
        </span>
      </div>

      <ul className="space-y-3">
        {APP_RELEASE.releaseNotes.map((note, index) => (
          <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <span className="text-sm text-slate-300 leading-relaxed">{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
