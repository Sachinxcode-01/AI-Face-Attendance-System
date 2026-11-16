'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, MapPin, UserRound, QrCode, ScanFace } from 'lucide-react';
import Link from 'next/link';
import { MOCK_TIMETABLE } from '@/lib/demo-data';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export default function StudentTimetablePage() {
  const [day, setDay] = useState<(typeof DAYS)[number]>('Mon');
  const [view, setView] = useState<'day' | 'week'>('day');

  const daySlots = MOCK_TIMETABLE.filter((s) => s.day === day);

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Schedule"
        title="Class Timetable"
        subtitle="Dynamic lecture slots, room allocations, and live kiosk attendance check-in gateways."
        actions={
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
        }
      />

      {view === 'day' ? (
        <>
          <div className="page-enter mb-6 flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`chip-bytune text-xs h-8 px-4 ${day === d ? 'chip-bytune-active' : ''}`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="space-y-3.5">
            {daySlots.length > 0 ? (
              daySlots.map((slot) => (
                <Card
                  key={slot.id}
                  className={`page-enter flex flex-col gap-4 p-5 transition-all hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between ${
                    slot.status === 'live' ? 'border-emerald-500/40 bg-[#16161D]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[16px] bg-accent/15 text-accent border border-accent/25">
                      <Clock className="h-4 w-4" />
                      <span className="mt-0.5 font-mono text-[9.5px] font-bold">{slot.time.split(' ')[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-display text-sm font-semibold text-hi">{slot.subject}</h3>
                        {slot.status === 'live' && <Badge tone="success" pulse>Live now</Badge>}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-mid">
                        <UserRound className="h-3.5 w-3.5 text-faint" /> {slot.professor}
                        <span className="text-faint">·</span>
                        <MapPin className="h-3.5 w-3.5 text-faint" /> {slot.room}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-mid">{slot.time}</span>
                    {slot.status === 'live' ? (
                      <Link href="/student/checkin">
                        <Button className="h-8 text-xs px-3.5">
                          <ScanFace className="h-3.5 w-3.5" /> Check In
                        </Button>
                      </Link>
                    ) : (
                      <span className="font-mono text-[11px] uppercase tracking-wider text-faint">Upcoming</span>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="font-mono text-xs text-faint">No lectures scheduled for {day}. Enjoy your study block!</p>
              </Card>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((d) => {
            const slots = MOCK_TIMETABLE.filter((s) => s.day === d);
            return (
              <Card key={d} className="p-5">
                <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-accent font-semibold">{d}</h3>
                {slots.length === 0 ? (
                  <p className="text-xs text-faint font-mono">No lectures</p>
                ) : (
                  <ul className="space-y-2.5">
                    {slots.map((s) => (
                      <li key={s.id} className="rounded-[14px] border border-white/[0.06] bg-surface p-3 text-xs">
                        <p className="font-semibold text-hi">{s.subject}</p>
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
    </DashboardLayout>
  );
}
