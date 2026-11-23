'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { ChevronLeft, CalendarDays, RefreshCw, Plus, Pencil, Trash2, Clock, MapPin } from 'lucide-react';

interface TimetableSlot {
  id: string;
  user_id: string;
  subject: string;
  day: string;
  time: string;
  room: string;
  teacher_email: string;
  created_at: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EMPTY_FORM = { subject: '', day: 'Monday', time: '', room: '' };

export default function TeacherTimetablePage() {
  const { toasts, push, dismiss } = useToast();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimetableSlot | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const reqGenRef = React.useRef(0);
  const saveGenRef = React.useRef(0);

  const load = useCallback(async () => {
    reqGenRef.current += 1;
    const currentGen = reqGenRef.current;
    setLoading(true);
    try {
      const data = await api.teacher.timetable.list();
      if (currentGen === reqGenRef.current) {
        setSlots((data as TimetableSlot[]) || []);
      }
    } catch {
      if (currentGen === reqGenRef.current) {
        push('Failed to load timetable', 'error');
      }
    } finally {
      if (currentGen === reqGenRef.current) {
        setLoading(false);
      }
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    if (saving) return;
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (slot: TimetableSlot) => {
    if (saving) return;
    setEditing(slot);
    setForm({ subject: slot.subject, day: slot.day, time: slot.time, room: slot.room });
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.time.trim()) {
      push('Subject and time are required', 'error');
      return;
    }
    saveGenRef.current += 1;
    const currentSaveGen = saveGenRef.current;
    setSaving(true);
    try {
      if (editing) {
        await api.teacher.timetable.update(editing.id, form as unknown as Record<string, string>);
        push('Timetable slot updated', 'success');
      } else {
        await api.teacher.timetable.create(form as unknown as Record<string, string>);
        push('Timetable slot created', 'success');
      }
      if (currentSaveGen === saveGenRef.current) {
        setModalOpen(false);
      }
      await load();
    } catch {
      push('Failed to save slot', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await api.teacher.timetable.remove(id);
      push('Slot deleted', 'success');
      await load();
    } catch {
      push('Failed to delete slot', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Schedule"
        title="My Timetable"
        subtitle="Manage your weekly teaching slots. Create, edit, or remove classes with day and time labels."
        backTo="/teacher"
        backLabel="Back to Dashboard"
        actions={
          <div className="flex items-center gap-2.5">
            <button onClick={load} className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button onClick={openCreate} disabled={saving} className="h-9 px-4 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" /> Add Slot
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <Card className="page-enter p-6">
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="No timetable slots yet"
            body="Add your first teaching slot to build your weekly schedule."
            action={
              <Button onClick={openCreate} className="mt-4 h-9 px-4 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" /> Add Slot
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot, idx) => (
            <Card key={slot.id} className="page-enter p-5" >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <Badge tone="purple">{slot.day}</Badge>
                    <p className="mt-1.5 font-display text-sm font-semibold text-hi">{slot.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(slot)}
                    className="rounded-full p-1.5 text-faint transition-colors hover:bg-white/5 hover:text-white"
                    aria-label="Edit slot"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(slot.id)}
                    disabled={deleting === slot.id}
                    className="rounded-full p-1.5 text-faint transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                    aria-label="Delete slot"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 font-mono text-[11px] text-mid">
                <p className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-accent" /> {slot.time}
                </p>
                {slot.room && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-accent2" /> {slot.room}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Timetable Slot' : 'Add Timetable Slot'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label htmlFor="tt-subject" className="mb-1.5 block text-xs font-semibold text-mid">Subject</label>
            <input
              id="tt-subject"
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Neural Networks & Deep Learning"
              required
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tt-day" className="mb-1.5 block text-xs font-semibold text-mid">Day</label>
              <select
                id="tt-day"
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tt-time" className="mb-1.5 block text-xs font-semibold text-mid">Time</label>
              <input
                id="tt-time"
                type="text"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                placeholder="09:00 AM - 10:30 AM"
                required
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          </div>
          <div>
            <label htmlFor="tt-room" className="mb-1.5 block text-xs font-semibold text-mid">Room</label>
            <input
              id="tt-room"
              type="text"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              placeholder="e.g. Lab 402"
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={saving} className="h-9 px-5 text-xs font-semibold">
              {editing ? 'Save Changes' : 'Create Slot'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="h-9 px-4 text-xs">
              <ChevronLeft className="h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </DashboardLayout>
  );
}