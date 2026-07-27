'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Download, X, Smartphone, CheckCircle } from 'lucide-react';
import { APP_RELEASE } from '@/config/app-release';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDownload: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  onConfirmDownload,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            ref={modalRef}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl"
          >
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-400">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 id="modal-title" className="text-xl font-bold text-white tracking-tight">
                  Confirm APK Download
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {APP_RELEASE.packageName}
                </p>
              </div>
            </div>

            {/* Release Meta Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Version</span>
                <span className="font-semibold text-slate-200">v{APP_RELEASE.versionName} (Build {APP_RELEASE.versionCode})</span>
              </div>
              <div>
                <span className="text-slate-500 block">File Size</span>
                <span className="font-semibold text-slate-200">{APP_RELEASE.fileSize}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Minimum Requirement</span>
                <span className="font-semibold text-slate-200">{APP_RELEASE.minimumAndroidVersion}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Signature Checksum</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Release
                </span>
              </div>
            </div>

            {/* Official Source Banner */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 mb-6">
              <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Download only from this official project website. Verify the SHA-256 checksum after downloading when required.
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirmDownload();
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <Download className="h-4 w-4" />
                Download APK
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
