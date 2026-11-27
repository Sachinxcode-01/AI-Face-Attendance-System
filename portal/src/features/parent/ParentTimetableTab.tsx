'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Bell, Clock } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  wardEmail: string;
  announcements: any[];
}

export function ParentTimetableTab({ wardEmail, announcements }: Props) {
  const [timetable, setTimetable] = useState<{ timezone?: string; semester?: string; slots: any[]; holidays: any[] }>({
    slots: [],
    holidays: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wardEmail) return;
    const ctrl = new AbortController();
    setLoading(true);
    api.parent.childTimetable(wardEmail, ctrl.signal)
      .then((res) => {
        if (!ctrl.signal.aborted && res) {
          setTimetable({
            timezone: res.timezone,
            semester: res.semester,
            slots: Array.isArray(res.slots) ? res.slots : [],
            holidays: Array.isArray(res.holidays) ? res.holidays : [],
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [wardEmail]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 rounded-[22px] card-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-hi flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            <span>Academic Timetable ({timetable.semester || 'Current Semester'})</span>
          </h3>
          {timetable.timezone && <span className="text-[11px] text-faint font-mono">{timetable.timezone}</span>}
        </div>

        {loading ? (
          <p className="text-xs text-mid">Loading academic schedule...</p>
        ) : timetable.slots.length === 0 ? (
          <p className="text-xs text-faint">No timetable slots published for this ward yet.</p>
        ) : (
          <div className="space-y-4">
            {days.map((day) => {
              const daySlots = timetable.slots.filter((s) => String(s.day || '').toLowerCase().startsWith(day.slice(0, 3).toLowerCase()));
              if (daySlots.length === 0) return null;
              return (
                <div key={day} className="space-y-2">
                  <p className="text-xs font-bold text-amber uppercase tracking-wider">{day}</p>
                  {daySlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between rounded-[16px] bg-white/[0.02] border border-white/5 p-3">
                      <div>
                        <p className="text-xs font-bold text-hi">
                          {slot.subject} {slot.subject_code ? `(${slot.subject_code})` : ''}
                        </p>
                        <p className="text-[11px] text-mid">
                          {slot.time} • {slot.room || 'TBA'} • {slot.session_type}
                        </p>
                        {slot.is_cancelled && (
                          <p className="text-[11px] text-red-300 mt-0.5">
                            Cancelled{slot.cancellation_reason ? `: ${slot.cancellation_reason}` : ''}
                            {slot.rescheduled_to ? ` • Rescheduled: ${slot.rescheduled_to}` : ''}
                          </p>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        slot.is_cancelled ? 'bg-red-500/15 text-red-300' : 'bg-white/5 text-mid'
                      }`}>
                        {slot.is_cancelled ? 'Cancelled' : 'Scheduled'}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-[22px] card-surface p-6">
          <h3 className="font-display text-base font-bold text-hi mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber" />
            <span>Institutional Announcements</span>
          </h3>
          {announcements.length === 0 ? (
            <p className="text-xs text-faint">No active institutional announcements.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a: any) => (
                <div key={a.id} className="rounded-[16px] bg-white/[0.02] border border-white/5 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-hi">{a.title}</h4>
                    <span className="text-[10px] font-mono text-amber uppercase">{a.priority}</span>
                  </div>
                  <p className="text-xs text-mid mt-1">{a.message}</p>
                  <p className="text-[10px] text-faint mt-1.5">
                    {a.author_name} • {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[22px] card-surface p-6">
          <h3 className="font-display text-base font-bold text-hi mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-spotify" />
            <span>Upcoming Institutional Holidays</span>
          </h3>
          {timetable.holidays.length === 0 ? (
            <p className="text-xs text-faint">No upcoming holidays recorded.</p>
          ) : (
            <div className="space-y-2">
              {timetable.holidays.slice(0, 6).map((h: any) => (
                <div key={h.id} className="flex items-center justify-between rounded-[14px] bg-white/[0.02] border border-white/5 px-3 py-2 text-xs">
                  <span className="text-hi font-semibold">{h.name}</span>
                  <span className="text-mid font-mono">{h.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
