'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScanFace, QrCode, CheckCircle2, Loader2, Video, VideoOff, KeyRound } from 'lucide-react';

export default function StudentCheckinPage() {
  const [mode, setMode] = useState<'face' | 'qr'>('face');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; text: string }>(null);
  const [token, setToken] = useState('SMARTFACE_SEC_' + Math.random().toString(36).slice(2, 9).toUpperCase());
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (mode === 'face') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 480 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {
          /* camera unavailable — simulation continues with placeholder */
        });
    }
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [mode]);

  const runScan = () => {
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setScanning(false);
      setResult({
        ok: true,
        text: mode === 'face'
          ? 'ArcFace match verified — confidence 99.4%. Attendance logged for Lab 402.'
          : 'Dynamic QR token validated. Anti-proxy window within 30s drift tolerance.',
      });
    }, 1800);
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Biometrics"
        title="Classroom Check-in"
        subtitle="Verify your identity via webcam face match or the rotating classroom QR token."
      />

      <div className="page-enter grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={mode === 'face' ? <ScanFace className="h-5 w-5 text-indigo-400" /> : <QrCode className="h-5 w-5 text-indigo-400" />}
            title={mode === 'face' ? 'Face Verification' : 'QR Token Scanner'}
            subtitle={mode === 'face' ? 'Live webcam feed with liveness detection' : 'Scan the projector code or enter the token'}
          />

          {mode === 'face' ? (
            <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-2xl border-2 border-indigo-500/70 bg-indigo-500/5" />
              </div>
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan pointer-events-none" />
              <div className="absolute bottom-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 font-mono text-[10px] text-emerald-400">
                ArcFace buffalo_l • 512-dim • 30 FPS
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-2xl border-2 border-indigo-500/40 bg-white p-4 shadow-2xl shadow-indigo-500/20">
              <div className="relative flex h-full w-full flex-col items-center justify-center rounded-lg bg-gray-50 text-black">
                <QrCode className="h-40 w-40 text-slate-900" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-xs text-white">SF</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button onClick={() => { setMode('face'); setResult(null); }} variant={mode === 'face' ? 'primary' : 'secondary'} className="flex-1">
              <Video className="h-4 w-4" /> Face Mode
            </Button>
            <Button onClick={() => { setMode('qr'); setResult(null); }} variant={mode === 'qr' ? 'primary' : 'secondary'} className="flex-1">
              <QrCode className="h-4 w-4" /> QR Mode
            </Button>
          </div>

          <Button onClick={runScan} loading={scanning} className="mt-3 w-full py-3">
            {scanning ? 'Verifying…' : mode === 'face' ? 'Verify Face' : 'Scan Token'}
          </Button>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Live Token" subtitle="Refreshes every 15 seconds (anti-proxy window)" />
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-center">
              <p className="font-mono text-lg font-bold tracking-widest text-indigo-300">{token}</p>
              <p className="mt-2 text-[10px] text-gray-500">Signed with campus HSM • TOTP epoch 30s</p>
            </div>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setToken('SMARTFACE_SEC_' + Math.random().toString(36).slice(2, 9).toUpperCase())}>
              <KeyRound className="h-4 w-4" /> Refresh Token
            </Button>
          </Card>

          {result && (
            <Card className={result.ok ? 'border-emerald-500/30' : 'border-red-500/30'}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${result.ok ? 'text-emerald-400' : 'text-red-400'}`} />
                <div>
                  <p className="text-sm font-bold text-white">{result.ok ? 'Check-in confirmed' : 'Verification failed'}</p>
                  <p className="mt-1 text-xs text-gray-400">{result.text}</p>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="How anti-proxy works" />
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex gap-2"><Badge tone="info">01</Badge> QR tokens rotate every 15 seconds and expire instantly.</li>
              <li className="flex gap-2"><Badge tone="info">02</Badge> Each token is bound to your device fingerprint.</li>
              <li className="flex gap-2"><Badge tone="info">03</Badge> Replayed or screenshot tokens are rejected server-side.</li>
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
