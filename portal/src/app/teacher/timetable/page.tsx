'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherTimetableQuery } from '@/features/teacher/teacher.queries';
import { teacherApi } from '@/features/teacher/teacher.api';
import { queryClient } from '@/core/query/queryClient';
import { teacherKeys } from '@/core/query/queryKeys';
import {
  Plus, Trash2, Pencil, Clock, MapPin, Calendar, Download,
  Play, AlertTriangle, CalendarOff, UserCheck,
} from 'lucide-react';

interface Slot {
  id: string;
  day: string;
  time: string;
  subject: string;
  subject_code?: string;
  room: string;
  class_key?: string;
  semester?: string;
  section?: string;
  session_type?: string;
  substitute_faculty?: string;
  is_cancelled?: boolean;
  cancellation_reason?: string;
  rescheduled_to?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SESSION_TYPES = ['lecture', 'lab', 'practical', 'special', 'exam'];

const EMPTY_FORM = {
  day: 'Monday',
  time: '09:00 AM',
  subject: '',
  subject_code: '',
  room: '',
  class_key: '',
  semester: '',
  section: '',
  session_type: 'lecture',
  substitute_faculty: '',
  is_cancelled: false,
  cancellation_reason: '',
  rescheduled_to: '',
};

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const [viewTab, setViewTab] = useState<'weekly' | 'today' | 'holidays'>('weekly');

  const { data: slots = [], isLoading, isFetching, error, refetch } = useTeacherTimetableQuery(user?.email);

  const [conflicts, setConflicts] = useState<{ conflicts_found?: number; room_conflicts?: unknown[]; teacher_conflicts?: unknown[] } | null>(null);
  const [holidays, setHolidays] = useState<Array<{ date: string; name: string; type?: string }>>([]);
  const [extrasLoaded, setExtrasLoaded] = useState(false);

  React.useEffect(() => {
    if (!user?.email || extrasLoaded) return;
    setExtrasLoaded(true);
    Promise.allSettled([teacherApi.getTimetableConflicts(), teacherApi.getHolidays()]).then(([cRes, hRes]) => {
      if (cRes.status === 'fulfilled') setConflicts(cRes.value as typeof conflicts);
      if (hRes.status === 'fulfilled') {
        const hv = hRes.value as { holidays?: Array<{ date: string; name: string; type?: string }> };
        setHolidays(hv?.holidays ?? []);
      }
    });
  }, [user?.email, extrasLoaded]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const todayName = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    []
  );
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayHoliday = holidays.find((h) => h.date === todayIso);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, day: DAYS.includes(todayName) ? todayName : 'Monday' });
    setModalOpen(true);
  };

    const openEdit = (s: Slot) => {
      setEditing(s);
      setForm({
        day: s.day,
        time: s.time,
        subject: s.subject,
        subject_code: s.subject_code || '',
        room: s.room,
        class_key: s.class_key || '',
        semester: s.semester || '',
        section: s.section || '',
        session_type: s.session_type || 'lecture',
        substitute_faculty: s.substitute_faculty || '',
        is_cancelled: Boolean(s.is_cancelled),
        cancellation_reason: s.cancellation_reason || '',
        rescheduled_to: s.rescheduled_to || '',
      });
      setModalOpen(true);
    };

      const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
          const payload = {
            ...form,
            subject: form.subject.trim(),
            room: form.room.trim(),
            time: form.time.trim(),
          };
          if (editing) {
            await teacherApi.updateTimetableSlot(editing.id, payload);
            push('Timetable slot updated', 'success');
          } else {
            await teacherApi.createTimetableSlot(payload);
            push('Timetable slot added', 'success');
          }
            setModalOpen(false);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: teacherKeys.timetable(user?.email) }),
              queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard(user?.email) }),
            ]);
            try {
              setConflicts(await teacherApi.getTimetableConflicts());
            } catch {
              // ignore secondary conflict check error
            }
          } catch (err) {
            push(err instanceof Error ? err.message : 'Save failed', 'error');
          } finally {
            setSaving(false);
          }
        };

          const handleDelete = async (id: string) => {
            try {
              await teacherApi.deleteTimetableSlot(id);
              push('Slot deleted', 'info');
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: teacherKeys.timetable(user?.email) }),
                queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard(user?.email) }),
              ]);
            } catch (err) {
              push(err instanceof Error ? err.message : 'Delete failed', 'error');
            }
          };

          const handleExportIcs = async () => {
            try {
              await teacherApi.downloadTimetableIcs();
              push('Timetable .ics calendar downloaded', 'success');
            } catch (err) {
              push(err instanceof Error ? err.message : 'Failed to export calendar', 'error');
            }
          };

          const visibleDays = viewTab === 'today' ? [todayName] : DAYS;
          const typedSlots = slots as Slot[];

          return (
            <DashboardLayout>
              <Toasts toasts={toasts} dismiss={dismiss} />
              <PageHeader
                kicker="Schedule & Substitutions"
                title="Teaching Timetable"
                subtitle="Manage lectures, labs, rooms, substitute faculty, cancellations, and launch sessions in one click."
                actions={
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" onClick={handleExportIcs}>
                          <Download className="h-3.5 w-3.5" /> Export .ICS
                        </Button>
                        <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
                          Refresh
                        </Button>
                        <Button onClick={openCreate}>
                          <Plus className="h-4 w-4" /> Add Slot
                        </Button>
                      </div>
        }
      />

                          {error && (
                            <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                              <span>{error instanceof Error ? error.message : 'Unable to load timetable'}</span>
                              <button onClick={() => refetch()} className="underline hover:text-white">Retry</button>
                            </div>
      )}

                          {(conflicts?.conflicts_found ?? 0) > 0 && (
                            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>
                                Detected <strong>{conflicts?.conflicts_found}</strong> scheduling/room overlap(s) across the timetable. Review overlapping slots below.
                              </span>
                            </div>
                          )}

                          {todayHoliday && (
                            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-xs text-sky-200">
                              <CalendarOff className="h-4 w-4 shrink-0" />
                              <span>Institutional Holiday Today: <strong>{todayHoliday.name}</strong> ({todayHoliday.date})</span>
                            </div>
                          )}

                          <div className="mb-6">
                            <Tabs
                              active={viewTab}
                              onChange={(k) => setViewTab(k)}
                              tabs={[
                                { value: 'weekly', label: `Weekly Schedule (${typedSlots.length})` },
                                { value: 'today', label: `Today (${todayName} • ${typedSlots.filter((s) => s.day.toLowerCase() === todayName.toLowerCase()).length})` },
                                { value: 'holidays', label: `Academic Holidays (${holidays.length})` },
                              ]}
                            />
                          </div>

                          {isLoading ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                          ) : viewTab === 'holidays' ? (
                            holidays.length === 0 ? (
                              <EmptyState icon={<Calendar className="h-6 w-6" />} title="No holidays listed" body="Institutional calendar holidays will appear here." />
                            ) : (
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {holidays.map((h, i) => (
                                  <Card key={`${h.date}-${i}`}>
                                    <div className="flex items-center justify-between">
                                      <p className="font-display text-sm font-bold text-hi">{h.name}</p>
                                      <Badge tone="info">{h.type || 'Holiday'}</Badge>
                                    </div>
                                    <p className="mt-1 font-mono text-xs text-mid">{h.date}</p>
                                  </Card>
                                ))}
                              </div>
                            )
                          ) : typedSlots.length === 0 ? (
                            <EmptyState
                              icon={<Calendar className="h-6 w-6" />}
                              title="No teaching slots scheduled"
                              body="Add lectures, labs, or special sessions to build your weekly calendar."
                              action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Slot</Button>}
                            />
                          ) : (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                          {visibleDays.map((day) => {
                                            const daySlots = typedSlots.filter((s) => s.day.toLowerCase() === day.toLowerCase());
                                            return (
              <Card key={day}>
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="flex items-center gap-2 font-display text-sm font-bold text-hi">
                    <Calendar className="h-4 w-4 text-accent" />
                    {day}
                    {day.toLowerCase() === todayName.toLowerCase() && <Badge tone="info">Today</Badge>}
                  </span>
                  <span className="text-[11px] text-faint">{daySlots.length} class(es)</span>
                </div>

                {daySlots.length === 0 ? (
                  <p className="py-6 text-center text-xs text-faint">No classes scheduled</p>
                ) : (
                  <div className="space-y-2.5">
                    {daySlots.map((s) => (
                      <div
                        key={s.id}
                        className={`rounded-xl border p-3 transition ${
                          s.is_cancelled
                            ? 'border-red-500/25 bg-red-500/[0.04] opacity-80'
                            : 'border-white/10 bg-white/[0.03] hover:border-accent/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className={`text-sm font-semibold ${s.is_cancelled ? 'line-through text-mid' : 'text-hi'}`}>
                                {s.subject}
                              </p>
                              {s.session_type && <Badge tone="neutral">{s.session_type}</Badge>}
                              {s.is_cancelled && <Badge tone="danger">Cancelled</Badge>}
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-mid">
                              <Clock className="h-3 w-3 text-accent" /> {s.time}
                              {s.rescheduled_to ? ` → ${s.rescheduled_to}` : ''}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-faint">
                              <MapPin className="h-3 w-3" /> {s.room}
                              {(s.class_key || s.section || s.semester) &&
                                ` • ${[s.class_key, s.semester ? `Sem ${s.semester}` : null, s.section ? `Sec ${s.section}` : null].filter(Boolean).join(' ')}`}
                            </p>
                            {s.substitute_faculty && (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-sky-300">
                                <UserCheck className="h-3 w-3" /> Sub: {s.substitute_faculty}
                              </p>
                            )}
                            {s.is_cancelled && s.cancellation_reason && (
                              <p className="mt-1 text-[11px] text-red-300">{s.cancellation_reason}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button onClick={() => openEdit(s)} className="rounded-full p-1 text-mid hover:text-hi" title="Edit slot">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="rounded-full p-1 text-mid hover:text-red-400" title="Delete slot">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {!s.is_cancelled && (
                          <div className="mt-2.5 flex justify-end border-t border-white/5 pt-2">
                            <Link
                              href={`/teacher/sessions/create?subject=${encodeURIComponent(s.subject)}&room=${encodeURIComponent(s.room)}${s.section ? `&section=${encodeURIComponent(s.section)}` : ''}`}
                              className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-semibold text-accent hover:bg-accent/25"
                            >
                              <Play className="h-2.5 w-2.5" /> Start Session
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                                          )}
                                    </Card>
                                    );
          })}
                                  </div>
      )}

                                        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Timetable Slot' : 'Add Timetable Slot'} wide>
                                          <form onSubmit={handleSave} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                              <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-mid">Day</label>
                                                <select
                                                  value={form.day}
                                                  onChange={(e) => setForm({ ...form, day: e.target.value })}
                                                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                                >
                                                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                              </div>
                                              <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-mid">Time Slot</label>
                                                <input
                                                  value={form.time}
                                                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                                                  placeholder="09:00 AM - 10:00 AM"
                                                  required
                                                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                                />
                                              </div>
                                              <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-mid">Session Type</label>
                                                <select
                                                  value={form.session_type}
                                                  onChange={(e) => setForm({ ...form, session_type: e.target.value })}
                                                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                                >
                                                  {SESSION_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                                </select>
                                              </div>
                                            </div>

                                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                <div className="sm:col-span-2">
                                                  <label className="mb-1.5 block text-xs font-semibold text-mid">Subject</label>
                                                  <input
                                                    value={form.subject}
                                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                                    placeholder="CS301 • Algorithms"
                                                    required
                                                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="mb-1.5 block text-xs font-semibold text-mid">Subject Code</label>
                                                  <input
                                                    value={form.subject_code}
                                                    onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                                                    placeholder="CS301"
                                                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                                  />
                                                </div>
                                              </div>

                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                                  <div className="sm:col-span-2">
                                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Room / Lab</label>
                                                    <input
                                                      value={form.room}
                                                      onChange={(e) => setForm({ ...form, room: e.target.value })}
                                                      placeholder="Room 402"
                                                      required
                                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Semester</label>
                                                    <input
                                                      value={form.semester}
                                                      onChange={(e) => setForm({ ...form, semester: e.target.value })}
                                                      placeholder="5"
                                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Section</label>
                                                    <input
                                                      value={form.section}
                                                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                                                      placeholder="A"
                                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                                    />
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                  <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Substitute Faculty (Optional)</label>
                                                    <input
                                                      value={form.substitute_faculty}
                                                      onChange={(e) => setForm({ ...form, substitute_faculty: e.target.value })}
                                                      placeholder="Prof. Name / Email"
                                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Rescheduled To (Optional)</label>
                                                    <input
                                                      value={form.rescheduled_to}
                                                      onChange={(e) => setForm({ ...form, rescheduled_to: e.target.value })}
                                                      placeholder="Fri 03:00 PM / Room 105"
                                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                                    />
                                                  </div>
                                                </div>

                                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                                                  <label className="flex items-center gap-2 text-xs font-semibold text-mid">
                                                    <input
                                                      type="checkbox"
                                                      checked={form.is_cancelled}
                                                      onChange={(e) => setForm({ ...form, is_cancelled: e.target.checked })}
                                                    />
                                                    Mark lecture as cancelled
                                                  </label>
                                                  {form.is_cancelled && (
                                                    <input
                                                      value={form.cancellation_reason}
                                                      onChange={(e) => setForm({ ...form, cancellation_reason: e.target.value })}
                                                      placeholder="Cancellation reason (shared with students)"
                                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                                                    />
                                                  )}
                                                </div>

                                                <div className="flex justify-end gap-2 pt-2">
                                                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                                                  <Button type="submit" loading={saving}>{editing ? 'Update Slot' : 'Create Slot'}</Button>
                                                </div>
                                              </form>
                                            </Modal>
                                          </DashboardLayout>
                                          );
}