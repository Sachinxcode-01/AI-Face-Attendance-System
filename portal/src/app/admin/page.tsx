'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAttendanceLive } from '@/hooks/useAttendanceLive';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  ShieldAlert,
  Cpu,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Terminal,
  Download,
  Users,
  Eye,
  BellRing,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, apiFetch } from '@/lib/api';

export default function AdminPortalPage() {
  const { user, role } = useAuth();
  const profileName = user?.name || 'Administrator';
  const [similarityThreshold, setSimilarityThreshold] = useState(0.65);
  const [livenessRequired, setLivenessRequired] = useState(true);
  const [intruders, setIntruders] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [incidentNotes, setIncidentNotes] = useState('');
  const [incidentStatus, setIncidentStatus] = useState('Under review');
  const [alertDispatched, setAlertDispatched] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<{ api_response_time?: number; active_cameras?: number; mongodb_connection?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [liveStreamLogs, setLiveStreamLogs] = useState<
    { id: string; time: string; text: string; type: 'success' | 'info' | 'warning' }[]
  >([]);

  const { isConnected } = useAttendanceLive({
    channel: 'live-logs',
    onEvent: (evt) => {
      setStats((prev: any) => prev ? { ...prev, totalAttendance: (prev.totalAttendance || 0) + 1 } : prev);
      const timeStr = evt.timestamp
        ? new Date(evt.timestamp).toTimeString().split(' ')[0]
        : new Date().toTimeString().split(' ')[0];
      const desc = evt.verified_by === 'face'
          ? `${evt.student_name || evt.student_email?.split('@')[0] || 'Student'} matched ArcFace (${evt.confidence || 'verified'})`
          : `${evt.student_name || evt.student_email?.split('@')[0] || 'Student'} dynamic QR validated`;
      setLiveStreamLogs((prev) => [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: timeStr, text: desc, type: 'success' },
        ...prev.slice(0, 14),
      ]);
    },
  });

      const loadAdminData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
          const [statsRes, threatsRes, calRes, telRes] = await Promise.allSettled([
            api.admin.stats(),
            api.admin.threats(),
            api.admin.calibration.get(),
            apiFetch<any>('/telemetry/system'),
          ]);

          if (statsRes.status === 'fulfilled' && statsRes.value) {
            setStats(statsRes.value);
          } else if (statsRes.status === 'rejected') {
            setError(statsRes.reason?.message || 'Unable to load institutional command centre metrics.');
          }

      if (threatsRes.status === 'fulfilled' && Array.isArray(threatsRes.value)) {
        setIntruders(
          threatsRes.value.map((t: any, idx: number) => ({
            id: t.id || `threat-${idx}`,
            imageUrl: t.image_base64 ? `data:image/jpeg;base64,${t.image_base64}` : (t.imageUrl || ''),
            cameraLocation: t.location || t.cameraLocation || 'Campus Gate',
            timestamp: t.timestamp ? new Date(t.timestamp).toLocaleString() : '—',
            confidence: typeof t.confidence === 'number' ? t.confidence : null,
            status: t.status || 'Active',
            severity: t.severity || 'medium',
            resolution_notes: t.resolution_notes || '',
          }))
        );
      }

            if (calRes.status === 'fulfilled' && calRes.value) {
              if (typeof calRes.value.similarity_threshold === 'number') {
                setSimilarityThreshold(calRes.value.similarity_threshold);
              }
                if (typeof calRes.value.liveness_required === 'boolean') {
                  setLivenessRequired(calRes.value.liveness_required);
                }
              }

              if (telRes.status === 'fulfilled' && telRes.value) {
                setTelemetry(telRes.value);
              }
            } finally {
              setLoading(false);
            }
          }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleDispatchSecurity = async () => {
    try {
      const firstId = intruders[0]?.id;
      if (firstId) {
        await api.admin.security.updateIncident({ log_id: firstId, status: 'Dispatched' });
        await loadAdminData();
      }
      setAlertDispatched(true);
      setTimeout(() => setAlertDispatched(false), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch security alert.');
    }
  };

  const handleExportAuditLogs = async () => {
    setExportError('');
    try {
      const realLogs = await api.admin.auditLogs();
      const blob = new Blob([JSON.stringify(realLogs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartface-audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  } catch (err: any) {
    setExportError(err?.message || 'Failed to export audit logs. Please try again.');
  }
};

  const handleSaveCalibration = async () => {
    setCalibrating(true);
    setError('');
    try {
      await api.admin.calibration.update({
        similarity_threshold: similarityThreshold,
        liveness_required: livenessRequired,
      });
      setCalibrated(true);
      setTimeout(() => setCalibrated(false), 3000);
  } catch (err: any) {
    setError(err?.message || 'Failed to persist biometric calibration.');
  } finally {
    setCalibrating(false);
  }
};

  const handleSaveIncident = async () => {
    if (!selectedIncident) return;
    try {
      await api.admin.security.updateIncident({
        log_id: selectedIncident.id,
        status: incidentStatus,
        resolution_notes: incidentNotes,
      });
    setSelectedIncident(null);
    await loadAdminData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update security incident.');
    }
  };

  const activeAlertsCount = stats?.unresolved_alerts ?? intruders.filter((i) => ['Active', 'Detected', 'Escalated'].includes(i.status)).length;

          return (
          <DashboardLayout>
            <div className="space-y-8">
              {/* Top Header & Telemetry Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[22px] card-bytune p-6 shadow-2xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-spotify animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-[10.5px] font-mono font-semibold uppercase tracking-wider text-accent">
                      {stats?.institution?.name || 'Institutional Command'} • {isConnected ? 'Real-Time Engine Active' : 'Syncing Telemetry'}
                    </span>
                  </div>
                  <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                    Campus Biometric Command &amp; Sentinel Console
                  </h1>
                  <p className="text-xs text-mid mt-1">
                    Administrator: {profileName} • Last sync: {stats?.last_sync ? new Date(stats.last_sync).toLocaleTimeString() : '—'}
                  </p>
                </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={loadAdminData}
                      disabled={loading}
                      className="btn-pill-glass text-xs font-semibold"
                      title="Refresh institutional data"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      <span>Sync</span>
                    </button>
                    <button
                      onClick={handleDispatchSecurity}
                      className="btn-pill-glass text-red-300 border-red-500/30 bg-red-500/10 text-xs font-semibold hover:bg-red-500/20"
                    >
                      <BellRing className="h-4 w-4" />
                      <span>{alertDispatched ? 'Security Dispatched!' : 'Acknowledge Top Alert'}</span>
                    </button>
                    {role === 'super_admin' && (
              <Link
                href="/admin/super-admin"
                className="btn-pill-glass text-xs font-semibold text-accent border-accent/30 bg-accent/10 hover:bg-accent/20 flex items-center gap-1.5"
              >
                <Cpu className="h-4 w-4" />
                <span>Super Admin Plane</span>
              </Link>
            )}
                  <button
                    onClick={handleExportAuditLogs}
                    className="btn-pill-glass text-xs font-semibold"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Audit Logs</span>
                  </button>
                </div>
              </div>

              {(error || exportError) && (
                <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  {error || exportError}
                </div>
              )}

                  {/* 4 Primary Command Telemetry Metrics */}
                  <div id="telemetry" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="rounded-[22px] card-surface p-5">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>Institutional Attendance</span>
                        <Users className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold text-white">
                          {(stats?.totalAttendance ?? 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-emerald-400 font-medium">
                          {stats?.overall_attendance_pct ?? 0}% overall
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {stats?.total_students ?? 0} students • {stats?.total_faculty ?? 0} faculty • {stats?.total_departments ?? 0} depts
                      </p>
                    </div>

                      <div className="rounded-[22px] card-surface p-5">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>API &amp; Inference Latency</span>
                          <Cpu className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-3xl font-bold text-emerald-400">
                            {telemetry?.api_response_time != null ? `${telemetry.api_response_time}ms` : '—'}
                          </span>
                          <span className="text-xs text-gray-400">{telemetry?.mongodb_connection || 'live probe'}</span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Devices: {stats?.active_devices ?? 0} online / {stats?.offline_devices ?? 0} offline
                        </p>
                      </div>

                        <div className="rounded-[22px] card-surface p-5">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                            <span>Active Security Alerts</span>
                            <ShieldAlert className="h-4 w-4 text-red-400" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-display text-3xl font-bold text-red-400">{activeAlertsCount}</span>
                            <span className="text-xs text-red-400 font-medium">unresolved</span>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            Pending: {stats?.pending_leaves ?? 0} leaves • {stats?.pending_disputes ?? 0} disputes
                          </p>
                        </div>

                          <div className="rounded-[22px] card-surface p-5">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                              <span>Active Sessions &amp; Risk</span>
                              <Eye className="h-4 w-4 text-purple-400" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-display text-3xl font-bold text-white">
                                {stats?.active_sessions ?? telemetry?.active_cameras ?? 0}
                              </span>
                              <span className="text-xs text-purple-400 font-medium">
                                {stats?.completed_sessions_today ?? 0} done today
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              {stats?.shortage_students ?? 0} shortages • {stats?.biometric_pending ?? 0} pending bio
                            </p>
                          </div>
                        </div>

                          {/* 2-Column Grid: Intruder Sentinel & ArcFace Model Calibration */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left 7 Cols: Security Sentinel */}
                            <div id="sentinel" className="lg:col-span-7 space-y-6">
                              <div className="rounded-[22px] card-surface p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                                    <Camera className="h-5 w-5 text-red-400" />
                                    <span>Institutional Security Sentinel</span>
                                  </h3>
                                  <Link href="/admin/security" className="rounded-md bg-white/5 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-white/10">
                                    Full Incident Queue →
                                  </Link>
                                </div>

                                        <div className="mt-2">
                                          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                                            Recent Security Events
                                          </h4>
                                          {intruders.length === 0 ? (
                                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-gray-400">
                                              No security incidents logged for your institution.
                                            </div>
                                          ) : (
                                          <div className="space-y-3">
                                              {
                                                intruders.slice(0, 6).map((item) => (
                                                  <div
                                                    key={item.id}
                                                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:border-red-500/30 transition-all"
                                                  >
                                                    <div className="flex items-center gap-3">
                                                      {item.imageUrl ? (
                                                        <img
                                                          src={item.imageUrl}
                                                          alt="Event capture"
                                                          className="h-10 w-10 rounded-lg object-cover ring-1 ring-red-500/40"
                                                        />
                                                      ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 ring-1 ring-red-500/30">
                                                          <ShieldAlert className="h-4 w-4 text-red-400" />
                                                        </div>
                                                      )}
                                                      <div>
                                                        <p className="text-xs font-bold text-white">{item.cameraLocation}</p>
                                                        <span className="text-[11px] text-gray-400">
                                                          Logged: {item.timestamp}
                                                          {item.confidence != null ? ` • Confidence: ${(item.confidence * 100).toFixed(0)}%` : ''}
                                                        </span>
                                                      </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                      <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase border border-red-500/20">
                                                        {item.status}
                                                      </span>
                                                      <button
                                                        onClick={() => {
                                                          setSelectedIncident(item);
                                                          setIncidentStatus(item.status || 'Under review');
                                                          setIncidentNotes(item.resolution_notes || '');
                                                        }}
                                                        className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20 transition-colors"
                                                      >
                                                        Inspect
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))
                                              }
                  </div>
                )}
                                      </div>
                                    </div>
                                  </div>

                                    {/* Right 5 Cols: ArcFace Calibration & Live Audit Stream */}
                                    <div id="calibration" className="lg:col-span-5 space-y-6">
                                      <div className="rounded-[22px] card-surface p-6">
                                        <h3 className="font-display text-base font-bold text-white mb-4 flex items-center gap-2">
                                          <Sliders className="h-5 w-5 text-indigo-400" />
                                          <span>ArcFace Biometric Calibration</span>
                                        </h3>

                                              <div className="space-y-5">
                                                <div>
                                                  <div className="flex justify-between text-xs mb-1.5">
                                                    <label htmlFor="cosine-similarity-threshold" className="text-gray-300 font-semibold cursor-pointer">
                                                      Cosine Similarity Threshold
                                                    </label>
                                                    <span className="font-mono text-indigo-400 font-bold">{similarityThreshold.toFixed(2)}</span>
                                                  </div>
                                                  <input
                                                    id="cosine-similarity-threshold"
                                                    type="range"
                                                    min="0.50"
                                                    max="0.85"
                                                    step="0.01"
                                                    value={similarityThreshold}
                                                    onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                                                    className="w-full accent-indigo-500 cursor-pointer"
                                                  />
                                                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                                    <span>0.50 (Loose match)</span>
                                                    <span>0.65 (Enterprise Default)</span>
                                                    <span>0.85 (High Security)</span>
                                                  </div>
                                                </div>

                                                  <div className="rounded-xl bg-white/[0.04] p-3.5 border border-white/5 space-y-2 text-xs">
                                                    <div className="flex justify-between text-gray-400">
                                                      <span>Neural Model:</span>
                                                      <span className="font-mono text-white font-medium">ArcFace buffalo_l.onnx</span>
                                                    </div>
                                                    <div className="flex justify-between text-gray-400">
                                                      <span>Embedding Dimensions:</span>
                                                      <span className="font-mono text-emerald-400 font-medium">512 FP32 Floats</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-gray-400">
                                                      <span>Liveness Anti-Spoofing:</span>
                                                      <label className="flex items-center gap-1.5 text-emerald-400 font-medium cursor-pointer">
                                                        <input
                                                          type="checkbox"
                                                          checked={livenessRequired}
                                                          onChange={(e) => setLivenessRequired(e.target.checked)}
                                                          className="accent-indigo-500"
                                                        />
                                                        <span>{livenessRequired ? 'Required' : 'Disabled'}</span>
                                                      </label>
                                                    </div>
                                                  </div>

                                                <button
                                                  onClick={handleSaveCalibration}
                                                  disabled={calibrating}
                                                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-colors shadow-lg shadow-indigo-600/20"
                                                >
                                                  {calibrating
                                                    ? 'Saving Calibration...'
                                                    : calibrated
                                                      ? 'Calibration Saved to Institution Policy!'
                                                      : 'Save & Calibrate Clusters'}
                                                </button>
                                              </div>
                                            </div>

                                              {/* Live Audit Stream */}
                                              <div className="rounded-[22px] card-surface p-6">
                                                <h3 className="font-display text-base font-bold text-white mb-4 flex items-center gap-2">
                                                  <Terminal className="h-5 w-5 text-emerald-400" />
                                                  <span>Live Attendance &amp; Audit Stream</span>
                                                </h3>

                                                    <div className="space-y-2 font-mono text-[11px] text-gray-400 max-h-56 overflow-y-auto">
                                                      {liveStreamLogs.length === 0 ? (
                                                        <p className="text-gray-500">Listening for real-time institution events...</p>
                                                      ) : (
                                                        liveStreamLogs.map((log) => (
                                                          <div
                                                            key={log.id}
                                                            className={`flex items-center gap-2 ${log.type === 'success'
                                                              ? 'text-emerald-400'
                                                              : log.type === 'warning'
                                                                ? 'text-red-400'
                                                                : 'text-blue-400'
                                                              }`}
                                                          >
                                                            {log.type === 'warning' ? (
                                                              <AlertTriangle className="h-3 w-3 shrink-0" />
                                                            ) : (
                                                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                                                            )}
                                                            <span>[{log.time}] {log.text}</span>
                                                          </div>
                                                  ))
                )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Incident Inspection Modal */}
                                        <Modal
                                          open={Boolean(selectedIncident)}
                                          onClose={() => setSelectedIncident(null)}
                                          title="Inspect Security Incident"
                                        >
                                          {selectedIncident && (
                                            <div className="space-y-4 text-xs">
                                              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
                                                <p className="font-bold text-white">{selectedIncident.cameraLocation}</p>
                                                <p className="text-gray-400">Logged: {selectedIncident.timestamp}</p>
                                                <p className="text-gray-400">Severity: <span className="uppercase text-white">{selectedIncident.severity}</span></p>
                                              </div>
                                              <div>
                                                <label className="block text-gray-300 font-semibold mb-1">Incident Status</label>
                                                <select
                                                  value={incidentStatus}
                                                  onChange={(e) => setIncidentStatus(e.target.value)}
                                                  className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white"
                                                >
                                                  <option value="Active">Active</option>
                                                  <option value="Under review">Under review</option>
                                                  <option value="Investigating">Investigating</option>
                                                  <option value="Escalated">Escalated</option>
                                                  <option value="Resolved">Resolved</option>
                                                  <option value="False positive">False positive</option>
                                                  <option value="Closed">Closed</option>
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-gray-300 font-semibold mb-1">Investigation Notes</label>
                                                <textarea
                                                  rows={3}
                                                  value={incidentNotes}
                                                  onChange={(e) => setIncidentNotes(e.target.value)}
                                                  placeholder="Record human review findings..."
                                                  className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white"
                                                />
                                              </div>
                                              <div className="flex justify-end gap-2 pt-2">
                                                <Button variant="ghost" onClick={() => setSelectedIncident(null)}>Cancel</Button>
                                                <Button onClick={handleSaveIncident}>Save Review</Button>
                                              </div>
                                            </div>
        )}
                                    </Modal>
                                  </DashboardLayout>
                                  );
}
