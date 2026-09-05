'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { APP_RELEASE } from '@/config/app-release';

interface ApkDownloadButtonProps {
  onOpenModal?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const ApkDownloadButton: React.FC<ApkDownloadButtonProps> = ({
  onOpenModal,
  className = '',
  variant = 'primary',
}) => {
  const [downloadState, setDownloadState] = useState<'ready' | 'loading' | 'success' | 'error'>('ready');

  const handleDownloadClick = async () => {
    if (downloadState === 'loading') return;

    if (onOpenModal) {
      onOpenModal();
      return;
    }

    triggerDownload();
  };

  const triggerDownload = async () => {
    setDownloadState('loading');

    try {
      // Safe anonymous download metric tracking (non-blocking)
      try {
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'apk_download_started', {
            event_category: 'download',
            event_label: APP_RELEASE.apkFileName,
          });
        }
      } catch {
        // Analytics failure must never block download
      }

      await new Promise((resolve) => setTimeout(resolve, 600));

      const link = document.createElement('a');
      link.href = APP_RELEASE.apiDownloadUrl;
      link.download = APP_RELEASE.apkFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadState('success');
      setTimeout(() => setDownloadState('ready'), 3500);
    } catch {
      setDownloadState('error');
    }
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white hover:from-indigo-500 hover:to-cyan-400 shadow-xl shadow-indigo-600/30 border border-indigo-400/30',
    secondary:
      'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border border-slate-700 shadow-lg',
    outline:
      'bg-transparent text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/10 hover:border-cyan-400',
  };

  return (
    <button
      onClick={handleDownloadClick}
      disabled={downloadState === 'loading' || !APP_RELEASE.isAvailable}
      aria-label="Download Smart Attendance AI Android APK"
      className={`relative inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
    >
      {downloadState === 'ready' && (
        <>
          <Download className="h-4 w-4 shrink-0" />
          <span>Download APK</span>
        </>
      )}

      {downloadState === 'loading' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin shrink-0 text-cyan-200" />
          <span>Preparing Download…</span>
        </>
      )}

      {downloadState === 'success' && (
        <>
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="text-emerald-200">Download Started</span>
        </>
      )}

      {downloadState === 'error' && (
        <>
          <RefreshCw className="h-4 w-4 shrink-0 text-rose-300" />
          <span className="text-rose-200">Retry Download</span>
        </>
      )}
    </button>
  );
};
