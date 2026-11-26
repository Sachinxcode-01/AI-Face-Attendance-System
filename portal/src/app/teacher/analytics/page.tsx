'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherAnalyticsQuery } from '@/features/teacher/teacher.queries';
import { teacherApi } from '@/features/teacher/teacher.api';
import { queryClient } from '@/core/query/queryClient';
import { teacherKeys } from '@/core/query/queryKeys';
import {
  BarChart3, ScanFace, QrCode, UsersRound, TrendingUp,
  AlertTriangle, BellRing, ClipboardEdit, BookOpen, ShieldAlert,
} from 'lucide-react';

type RiskStudentRow = NonNullable<import('@/lib/types').TeacherAnalytics['risk_students']>[number];

export default function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [trendMode, setTrendMode] = useState<'weekly' | 'daily' | 'monthly'>('weekly');

    const { data: analytics, isLoading, isFetching, error, refetch } = useTeacherAnalyticsQuery(
      user?.email,
      subjectFilter
    );

    // Intervention / warning modal state
    const [selectedRisk, setSelectedRisk] = useState<RiskStudentRow | null>(null);
    const [actionTaken, setActionTaken] = useState<'reminder_sent' | 'counseling_scheduled' | 'note' | 'escalated'>('reminder_sent');
    const [note, setNote] = useState('');
    const [sendAlert, setSendAlert] = useState(true);
    const [saving, setSaving] = useState(false);

    const openActionModal = (student: RiskStudentRow) => {
      setSelectedRisk(student);
      setActionTaken(student.risk_level === 'critical' ? 'escalated' : 'reminder_sent');
      setNote(
        student.classes_needed
          ? `Current attendance is ${student.attendance_rate}%. Attend ${student.classes_needed} consecutive classes to reach the ${analytics?.policy_min_percentage ?? 75}% minimum.`
          : `Attendance warning: ${student.attendance_rate}%.`
      );
      setSendAlert(true);
    };

    const handleSubmitIntervention = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedRisk || !note.trim()) return;
      setSaving(true);
      try {
        await teacherApi.logIntervention({
          student_email: selectedRisk.email,
          subject: subjectFilter !== 'all' ? subjectFilter : undefined,
          risk_level: selectedRisk.risk_level,
          action_taken: actionTaken,
          note: note.trim(),
        });
        if (sendAlert) {
          await teacherApi.sendStudentAlert({
            student_email: selectedRisk.email,
            title: `Attendance Risk Notice (${selectedRisk.risk_level.toUpperCase()})`,
            message: note.trim(),
            priority: selectedRisk.risk_level === 'critical' ? 'Urgent' : 'High',
          });
        }
        push('Risk intervention logged cleanly', 'success');
        setSelectedRisk(null);
        setNote('');
        await queryClient.invalidateQueries({ queryKey: [...teacherKeys.all(user?.email), 'analytics'] });
      } catch (err) {
        push(err instanceof Error ? err.message : 'Failed to log intervention', 'error');
      } finally {
        setSaving(false);
      }
};

const minPolicy = analytics?.policy_min_percentage ?? 75;
const dist = analytics?.distribution ?? { excellent: 0, safe: 0, warning: 0, critical: 0 };
const totalDist = Math.max(1, dist.excellent + dist.safe + dist.warning + dist.critical);
const activeTrends =
  trendMode === 'daily'
    ? (analytics?.daily_trends ?? []).map((t) => ({ key: t.date, label: t.date.slice(5), present: t.present, total: t.total, rate: t.rate }))
    : trendMode === 'monthly'
      ? (analytics?.monthly_trends ?? []).map((t) => ({ key: t.month, label: t.label, present: t.present, total: t.total, rate: t.rate }))
      : (analytics?.weekly_trends ?? []).map((t) => ({ key: `${t.year}-W${t.week}`, label: t.label || `W${t.week}`, present: t.present, total: t.total, rate: t.rate }));

return (
  <DashboardLayout>
    <Toasts toasts={toasts} dismiss={dismiss} />
    <PageHeader
      kicker="Academic Intelligence"
      title="Classroom Analytics & Risk Radar"
      subtitle="Class-wise performance, verification reliability, comparative trends, and explainable student shortage interventions."
      actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filter analytics by subject"
              className="rounded-full border border-white/10 bg-[#101016] px-4 py-2 text-xs text-hi focus:border-accent/50 focus:outline-none"
            >
              <option value="all">All Assigned Subjects</option>
              {(analytics?.subjects ?? []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              Refresh
            </Button>
          </div>
      }
    />

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            <span>{error instanceof Error ? error.message : 'Unable to load analytics'}</span>
            <button onClick={() => refetch()} className="underline hover:text-white">Retry</button>
          </div>
      )}

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !analytics ? (
          <EmptyState icon={<BarChart3 className="h-6 w-6" />} title="Analytics unavailable" body="Conduct attendance sessions to generate classroom intelligence." />
          ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Class Attendance"
                value={`${analytics.attendance_rate}%`}
                delta={
                  analytics.month_comparison
                    ? `${analytics.month_comparison.delta >= 0 ? '+' : ''}${analytics.month_comparison.delta}% MoM`
                    : undefined
                }
                deltaUp={(analytics.month_comparison?.delta ?? 0) >= 0}
                icon={<TrendingUp className="h-4 w-4" />}
                accent="text-accent"
                footnote={`${analytics.present_marks} / ${analytics.conducted_marks ?? analytics.present_marks} marks`}
              />
              <StatCard
                label="Conducted Sessions"
                value={String(analytics.total_sessions)}
                icon={<BarChart3 className="h-4 w-4" />}
                footnote={`${analytics.absent_marks ?? 0} absent • ${analytics.late_marks ?? 0} late`}
              />
              <StatCard
                label="Verification Channels"
                value={String(analytics.qr_scans + analytics.face_scans)}
                icon={<ScanFace className="h-4 w-4" />}
                footnote={`QR: ${analytics.qr_scans} • Face: ${analytics.face_scans} • Manual: ${analytics.manual_scans}`}
              />
              <StatCard
                label="Exceptions & Failures"
                value={String((analytics.verification_failures ?? 0) + (analytics.dispute_count ?? 0))}
                icon={<ShieldAlert className="h-4 w-4" />}
                footnote={`Failures: ${analytics.verification_failures ?? 0} • Leaves: ${analytics.leave_count ?? 0} • Disputes: ${analytics.dispute_count ?? 0}`}
              />
            </div>

                        {/* Trends & Distribution */}
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                          <Card className="lg:col-span-2">
                            <CardHeader
                              icon={<BarChart3 className="h-4 w-4" />}
                              title="Attendance Trend Breakdown"
                              subtitle="Server-computed rates across conducted lectures"
                              right={
                                <div className="flex rounded-full border border-white/10 bg-white/5 p-0.5 text-[11px]">
                                  {(['daily', 'weekly', 'monthly'] as const).map((m) => (
                                    <button
                                      key={m}
                                      onClick={() => setTrendMode(m)}
                                      className={`rounded-full px-3 py-1 capitalize transition ${trendMode === m ? 'bg-accent text-black font-semibold' : 'text-mid hover:text-hi'}`}
                                    >
                                      {m}
                                    </button>
                                  ))}
                                </div>
                              }
                            />
                            {activeTrends.length === 0 ? (
                              <EmptyState icon={<BarChart3 className="h-6 w-6" />} title="No trend points yet" body="Trend history builds as sessions accumulate." />
                            ) : (
                <div className="space-y-3">
                  {activeTrends.map((t) => (
                    <div key={t.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-hi">{t.label}</span>
                        <span className="font-mono text-mid">{t.rate}% ({t.present}/{t.total})</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full ${t.rate >= minPolicy ? 'bg-accent' : t.rate >= 65 ? 'bg-amber-400' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, Math.max(0, t.rate))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                            )}
                          </Card>

                          <Card>
                            <CardHeader icon={<UsersRound className="h-4 w-4" />} title="Cohort Distribution" subtitle={`Policy threshold: ${minPolicy}%`} />
                            <div className="space-y-3">
                              {[
                                { label: 'Excellent (≥90%)', count: dist.excellent, bar: 'bg-emerald-400', text: 'text-emerald-300' },
                                { label: `Safe (${minPolicy}–89%)`, count: dist.safe, bar: 'bg-sky-400', text: 'text-sky-300' },
                                { label: `Warning (65–${minPolicy - 1}%)`, count: dist.warning, bar: 'bg-amber-400', text: 'text-amber-300' },
                                { label: 'Critical (<65%)', count: dist.critical, bar: 'bg-red-500', text: 'text-red-300' },
                              ].map((tier) => (
                                <div key={tier.label} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className={tier.text}>{tier.label}</span>
                                    <span className="font-mono text-hi">{tier.count}</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                    <div
                                      className={`h-full rounded-full ${tier.bar}`}
                                      style={{ width: `${Math.round((tier.count / totalDist) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ))}

                              {analytics.avg_confidence !== null && (
                                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-mid">Avg Face Match Confidence</span>
                                    <span className="font-mono font-bold text-accent">{(analytics.avg_confidence * 100).toFixed(1)}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        </div>

          {/* Subject Breakdown */}
          {analytics.subject_breakdown && analytics.subject_breakdown.length > 0 && (
            <Card>
              <CardHeader icon={<BookOpen className="h-4 w-4" />} title="Subject-Wise Attendance Comparison" subtitle="Attendance rates per assigned subject" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {analytics.subject_breakdown.map((s) => (
                  <div key={s.subject} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold text-hi">{s.subject}</p>
                      <Badge tone={s.rate >= minPolicy ? 'success' : s.rate >= 65 ? 'warning' : 'danger'}>{s.rate}%</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-faint">
                      Present: {s.present} / {s.conducted} • Absent: {s.absent} • Late: {s.late}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${s.rate >= minPolicy ? 'bg-emerald-400' : s.rate >= 65 ? 'bg-amber-400' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, s.rate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Explainable Risk Intelligence */ }
                              <Card>
                                <CardHeader
                                  icon={<AlertTriangle className="h-4 w-4" />}
                                  title="Explainable Shortage & Risk Intelligence"
                                  subtitle={`Students below ${minPolicy}% or showing consecutive absences, with recovery projections and audit interventions.`}
                                />
                                {!analytics.risk_students?.length ? (
                                  <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="No students flagged at risk" body="All authorised students are meeting attendance requirements." />
                                ) : (
                                  <div className="space-y-3">
                                    {analytics.risk_students.map((st) => (
                                      <div key={st.email} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                          <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="font-display text-sm font-bold text-hi">{st.full_name}</span>
                                              {st.student_id && (
                                                <span className="font-mono text-[11px] text-faint">{st.student_id}</span>
                                              )}
                                              <Badge tone={statusTone(st.risk_level)}>{st.risk_level}</Badge>
                                              <Badge tone="neutral">{st.attendance_rate}% ({st.attended}/{st.conducted})</Badge>
                                              {st.consecutive_absences > 0 && (
                                                <Badge tone="danger">{st.consecutive_absences} consecutive absences</Badge>
                                              )}
                                            </div>

                                            <p className="text-xs text-mid">
                                              {st.reasons.join(' • ')}
                                            </p>

                                            <div className="flex flex-wrap gap-3 text-[11px] text-faint">
                                              {st.classes_needed !== null && st.classes_needed > 0 && (
                                                <span className="text-amber-300">
                                                  Needs <strong>{st.classes_needed}</strong> straight classes for {minPolicy}%
                                                </span>
                                              )}
                                              {st.recommendations.map((rec, i) => (
                                                <span key={i}>• {rec}</span>
                                              ))}
                                            </div>

                                            {st.interventions.length > 0 && (
                                              <p className="text-[11px] text-sky-300">
                                                Latest intervention ({new Date(st.interventions[0].created_at).toLocaleDateString()}):{' '}
                                                {st.interventions[0].action_taken.replace('_', ' ')} — {st.interventions[0].note}
                                              </p>
                                            )}
                                          </div>

                                          <Button variant="secondary" onClick={() => openActionModal(st)}>
                                            <BellRing className="h-3.5 w-3.5" /> Warn / Intervene
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </Card>
        </div>
                        )}

                        <Modal
                          open={Boolean(selectedRisk)}
                          onClose={() => setSelectedRisk(null)}
                          title={selectedRisk ? `Intervention — ${selectedRisk.full_name}` : 'Risk Intervention'}
                        >
                          <form onSubmit={handleSubmitIntervention} className="space-y-4">
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-mid">Action</label>
                              <select
                                value={actionTaken}
                                onChange={(e) => setActionTaken(e.target.value as typeof actionTaken)}
                                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
                              >
                                <option value="reminder_sent">Send Attendance Reminder</option>
                                <option value="counseling_scheduled">Schedule Counseling</option>
                                <option value="note">Internal Faculty Note</option>
                                <option value="escalated">Escalate to HOD / Mentor</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-mid">Details / Warning Message</label>
                              <textarea
                                required
                                rows={3}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
                              />
                            </div>
                            <label className="flex items-center gap-2 text-xs text-mid">
                              <input type="checkbox" checked={sendAlert} onChange={(e) => setSendAlert(e.target.checked)} />
                              Send direct warning notification to student (&amp; linked guardian)
                            </label>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="ghost" onClick={() => setSelectedRisk(null)}>Cancel</Button>
                              <Button type="submit" loading={saving}>
                                <ClipboardEdit className="h-3.5 w-3.5" /> Save &amp; Notify
                              </Button>
                            </div>
                          </form>
                        </Modal>
                      </DashboardLayout>
                      );
}