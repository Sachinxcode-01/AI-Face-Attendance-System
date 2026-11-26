'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { teacherApi } from '@/features/teacher/teacher.api';
import {
  useTeacherSessionsQuery,
  useSessionRosterQuery,
  useKioskDiagnosticsQuery,
  useBatchMarkMutation,
} from '@/features/teacher/teacher.queries';
import { ScanFace, MonitorPlay, RefreshCw, CameraOff, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';

type CameraState = 'initializing' | 'ready' | 'denied' | 'unavailable';

export default function TeacherKioskPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>('');
  const [cameraState, setCameraState] = useState<CameraState>('initializing');
  const [verifying, setVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; title: string; detail: string; manualFallback?: boolean } | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const { data: sessions = [], isLoading: loading, refetch } = useTeacherSessionsQuery(user?.email);
    const { data: rosterData, refetch: refetchRoster } = useSessionRosterQuery(user?.email, selectedId);
    const { data: diagnostics, refetch: refetchDiag } = useKioskDiagnosticsQuery(user?.email);
    const batchMarkMut = useBatchMarkMutation(user?.email);

    useEffect(() => {
      const live = sessions.find((s) => s.is_active);
      if (live && !selectedId) setSelectedId(live.id);
    }, [sessions, selectedId]);

    const selected = sessions.find((s) => s.id === selectedId) || null;
    const rosterStudents: any[] = rosterData?.students ?? [];
    const unmarkedStudents = rosterStudents.filter((s) => !s.recorded);

    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }, []);

    const startCamera = useCallback(async () => {
      stopCamera();
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraState('unavailable');
        return;
      }
      setCameraState('initializing');
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCameraState('ready');
      } catch (err: any) {
        setCameraState(err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' ? 'denied' : 'unavailable');
      }
  }, [stopCamera]);

  useEffect(() => {
  if (selected?.is_active && selected?.status !== 'paused') {
    startCamera();
  } else {
    stopCamera();
  }
  return () => stopCamera();
}, [selected?.is_active, selected?.status, startCamera, stopCamera]);

const captureFrameBlob = (): Promise<Blob | null> => {
  return new Promise((resolve) => {
    if (!videoRef.current || cameraState !== 'ready') return resolve(null);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(null);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
};

const handleKioskVerify = async () => {
  if (!selectedId || !selectedStudentEmail) {
    push('Select a student before verifying face', 'error');
    return;
  }
  const blob = await captureFrameBlob();
  if (!blob) {
    setLastResult({
      ok: false,
      title: 'Camera Unavailable',
      detail: 'Camera feed is not active. Allow camera permissions or record manual attendance below.',
      manualFallback: true,
    });
    return;
  }
  setVerifying(true);
  setLastResult(null);
  try {
    const fd = new FormData();
    fd.append('image', blob, 'kiosk_scan.jpg');
    fd.append('session_id', selectedId);
    fd.append('student_email', selectedStudentEmail);
    const res = await teacherApi.markFaceKiosk(fd);
    setLastResult({
      ok: true,
      title: `Verified: ${res.student_name || selectedStudentEmail}`,
      detail: `Confidence ${(Number(res.confidence || 0) * 100).toFixed(1)}% · Receipt ${res.receipt_id}`,
    });
    push('Kiosk verification succeeded', 'success');
    setSelectedStudentEmail('');
    await Promise.all([refetchRoster(), refetchDiag(), refetch()]);
  } catch (err: any) {
    const msg = err?.message || 'Face verification failed. Try better lighting or mark manually.';
    setLastResult({
      ok: false,
      title: 'Verification Unsuccessful',
      detail: msg,
      manualFallback: true,
    });
    push(msg, 'error');
  } finally {
    setVerifying(false);
  }
};

const handleManualFallback = async () => {
  if (!selectedId || !selectedStudentEmail) return;
  try {
    await batchMarkMut.mutateAsync({
      session_id: selectedId,
      reason: 'Manual attendance fallback after kiosk verification attempt',
      records: [{ student_email: selectedStudentEmail, status: 'Present', reason: 'Kiosk manual fallback' }],
    });
    push('Manual attendance recorded', 'success');
    setLastResult({
      ok: true,
      title: 'Manual Attendance Recorded',
      detail: `${selectedStudentEmail} marked Present via authorized faculty fallback.`,
    });
    setSelectedStudentEmail('');
    await refetchRoster();
  } catch (err) {
    push(err instanceof Error ? err.message : 'Manual fallback failed', 'error');
  }
};

return (
  <DashboardLayout>
    <PageHeader
      kicker="Biometric Kiosk"
      title="Kiosk Mode"
      subtitle="Classroom podium face verification station. Raw embeddings are never exposed to the browser; failed scans allow manual verification."
      backTo="/teacher/sessions"
      backLabel="Back to Sessions"
      actions={
          <div className="flex items-center gap-2.5">
            <Badge tone={diagnostics?.ai_service_status === 'ready' ? 'success' : 'warning'}>
              AI Engine: {diagnostics?.ai_service_status ?? 'checking'}
            </Badge>
            <button onClick={() => { refetch(); refetchDiag(); }} className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
      }
    />

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Kiosk display */}
        <Card className="page-enter lg:col-span-2 flex min-h-[440px] flex-col items-center justify-center bg-gradient-to-b from-[#0B0B12] to-[#050507] p-8 text-center">
          {selected ? (
            <>
                  <div className="w-full max-w-md space-y-4">
                    <div className="flex items-center justify-between text-left">
                      <div>
                        <h2 className="font-display text-xl font-bold text-hi">{selected.subject}</h2>
                        <p className="font-mono text-xs text-mid">{selected.room || 'Main Hall'} · {selected.students_checked_in}/{selected.total_enrolled_seen} present</p>
                      </div>
                      <Badge tone={selected.is_active && selected.status !== 'paused' ? 'success' : 'neutral'} pulse={selected.is_active && selected.status !== 'paused'}>
                        {selected.status || (selected.is_active ? 'Live' : 'Ended')}
                      </Badge>
                    </div>

                          {selected.is_active && selected.status !== 'paused' ? (
                            <>
                              <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-black/60 aspect-video flex items-center justify-center">
                                <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${cameraState === 'ready' ? 'block' : 'hidden'}`} />
                                {cameraState !== 'ready' && (
                                  <div className="p-6 text-center">
                                    <CameraOff className="mx-auto h-8 w-8 text-faint" />
                                    <p className="mt-2 text-xs text-mid">
                                      {cameraState === 'denied'
                                        ? 'Camera permission denied. Allow access or use manual attendance below.'
                                        : cameraState === 'unavailable'
                                          ? 'No camera detected on this terminal. Use manual attendance fallback.'
                                          : 'Initializing podium camera…'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <select
                                value={selectedStudentEmail}
                                onChange={(e) => setSelectedStudentEmail(e.target.value)}
                                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-xs text-hi focus:border-accent focus:outline-none"
                              >
                                <option value="">Select enrolled student to verify ({unmarkedStudents.length} unmarked)…</option>
                                {unmarkedStudents.map((st) => (
                                  <option key={st.email} value={st.email}>
                                    {st.full_name} ({st.student_id || st.email}) — {st.biometric_enrolled ? 'Face Enrolled' : 'Not Enrolled'}
                                  </option>
                                ))}
                              </select>

                              <div className="flex flex-wrap items-center justify-center gap-2.5">
                                <button
                                  onClick={handleKioskVerify}
                                  disabled={verifying || !selectedStudentEmail || cameraState !== 'ready'}
                                  className="btn-pill-accent h-10 px-6 text-xs font-semibold flex items-center gap-2 disabled:opacity-40"
                                >
                                  <ScanFace className="h-4 w-4" />
                                  {verifying ? 'Verifying…' : 'Verify Face'}
                                </button>
                                <button
                                  onClick={handleManualFallback}
                                  disabled={batchMarkMut.isPending || !selectedStudentEmail}
                                  className="btn-pill-glass h-10 px-5 text-xs font-semibold flex items-center gap-2 disabled:opacity-40"
                                >
                                  <UserCheck className="h-4 w-4 text-emerald-400" />
                                  Manual Present
                                </button>
                              </div>
                            </>
                          ) : (
                  <div className="py-10">
                    <Badge tone="neutral">Session {selected.status || 'Ended'}</Badge>
                    <p className="mt-3 text-xs text-faint">Activate or resume the session to enable biometric check-in.</p>
                  </div>
                )}

                        {lastResult && (
                          <div className={`rounded-xl border p-3.5 text-left text-xs ${lastResult.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}>
                            <div className="flex items-center gap-2 font-semibold">
                              {lastResult.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
                              <span>{lastResult.title}</span>
                            </div>
                            <p className="mt-1 opacity-85">{lastResult.detail}</p>
                          </div>
                        )}
                      </div>
                  </>
                  ) : (
                  <div>
                    <MonitorPlay className="mx-auto h-10 w-10 text-faint" />
                    <p className="mt-4 font-display text-base font-semibold text-hi">No active session</p>
                    <p className="mt-1 text-xs text-mid">Start a session to activate the kiosk.</p>
                    <Link href="/teacher/sessions/create" className="btn-pill-accent mt-5 inline-flex h-9 items-center gap-2 px-5 text-xs font-semibold">
                      Start a Session
                    </Link>
                  </div>
          )}
                </Card>

              {/* Diagnostics & Session list */}
              <div className="space-y-6">
                <Card className="page-enter p-6">
                  <CardHeader icon={<ScanFace className="h-5 w-5 text-emerald-400" />} title="Biometric Readiness" />
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-mid">Enrolled Students</span>
                      <span className="font-mono font-semibold text-hi">
                        {diagnostics?.biometric_enrolled_count ?? 0} / {diagnostics?.total_students ?? 0} ({diagnostics?.biometric_readiness_pct ?? 0}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/[0.06]">
                      <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${diagnostics?.biometric_readiness_pct ?? 0}%` }} />
                    </div>
                    <p className="text-[11px] text-faint">
                      AI Service: {diagnostics?.ai_service_status === 'ready' ? 'Online (ArcFace 512-D)' : 'Unavailable — use QR or Manual fallback'}
                    </p>
                  </div>
                </Card>

                <Card className="page-enter p-6">
                  <CardHeader icon={<MonitorPlay className="h-5 w-5 text-accent" />} title="Sessions" />
                  <div className="space-y-2">
                    {sessions.slice(0, 5).map((s) => (
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
                          {s.students_checked_in} checked in • {s.attendance_rate}%
                        </p>
                      </button>
                    ))}
                    {sessions.length === 0 && !loading && (
                      <p className="py-6 text-center text-xs text-faint font-mono">No sessions found.</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>

          <Toasts toasts={toasts} dismiss={dismiss} />
        </DashboardLayout>
        );
}
