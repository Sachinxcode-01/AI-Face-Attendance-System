'use client';

import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Terminal } from 'lucide-react';
import { APP_RELEASE } from '@/config/app-release';

export const ApkChecksumCard: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const psCommand = `Get-FileHash .\\${APP_RELEASE.apkFileName} -Algorithm SHA256`;

  const copyToClipboard = (text: string, type: 'hash' | 'cmd') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Cryptographic Checksum Verification</h3>
          <p className="text-xs text-slate-400">SHA-256 Hash Integrity Check</p>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-4 leading-relaxed">
        SHA-256 helps confirm that your downloaded APK package is authentic, complete, and has not been altered or tampered with by third parties.
      </p>

      {/* SHA256 Hash Display */}
      <div className="mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          SHA-256 Hash Signature
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/80 p-3">
          <code className="flex-1 font-mono text-xs text-cyan-300 break-all select-all">
            {APP_RELEASE.sha256}
          </code>
          <button
            onClick={() => copyToClipboard(APP_RELEASE.sha256, 'hash')}
            className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Copy SHA-256 hash"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Hash</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PowerShell Terminal Verification Command */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Terminal className="h-4 w-4 text-cyan-400" /> Windows Verification Command (PowerShell)
          </span>
          <button
            onClick={() => copyToClipboard(psCommand, 'cmd')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            {copiedCmd ? 'Copied Command!' : 'Copy Command'}
          </button>
        </div>
        <code className="block font-mono text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-lg overflow-x-auto border border-slate-800">
          {psCommand}
        </code>
      </div>
    </div>
  );
};
