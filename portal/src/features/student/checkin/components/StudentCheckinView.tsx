'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScanFace, QrCode, CheckCircle2, Video, AlertTriangle, RefreshCw, CameraOff, ShieldCheck } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  useActiveSessionQuery,
  useBiometricStatusQuery,
  useEnrollBiometricMutation,
  useMarkQrAttendanceMutation,
  useMarkFaceAttendanceMutation,
} from '../checkin.queries';

type CameraStatus = 'initializing' | 'ready' | 'denied' | 'unavailable';

export function StudentCheckinView() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'face' | 'qr'>('face');
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('initializing');
  const [qrCameraActive, setQrCameraActive] = useState(false);
  const [barcodeSupported, setBarcodeSupported] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; title?: string; text: string; receiptId?: string; timestamp?: string }>(null);
  const [token, setToken] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: activeSession, isFetching: sessionLoading, refetch: refetchSession } = useActiveSessionQuery(user?.email);
  const { data: bioStatusData } = useBiometricStatusQuery(user?.email);
  const enrollBiometric = useEnrollBiometricMutation(user?.email);
  const markQr = useMarkQrAttendanceMutation(user?.email);
  const markFace = useMarkFaceAttendanceMutation(user?.email);

  const bioStatus = bioStatusData
    ? { enrolled: Boolean(bioStatusData.enrolled), consent_given: Boolean(bioStatusData.consent_given) }
    : null;
  const scanning = markQr.isPending || markFace.isPending;

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
      setCameraStatus('unavailable');
      return;
    }
    setCameraStatus('initializing');
    try {
      const facing = mode === 'qr' ? 'environment' : 'user';
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: facing } });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setCameraStatus('ready');
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      } else {
        setCameraStatus('unavailable');
      }
    }
  }, [mode, stopCamera]);

  useEffect(() => {
    setBarcodeSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  useEffect(() => {
    if (mode === 'face' || qrCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, qrCameraActive, startCamera, stopCamera]);

  useEffect(() => {
    if (mode !== 'qr' || !qrCameraActive || cameraStatus !== 'ready' || !barcodeSupported) return;
    let cancelled = false;
    let rafId: number | null = null;
    const Detector = (window as any).BarcodeDetector;
    const detector = new Detector({ formats: ['qr_code'] });

    const tick = async () => {
      if (cancelled) return;
      try {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const codes = await detector.detect(videoRef.current);
          if (codes && codes.length > 0 && codes[0].rawValue) {
            setToken(String(codes[0].rawValue).trim());
            setQrCameraActive(false);
            return;
          }
        }
      } catch {
        /* ignore frame detection errors */
      }
      if (!cancelled) {
        rafId = window.setTimeout(tick, 400);
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (rafId) clearTimeout(rafId);
    };
  }, [mode, qrCameraActive, cameraStatus, barcodeSupported]);

  const captureFrameBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || cameraStatus !== 'ready') return resolve(null);
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  };

  const handleEnrollBiometric = async () => {
    if (!consentChecked) {
      setResult({ ok: false, title: 'Consent Required', text: 'Please confirm biometric consent before enrolling.' });
      return;
    }
    const blob = await captureFrameBlob();
    if (!blob) {
      setResult({ ok: false, title: 'Camera Unavailable', text: 'Allow camera permissions and position your face in good lighting.' });
      return;
    }
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', blob, 'enroll_face.jpg');
      fd.append('consent_given', 'true');
      await enrollBiometric.mutateAsync(fd);
      setResult({
        ok: true,
        title: 'Biometric Template Enrolled',
        text: 'Your 512-dimensional face template was encrypted and stored. You can now verify attendance.',
      });
    } catch (err: unknown) {
      setResult({
        ok: false,
        title: 'Enrollment Failed',
        text: err instanceof ApiError ? err.message : 'Unable to enroll face template. Ensure clear lighting and a single face.',
      });
    }
  };

  const runScan = async () => {
    setResult(null);
    try {
      const refreshed = await refetchSession();
      const active = refreshed.data ?? activeSession;
      if (!active?.is_active || !active?.session_id) {
        setResult({
          ok: false,
          title: 'Session Unavailable',
          text: 'No active classroom session found for your institution. Ask your instructor to launch the session or mark manual attendance.',
        });
        return;
      }

      if (mode === 'qr') {
        const trimmedToken = token.trim();
        if (!trimmedToken) {
          setResult({
            ok: false,
            title: 'QR Token Required',
            text: 'Scan the projector QR code or enter the rotating token manually.',
          });
          return;
        }

        let lat: number | undefined;
        let lng: number | undefined;
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
            );
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch {
            /* optional unless session requires geofence */
          }
        }

        const res = await markQr.mutateAsync({ sessionId: active.session_id, qrCode: trimmedToken, lat, lng });
        setResult({
          ok: true,
          title: 'Check-in Confirmed',
          text: `Dynamic QR token validated. Attendance logged for ${res?.subject || active.subject || 'Class'}.`,
          receiptId: res?.receipt_id || res?.attendance_id,
          timestamp: res?.timestamp,
        });
        setToken('');
      } else {
        const blob = await captureFrameBlob();
        if (!blob) {
          setResult({
            ok: false,
            title: cameraStatus === 'denied' ? 'Camera Permission Denied' : 'Camera Unavailable',
            text: 'Webcam feed unavailable. Enable camera access or switch to QR Mode / teacher-assisted attendance.',
          });
          return;
        }

        const formData = new FormData();
        formData.append('session_id', active.session_id);
        formData.append('image', blob, 'face_capture.jpg');

        const res = await markFace.mutateAsync(formData);
        setResult({
          ok: true,
          title: 'Identity Verified & Logged',
          text: `Face match verified (${typeof res?.confidence === 'number' ? `${(res.confidence * 100).toFixed(1)}%` : 'confirmed'}). Attendance recorded for ${res?.subject || active.subject || 'Class'}.`,
          receiptId: res?.receipt_id || res?.attendance_id,
          timestamp: res?.timestamp,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Verification failed. Please check with your instructor.';
      const status = err instanceof ApiError ? err.status : 0;
      const title =
        status === 409 ? 'Attendance Already Registered'
          : status === 429 ? 'Rate Limit Reached'
            : status === 503 || status === 504 ? 'Biometric Service Unavailable'
              : 'Verification Failed';
      setResult({ ok: false, title, text: msg });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Biometrics"
        title="Classroom Check-in"
        subtitle="Verify your identity via webcam face match or the rotating classroom QR token."
        actions={
          <Button variant="secondary" onClick={() => refetchSession()} loading={sessionLoading} className="h-9 px-3.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Session
          </Button>
        }
      />

      <div className="page-enter mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Active Classroom Session</p>
            <p className="mt-1 text-sm font-semibold text-hi">
              {sessionLoading && !activeSession ? 'Checking…' : activeSession?.is_active ? `${activeSession.subject}${activeSession.room ? ` · ${activeSession.room}` : ''}` : 'No active session'}
            </p>
          </div>
          <Badge tone={activeSession?.is_active ? 'success' : 'neutral'} pulse={Boolean(activeSession?.is_active)}>
            {activeSession?.is_active ? 'Live' : 'Idle'}
          </Badge>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Biometric Enrollment</p>
            <p className="mt-1 text-sm font-semibold text-hi">
              {bioStatus === null ? 'Checking…' : bioStatus.enrolled ? 'Enrolled (Server Verified)' : 'Not Enrolled'}
            </p>
          </div>
          <Badge tone={bioStatus?.enrolled ? 'success' : 'warning'}>
            {bioStatus?.enrolled ? 'Ready' : 'Enrollment Needed'}
          </Badge>
        </Card>
      </div>

      <div className="page-enter grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={mode === 'face' ? <ScanFace className="h-5 w-5 text-accent" /> : <QrCode className="h-5 w-5 text-accent" />}
            title={mode === 'face' ? 'Face Verification' : 'QR Token Scanner'}
            subtitle={mode === 'face' ? 'Live webcam feed with server-side ArcFace verification' : 'Scan the projector QR code or enter the rotating token'}
          />

          {mode === 'face' || qrCameraActive ? (
            <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-[20px] border border-white/[0.08] bg-black">
              {cameraStatus === 'ready' || cameraStatus === 'initializing' ? (
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover opacity-85" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-xs text-mid">
                  <CameraOff className="mb-2 h-8 w-8 text-red-400" />
                  <p className="font-semibold text-hi">
                    {cameraStatus === 'denied' ? 'Camera permission denied' : 'Camera unavailable'}
                  </p>
                  <p className="mt-1 text-[11px] text-faint">
                    Enable camera access in your browser settings or switch to manual QR token entry.
                  </p>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-32 w-32 rounded-[22px] border-2 border-accent/70 bg-accent/5 shadow-[0_0_24px_rgba(143,139,255,0.25)]" />
              </div>
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent animate-scan pointer-events-none" />
              <div className="absolute bottom-3 left-3 rounded-full border border-white/[0.08] bg-[#050507]/90 px-3 py-1 font-mono text-[10.5px] text-emerald-400">
                {mode === 'qr' ? 'Camera QR Scanner Active' : (bioStatus?.enrolled ? 'ArcFace 512d · Enrolled' : 'Camera Ready · Not Enrolled')}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-64 w-64 flex-col items-center justify-center rounded-[22px] border border-accent/40 bg-white p-4 shadow-2xl shadow-accent/20">
              <div className="relative flex h-full w-full flex-col items-center justify-center rounded-xl bg-gray-50 text-black">
                <QrCode className="h-36 w-36 text-slate-900" />
                {barcodeSupported && (
                  <button
                    type="button"
                    onClick={() => setQrCameraActive(true)}
                    className="mt-2 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-[#050507]"
                  >
                    Open Camera QR Scanner
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-2.5">
            <Button
              onClick={() => { setMode('face'); setQrCameraActive(false); setResult(null); }}
              variant={mode === 'face' ? 'primary' : 'secondary'}
              className="flex-1"
            >
              <Video className="h-4 w-4" /> Face Mode
            </Button>
            <Button
              onClick={() => { setMode('qr'); setResult(null); }}
              variant={mode === 'qr' ? 'primary' : 'secondary'}
              className="flex-1"
            >
              <QrCode className="h-4 w-4" /> QR Mode
            </Button>
          </div>

          <Button onClick={runScan} loading={scanning} className="mt-3.5 w-full py-3">
            {scanning ? 'Verifying…' : mode === 'face' ? 'Verify Face' : 'Submit QR Token'}
          </Button>

          {mode === 'face' && bioStatus && !bioStatus.enrolled && (
            <div className="mt-4 rounded-[16px] border border-amber-500/25 bg-amber-500/5 p-3.5 text-xs">
              <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Biometric Enrollment Required
              </p>
              <label className="mt-2 flex items-start gap-2 text-[11px] text-mid cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span>I consent to storing an encrypted 512-D facial embedding for classroom attendance verification.</span>
              </label>
              <Button
                type="button"
                variant="secondary"
                onClick={handleEnrollBiometric}
                loading={enrollBiometric.isPending}
                className="mt-2.5 w-full text-xs"
              >
                Enroll Face Now
              </Button>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Classroom Token" subtitle="Scan with camera or paste the rotating HMAC token shown on the projector" />
            <div className="space-y-3">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.trim())}
                placeholder="Paste or scan QR token"
                className="w-full rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-center text-sm font-bold tracking-wider text-accent placeholder-faint focus:border-accent focus:outline-none"
              />
              {qrCameraActive && (
                <Button type="button" variant="ghost" onClick={() => setQrCameraActive(false)} className="w-full text-xs">
                  Stop Camera Scanner
                </Button>
              )}
              <p className="font-mono text-[10.5px] text-faint text-center">
                Tokens rotate every 20 seconds and are validated server-side with replay prevention.
              </p>
            </div>
          </Card>

          {result && (
            <Card className={result.ok ? 'border-emerald-500/30' : 'border-red-500/30'}>
              <div className="flex items-start gap-3">
                {result.ok ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-hi">{result.title || (result.ok ? 'Check-in confirmed' : 'Verification failed')}</p>
                  <p className="text-xs text-mid">{result.text}</p>
                  {result.receiptId && (
                    <p className="font-mono text-[11px] text-accent">
                      Receipt ID: {result.receiptId}
                      {result.timestamp ? ` · ${new Date(result.timestamp).toLocaleTimeString()}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Anti-Proxy & Fallback Policy" />
            <ul className="space-y-2.5 text-xs text-mid">
              <li className="flex gap-2.5 items-center"><Badge tone="purple">01</Badge> Rotating HMAC-SHA256 QR tokens expire after 20 seconds server-side.</li>
              <li className="flex gap-2.5 items-center"><Badge tone="purple">02</Badge> Duplicate or cross-institution attendance submissions are blocked atomically.</li>
              <li className="flex gap-2.5 items-center"><Badge tone="purple">03</Badge> If camera or QR fails, request teacher-assisted roster verification in class.</li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
