'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, MapPin, UserRound, ScanFace, CalendarPlus, RefreshCw, AlertCircle, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import type { TimetableSlot } from '@/lib/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export default function StudentTimetablePage() {
  const todayShort = (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()] || 'Mon') as string;
  const initialDay = (DAYS.includes(todayShort as (typeof DAYS)[number]) ? todayShort : 'Mon') as (typeof DAYS)[number];

  const [day, setDay] = useState<(typeof DAYS)[number]>(initialDay);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [summaryMeta, setSummaryMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.academic.timetableSummary();
      setSummaryMeta(res);
      const list = Array.isArray(res?.slots) ? res.slots : [];
      setSlots(
        list.map((item: any, idx: number) => {
          const rawDay = String(item.day || 'Mon').slice(0, 3) as (typeof DAYS)[number];
          const validDay = DAYS.includes(rawDay) ? rawDay : 'Mon';
          return {
            id: item.id || `slot_${idx}`,
            day: validDay,
            day_full: item.day_full,
            time: item.time || 'TBA',
            subject: item.subject || 'Subject',
            subject_code: item.subject_code,
            professor: item.professor || 'Faculty',
            substitute_faculty: item.substitute_faculty,
            room: item.room || 'TBA',
            session_type: item.session_type || 'lecture',
            semester: item.semester,
            is_cancelled: Boolean(item.is_cancelled),
            cancellation_reason: item.cancellation_reason,
            rescheduled_to: item.rescheduled_to,
            minutes_until_start: item.minutes_until_start,
            status: item.status || 'upcoming',
          };
        })
      );
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Unable to load timetable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
          loadTimetable();
          const interval = setInterval(loadTimetable, 60000);
          return () => clearInterval(interval);
        }, [loadTimetable]);

const daySlots = slots.filter((s) => s.day === day);
const currentClass = summaryMeta?.current_class;
const nextClass = summaryMeta?.next_class;
const holidays: any[] = Array.isArray(summaryMeta?.holidays) ? summaryMeta.holidays : [];

return (
  <DashboardLayout>
    <PageHeader
      kicker="Schedule"
      title="Class Timetable"
      subtitle={
        summaryMeta
          ? `${summaryMeta.semester || 'Current Semester'} · ${summaryMeta.academic_year || ''} · ${summaryMeta.timezone || 'Local Time'}`
          : 'Dynamic lecture slots, room allocations, and live attendance check-in gateways.'
      }
      actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => api.academic.downloadTimetableIcs().catch(() => setError('Failed to export ICS file.'))}
              className="btn-pill-glass h-8 px-3 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarPlus className="h-3.5 w-3.5 text-accent" /> Export .ICS
            </button>
            <div className="flex gap-1.5 rounded-full bg-white/[0.03] p-1 border border-white/[0.08]">
              <button
                onClick={() => setView('day')}
                className={`chip-bytune text-xs h-7 px-3.5 ${view === 'day' ? 'chip-bytune-active' : ''}`}
              >
                Day View
              </button>
              <button
                onClick={() => setView('week')}
                className={`chip-bytune text-xs h-7 px-3.5 ${view === 'week' ? 'chip-bytune-active' : ''}`}
              >
                Week Grid
              </button>
            </div>
          </div>
        }
      />

            { error && (
              <Card className="mb-6 border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-center justify-between text-xs text-red-200">
                  <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-400" /> {error}</span>
                  <Button variant="secondary" onClick={loadTimetable} className="h-8 px-3 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </Button>
                </div>
              </Card>
            )}

          {/* Current & Next Class Banner */}
          {(currentClass || nextClass || summaryMeta?.is_today_holiday) && (
            <div className="page-enter mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Current Class</p>
                  <p className="mt-1 text-sm font-semibold text-hi">
                    {summaryMeta?.is_today_holiday
                      ? 'Institutional Holiday'
                      : currentClass
                        ? `${currentClass.subject} (${currentClass.room})`
                        : 'No class in progress right now'}
                  </p>
                </div>
                {currentClass && <Badge tone="success" pulse>Live Now</Badge>}
              </Card>
              <Card className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-faint">Next Class</p>
                  <p className="mt-1 text-sm font-semibold text-hi">
                    {nextClass
                      ? `${nextClass.subject} · ${nextClass.time}`
                      : 'No more classes scheduled today'}
                  </p>
                </div>
                {nextClass?.minutes_until_start != null && (
                  <Badge tone="info">In {nextClass.minutes_until_start} min</Badge>
                )}
              </Card>
            </div>
          )}

          {loading ? (
            <Card className="p-8 text-center font-mono text-xs text-faint">Loading dynamic timetable…</Card>
          ) : view === 'day' ? (
            <>
              <div className="page-enter mb-6 flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDay(d)}
                    className={`chip-bytune text-xs h-8 px-4 ${day === d ? 'chip-bytune-active' : ''}`}
                  >
                    {d}{d === initialDay ? ' (Today)' : ''}
                  </button>
                ))}
              </div>

              <div className="space-y-3.5">
                {daySlots.length > 0 ? (
                  daySlots.map((slot) => (
                    <Card
                      key={slot.id}
                      className={`page-enter flex flex-col gap-4 p-5 transition-all hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between ${slot.status === 'live' ? 'border-emerald-500/40 bg-[#16161D]' : slot.is_cancelled ? 'border-red-500/30 opacity-80' : ''
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[16px] bg-accent/15 text-accent border border-accent/25">
                          <Clock className="h-4 w-4" />
                          <span className="mt-0.5 font-mono text-[9.5px] font-bold">{slot.time.split(' ')[0]}</span>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-sm font-semibold text-hi">
                                {slot.subject}{slot.subject_code ? ` (${slot.subject_code})` : ''}
                              </h3>
                              {slot.session_type && slot.session_type !== 'lecture' && (
                                <Badge tone="purple">{slot.session_type}</Badge>
                              )}
                              {slot.status === 'live' && <Badge tone="success" pulse>Live now</Badge>}
                              {slot.is_cancelled && <Badge tone="danger">Cancelled</Badge>}
                            </div>
                              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-mid">
                                <UserRound className="h-3.5 w-3.5 text-faint" />
                                {slot.substitute_faculty ? `Sub: ${slot.substitute_faculty}` : slot.professor}
                                <span className="text-faint">·</span>
                                <MapPin className="h-3.5 w-3.5 text-faint" /> {slot.room}
                              </p>
                              {slot.is_cancelled && slot.cancellation_reason && (
                                <p className="mt-1 font-mono text-[11px] text-red-300">Note: {slot.cancellation_reason}</p>
                              )}
                              {slot.rescheduled_to && (
                                <p className="mt-1 font-mono text-[11px] text-amber-300">Rescheduled: {slot.rescheduled_to}</p>
                              )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-mid">{slot.time}</span>
                            {
                              slot.status === 'live' && !slot.is_cancelled ? (
                                <Link href="/student/checkin">
                                  <Button className="h-8 text-xs px-3.5">
                                    <ScanFace className="h-3.5 w-3.5" /> Check In
                                  </Button>
                                </Link>
                              ) : (
                      <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{slot.status}</span>
                              )
                            }
                  </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <p className="font-mono text-xs text-faint">No lectures scheduled for {day}.</p>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DAYS.map((d) => {
                const daySlotList = slots.filter((s) => s.day === d);
                return (
                  <Card key={d} className="p-5">
                    <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                      {d}{d === initialDay ? ' · Today' : ''}
                    </h3>
                    {daySlotList.length === 0 ? (
                      <p className="text-xs text-faint font-mono">No lectures</p>
                    ) : (
                      <ul className="space-y-2.5">
                        {daySlotList.map((s) => (
                          <li key={s.id} className="rounded-[14px] border border-white/[0.06] bg-surface p-3 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-hi">{s.subject}</p>
                              {s.is_cancelled && <Badge tone="danger">Cancelled</Badge>}
                            </div>
                            <p className="font-mono text-[10.5px] text-accent mt-0.5">{s.time}</p>
                            <p className="text-[11px] text-faint mt-0.5">{s.room} · {s.professor}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {holidays.length > 0 && (
            <Card className="page-enter mt-6 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-accent" />
                <h3 className="font-display text-sm font-bold text-hi">Academic Holidays & Calendar Exceptions</h3>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {holidays.slice(0, 6).map((h) => (
                  <div key={h.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                    <p className="font-semibold text-hi">{h.title}</p>
                    <p className="font-mono text-[10.5px] text-accent mt-0.5">{h.date}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </DashboardLayout>
  );
}
