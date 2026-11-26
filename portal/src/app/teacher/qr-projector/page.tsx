'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendanceLive } from '@/hooks/useAttendanceLive';
import { teacherApi } from '@/features/teacher/teacher.api';
import { useTeacherSessionsQuery } from '@/features/teacher/teacher.queries';
import { QrCode, RefreshCw, Radio, Link2, CheckCircle, Maximize2, Minimize2, RotateCw, Users } from 'lucide-react';

interface QrMatrixState {
  size: number;
  cells: boolean[];
  error?: boolean;
}

export default function TeacherQrProjectorPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const { data: sessions = [], isLoading: loading, refetch: refetchSessions } = useTeacherSessionsQuery(user?.email);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrEpoch, setQrEpoch] = useState<number>(1);
  const [rotationSeconds, setRotationSeconds] = useState<number>(15);
  const [countdown, setCountdown] = useState(15);
  const [refreshTick, setRefreshTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [projectorFullscreen, setProjectorFullscreen] = useState(false);
  const [qrMatrix, setQrMatrix] = useState<QrMatrixState | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const qsId = new URLSearchParams(window.location.search).get('session');
      if (qsId) {
        setSelectedId(qsId);
        return;
      }
    }
    const live = sessions.find((s) => s.is_active);
    if (live && !selectedId) setSelectedId(live.id);
  }, [sessions, selectedId]);

  const selected = sessions.find((s) => s.id === selectedId) || null;
  const isAccepting = Boolean(selected?.is_active && selected?.status !== 'paused');

  useAttendanceLive({
    channel: 'notifications',
    onEvent: (evt) => {
      if (evt.type === 'attendance_update' || evt.type === 'session_status') {
        refetchSessions();
      }
    },
  });

  // Fetch short-lived signed QR token for active session
  useEffect(() => {
    setQrToken(null);
    if (!selectedId || !isAccepting) return;

    let active = true;
    teacherApi.getQrToken(selectedId)
      .then((data) => {
        if (!active) return;
        const d = data as { token?: string; rotation_seconds?: number; qr_epoch?: number } | null;
        setQrToken(d?.token || null);
        if (d?.rotation_seconds) setRotationSeconds(d.rotation_seconds);
        if (d?.qr_epoch) setQrEpoch(d.qr_epoch);
      })
      .catch(() => {
        if (!active) return;
        setQrToken(null);
      });

    return () => {
      active = false;
    };
}, [selectedId, isAccepting, refreshTick]);

// Rotate QR token per configured interval
useEffect(() => {
    if (!selectedId || !isAccepting) {
      setCountdown(rotationSeconds);
      return;
    }
    setCountdown(rotationSeconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRefreshTick((t) => t + 1);
          return rotationSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedId, isAccepting, rotationSeconds]);

const handleRegenerate = useCallback(async () => {
  if (!selectedId || !isAccepting) return;
  setRegenerating(true);
  try {
    const res = await teacherApi.regenerateQr(selectedId, rotationSeconds);
    setQrToken(res?.token || null);
    if (res?.qr_epoch) setQrEpoch(res.qr_epoch);
    setCountdown(rotationSeconds);
    push('QR epoch rotated — prior codes invalidated', 'success');
  } catch (err) {
    push(err instanceof Error ? err.message : 'Failed to regenerate QR', 'error');
  } finally {
    setRegenerating(false);
  }
}, [selectedId, isAccepting, rotationSeconds, push]);

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
    return <div className="p-8 text-center text-xs text-red-400">Failed to generate QR code symbol</div>;
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
      className={`grid gap-[2px] bg-white p-4 rounded-[16px] shadow-2xl w-full mx-auto aspect-square ${projectorFullscreen ? 'max-w-[420px]' : 'max-w-[340px]'}`}
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
      subtitle="Cryptographically signed rotating session QR codes. Expired, paused, or closed tokens are rejected server-side."
      backTo="/teacher/sessions"
      backLabel="Back to Sessions"
      actions={
        <div className="flex items-center gap-2.5">
            <Badge tone={isAccepting ? 'success' : 'neutral'} pulse={isAccepting}>
              {isAccepting ? 'Live' : selected?.status === 'paused' ? 'Paused' : 'No Live Session'}
            </Badge>
            {selectedId && (
              <button
                onClick={() => setProjectorFullscreen((v) => !v)}
                className="btn-pill-glass h-8 px-3 text-xs font-semibold flex items-center gap-1.5"
              >
                {projectorFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                {projectorFullscreen ? 'Exit Projector' : 'Projector Mode'}
              </button>
            )}
        </div>
      }
    />

      <div className={`grid grid-cols-1 gap-6 ${projectorFullscreen ? '' : 'lg:grid-cols-3'}`}>
        {/* QR Display */}
          <Card className={`page-enter ${projectorFullscreen ? '' : 'lg:col-span-2'} flex flex-col items-center justify-center p-10`}>
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
            ) : !isAccepting ? (
              <div className="py-10 text-center">
                <QrCode className="mx-auto h-10 w-10 text-amber-400" />
                <p className="mt-4 font-display text-base font-semibold text-hi">
                  {selected?.status === 'paused' ? 'Session is Paused' : 'Session Ended'}
                </p>
                <p className="mt-1 text-xs text-mid">
                  QR projection is disabled while the session is {selected?.status || 'closed'}. Resume or start a session to project tokens.
                </p>
                <Link href="/teacher/sessions" className="btn-pill-glass mt-5 inline-flex h-9 items-center gap-2 px-5 text-xs font-semibold">
                  Manage Sessions
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
                  {selected?.room || 'Main Hall'} • Epoch #{qrEpoch} • {selected?.students_checked_in ?? 0} checked in
                </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <Badge tone="info">
                      <RefreshCw className="h-3 w-3" /> Rotates in {countdown}s
                    </Badge>
                    <Badge tone="success">
                      <Radio className="h-3 w-3" /> Server-verified
                    </Badge>
                    <Badge tone="purple">
                      <Users className="h-3 w-3" /> {selected?.students_checked_in ?? 0} / {selected?.total_enrolled_seen ?? 0}
                    </Badge>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="btn-pill-accent h-9 px-4 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <RotateCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                      Regenerate QR
                    </button>
                    {qrToken && (
                      <button
                        onClick={copyToken}
                        className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-1.5"
                      >
                        {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
                        {copied ? 'Copied!' : 'Copy Token'}
                      </button>
                    )}
                  </div>
                  <p className="mt-4 max-w-md text-center text-[11px] text-faint">
                    Note: Rotating QR tokens prevent replay of expired screenshots, though physical presence still requires classroom supervision or biometric verification.
                  </p>
                </>
          )}
              </Card>

        {!projectorFullscreen && (
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
          </Card>
        )}
      </div>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </DashboardLayout>
  );
}
