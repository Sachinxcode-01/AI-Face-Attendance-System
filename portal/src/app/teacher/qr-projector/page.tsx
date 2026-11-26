'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { TeacherSession } from '@/lib/types';
import { ChevronLeft, QrCode, RefreshCw, Radio, Link2, CheckCircle } from 'lucide-react';

interface QrMatrixState {
  size: number;
  cells: boolean[];
  error?: boolean;
}

export default function TeacherQrProjectorPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrMatrix, setQrMatrix] = useState<QrMatrixState | null>(null);

  const selected = sessions.find((s) => s.id === selectedId) || null;

  const loadSessions = useCallback(async () => {
    try {
      const data = await api.teacher.sessions();
      setSessions((data as TeacherSession[]) || []);
      const live = ((data as TeacherSession[]) || []).find((s) => s.is_active);
      if (live && !selectedId) setSelectedId(live.id);
    } catch {
      push('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  }, [push, selectedId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Fetch a short-lived signed QR token for the selected session
  useEffect(() => {
    setQrToken(null);
    if (!selectedId) return;

    let active = true;
    api.teacher.qrToken(selectedId)
      .then((data) => {
        if (!active) return;
        const d = data as { token?: string; qr_code?: string } | null;
        setQrToken(d?.token || d?.qr_code || null);
      })
      .catch(() => {
        if (!active) return;
        setQrToken(null);
      });

    return () => {
      active = false;
    };
  }, [selectedId, refreshTick]);

  // Rotate the QR token every 15 seconds
  useEffect(() => {
    if (!selectedId) {
      setCountdown(15);
      return;
    }
    setCountdown(15);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRefreshTick((t) => t + 1);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const copyToken = async () => {
    if (!qrToken) return;
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopied(true);
      push('QR token copied', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      push('Copy failed', 'error');
    }
  };

  // Render the token as a real standard QR code via lazy-loaded qrcode library
  useEffect(() => {
    if (!qrToken || !selectedId) {
      setQrMatrix(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const payload = JSON.stringify({
          type: 'attendance_qr',
          session_id: selectedId,
          token: qrToken,
        });
        const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' });
        const size = qr.modules.size;
        const cells: boolean[] = [];
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            cells.push(Boolean(qr.modules.get(r, c)));
          }
        }
        if (!cancelled) setQrMatrix({ size, cells });
      } catch {
        if (!cancelled) setQrMatrix({ size: 0, cells: [], error: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qrToken, selectedId]);

  const renderQrGrid = () => {
    if (qrMatrix?.error) {
      return (
        <div className="p-8 text-center text-xs text-red-400">
          Failed to generate QR code symbol
        </div>
      );
    }
    if (!qrMatrix || qrMatrix.size <= 0) {
      return (
        <div className="flex h-[280px] w-[280px] items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.03]">
          <RefreshCw className="h-6 w-6 animate-spin text-faint" />
        </div>
      );
    }
    return (
      <div
        className="grid gap-[2px] bg-white p-4 rounded-[16px] shadow-2xl w-full max-w-[340px] mx-auto aspect-square"
        style={{ gridTemplateColumns: `repeat(${qrMatrix.size}, minmax(0, 1fr))` }}
        aria-label="QR projection visual"
      >
        {qrMatrix.cells.map((on, i) => (
          <div key={i} className={`aspect-square ${on ? 'bg-[#050507]' : 'bg-white'}`} />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Attendance Projection"
        title="QR Projector"
        subtitle="Display the rotating session QR code for classroom check-ins. Tokens refresh every 15 seconds and reject replays."
        backTo="/teacher/sessions"
        backLabel="Back to Sessions"
        actions={
          <div className="flex items-center gap-2.5">
            <Badge tone={selected?.is_active ? 'success' : 'neutral'} pulse={selected?.is_active}>
              {selected?.is_active ? 'Live' : 'No Live Session'}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* QR Display */}
        <Card className="page-enter lg:col-span-2 flex flex-col items-center justify-center p-10">
          {!selectedId ? (
            <div className="py-10 text-center">
              <QrCode className="mx-auto h-10 w-10 text-faint" />
              <p className="mt-4 font-display text-base font-semibold text-hi">No session selected</p>
              <p className="mt-1 text-xs text-mid">
                {loading ? 'Loading sessions…' : 'Start a live session to project its QR code.'}
              </p>
              <Link href="/teacher/sessions/create" className="btn-pill-accent mt-5 inline-flex h-9 items-center gap-2 px-5 text-xs font-semibold">
                Start a Session
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                {qrToken ? (
                  renderQrGrid()
                ) : (
                  <div className="flex h-[280px] w-[280px] items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.03]">
                    <RefreshCw className="h-6 w-6 animate-spin text-faint" />
                  </div>
                )}
              </div>
              <p className="font-display text-lg font-bold text-hi">{selected?.subject}</p>
              <p className="mt-1 font-mono text-xs text-mid">
                {selected?.room || 'Main Hall'} • {new Date(selected?.start_time || Date.now()).toLocaleString()}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Badge tone="info">
                  <RefreshCw className="h-3 w-3" /> Rotates in {countdown}s
                </Badge>
                <Badge tone="success">
                  <Radio className="h-3 w-3" /> Live verification
                </Badge>
              </div>
            </>
          )}
        </Card>

        {/* Session picker */}
        <Card className="page-enter p-6">
          <CardHeader icon={<QrCode className="h-5 w-5 text-accent" />} title="Session Selector" />
          <div className="space-y-2">
            {sessions.slice(0, 6).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full rounded-[16px] border p-3.5 text-left transition-all ${selectedId === s.id
                    ? 'border-accent/40 bg-accent/10'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-hi">{s.subject}</span>
                  {s.is_active && <Badge tone="success" pulse>Live</Badge>}
                </div>
                <p className="mt-1 font-mono text-[10.5px] text-faint">
                  {s.room || 'Main Hall'} • {s.students_checked_in} checked in
                </p>
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="py-6 text-center text-xs text-faint font-mono">No sessions found.</p>
            )}
          </div>

          {qrToken && (
            <button
              onClick={copyToken}
              className="btn-pill-glass mt-5 flex h-9 w-full items-center justify-center gap-2 text-xs font-semibold"
            >
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy Token'}
            </button>
          )}
        </Card>
      </div>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </DashboardLayout>
  );
}