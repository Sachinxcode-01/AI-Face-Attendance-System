'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { teacherApi } from '@/features/teacher/teacher.api';
import { useTeacherDashboardQuery, useTeacherTimetableQuery } from '@/features/teacher/teacher.queries';
import { ChevronLeft, Play, Loader2 } from 'lucide-react';

export default function CreateSessionPage() {
  const router = useRouter();
  const { toasts, push, dismiss } = useToast();
  const { user } = useAuth();
  const { data: dashboard } = useTeacherDashboardQuery(user?.email);
  const { data: timetableSlots = [] } = useTeacherTimetableQuery(user?.email);

  const [subject, setSubject] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [section, setSection] = useState('');
  const [semester, setSemester] = useState('');
  const [room, setRoom] = useState('');
  const [duration, setDuration] = useState(60);
  const [qrRotation, setQrRotation] = useState(15);
  const [launchMode, setLaunchMode] = useState<'active' | 'ready' | 'scheduled'>('active');
  const [submitting, setSubmitting] = useState(false);

  const assignedSubjects = dashboard?.assigned_subjects ?? [];

  const applyTimetableSlot = (slotId: string) => {
    const found = timetableSlots.find((s: any) => s.id === slotId);
    if (!found) return;
    setSubject(found.subject || '');
    setSubjectCode(found.subject_code || '');
    setRoom(found.room || '');
    setSemester(found.semester || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      push('Teacher account email is required to start a session', 'error');
      return;
    }
    if (!subject.trim()) {
      push('Subject is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await teacherApi.startSession(
        user.email,
        subject.trim(),
        room.trim() || 'Main Hall',
        duration,
        {
          subject_code: subjectCode.trim() || undefined,
          section: section.trim() || undefined,
          semester: semester.trim() || undefined,
          qr_rotation_seconds: qrRotation,
          status: launchMode,
        }
      );
      push(res?.message || 'Session created successfully', 'success');
      router.push('/teacher/sessions');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start session. Please try again.';
      push(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="New Session"
        title="Start Attendance Session"
        subtitle="Launch a live or scheduled attendance session with configurable QR rotation and ArcFace biometric verification."
        backTo="/teacher/sessions"
        backLabel="Back to Sessions"
      />

      <Card className="page-enter max-w-2xl p-6">
        <CardHeader icon={<Play className="h-5 w-5 text-accent" />} title="Session Details" />
        <form onSubmit={handleSubmit} className="space-y-5">
          {timetableSlots.length > 0 && (
            <div>
              <label htmlFor="tt-preset" className="mb-1.5 block text-xs font-semibold text-mid">
                Quick Fill from Assigned Timetable
              </label>
              <select
                id="tt-preset"
                defaultValue=""
                onChange={(e) => applyTimetableSlot(e.target.value)}
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                <option value="">Select a scheduled lecture slot…</option>
                {timetableSlots.map((slot: any) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.day} · {slot.time} — {slot.subject} ({slot.room || 'TBA'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="subject" className="mb-1.5 block text-xs font-semibold text-mid">
              Subject / Course Name
            </label>
            <input
              id="subject"
              type="text"
              list="assigned-subjects"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Neural Networks & Deep Learning"
              required
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
            {assignedSubjects.length > 0 && (
              <datalist id="assigned-subjects">
                {assignedSubjects.map((sub) => (
                  <option key={sub} value={sub} />
                ))}
              </datalist>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="subjectCode" className="mb-1.5 block text-xs font-semibold text-mid">
                Subject Code
              </label>
              <input
                id="subjectCode"
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. CS601"
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="semester" className="mb-1.5 block text-xs font-semibold text-mid">
                Semester
              </label>
              <input
                id="semester"
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. 6"
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="section" className="mb-1.5 block text-xs font-semibold text-mid">
                Section
              </label>
              <input
                id="section"
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. A"
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="room" className="mb-1.5 block text-xs font-semibold text-mid">
              Room / Location
            </label>
            <input
              id="room"
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Lab 402"
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="duration" className="mb-1.5 block text-xs font-semibold text-mid">
                  Duration
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi focus:border-accent focus:outline-none"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>
              <div>
                <label htmlFor="qrRotation" className="mb-1.5 block text-xs font-semibold text-mid">
                  QR Rotation
                </label>
                <select
                  id="qrRotation"
                  value={qrRotation}
                  onChange={(e) => setQrRotation(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi focus:border-accent focus:outline-none"
                >
                  <option value={10}>10 seconds</option>
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>
              <div>
                <label htmlFor="launchMode" className="mb-1.5 block text-xs font-semibold text-mid">
                  Initial State
                </label>
                <select
                  id="launchMode"
                  value={launchMode}
                  onChange={(e) => setLaunchMode(e.target.value as 'active' | 'ready' | 'scheduled')}
                  className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi focus:border-accent focus:outline-none"
                >
                  <option value="active">Active (Live Now)</option>
                  <option value="ready">Ready to Start</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !user?.email || !subject.trim()}
                className="btn-pill-accent h-10 px-6 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                {submitting ? 'Creating…' : launchMode === 'active' ? 'Start Live Session' : 'Create Session'}
              </button>
              <Link
                href="/teacher/sessions"
                className="btn-pill-glass h-10 px-5 text-xs font-semibold flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Cancel
              </Link>
            </div>
        </form>
      </Card>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </DashboardLayout>
  );
}
