'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { MapPin, UserRound, Clock } from 'lucide-react';
import { MOCK_TIMETABLE } from '@/lib/demo-data';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export default function StudentTimetablePage() {
  const [view, setView] = useState<'day' | 'week'>('day');
  const [day, setDay] = useState<(typeof DAYS)[number]>('Mon');

  const daySlots = MOCK_TIMETABLE.filter((t) => t.day === day);

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Schedule"
        title="Class Timetable"
        subtitle="Monday through Saturday, synced with the registrar."
        actions={
          <Tabs
            tabs={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
            ]}
            active={view}
            onChange={(v) => setView(v as 'day' | 'week')}
          />
        }
      />

      {view === 'day' ? (
        <>
          <div className="page-enter mb-6 grid grid-cols-6 gap-1 rounded-xl border border-white/5 bg-white/[0.04] p-1">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  day === d ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {daySlots.length > 0 ? (
              daySlots.map((slot, i) => (
                <Card key={slot.id} className={`page-enter flex flex-col gap-3 p-5 transition-all hover:border-indigo-500/30 sm:flex-row sm:items-center sm:justify-between ${slot.status === 'live' ? 'border-emerald-500/40' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                      <Clock className="h-4 w-4" />
                      <span className="mt-0.5 font-mono text-[9px] font-bold">{slot.time.split(' ')[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{slot.subject}</h3>
                        {slot.status === 'live' && <Badge tone="success" pulse>Live now</Badge>}
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                        <UserRound className="h-3 w-3" /> {slot.professor}
                        <span className="mx-1">•</span>
                        <MapPin className="h-3 w-3" /> {slot.room}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-gray-500">{slot.time}</span>
                </Card>
              ))
            ) : (
              <Card className="page-enter py-10 text-center text-xs text-gray-500">No lectures scheduled for {day}.</Card>
            )}
          </div>
        </>
      ) : (
        <div className="page-enter grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DAYS.map((d) => {
            const slots = MOCK_TIMETABLE.filter((t) => t.day === d);
            return (
              <Card key={d} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-white">{d === 'Sat' ? 'Saturday' : d + 'day'}</h3>
                  <Badge tone="neutral">{slots.length} slots</Badge>
                </div>
                <div className="space-y-2">
                  {slots.map((s) => (
                    <div key={s.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                      <p className="font-mono text-[10px] font-semibold text-indigo-400">{s.time}</p>
                      <p className="mt-0.5 text-xs font-semibold text-white">{s.subject}</p>
                      <p className="text-[10px] text-gray-500">{s.room}</p>
                    </div>
                  ))}
                  {slots.length === 0 && <p className="py-4 text-center text-[11px] text-gray-600">No classes</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
