'use client';

import { useQuery } from '@tanstack/react-query';
import { studentKeys } from '@/core/query/queryKeys';
import { studentTimetableApi } from './timetable.api';
import type { TimetableSlot } from '@/lib/types';

export const TIMETABLE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function useStudentTimetableQuery(email?: string | null) {
  return useQuery({
    queryKey: studentKeys.timetable(email),
    queryFn: ({ signal }) => studentTimetableApi.getSummary(signal),
    enabled: Boolean(email),
    staleTime: 30_000,
    refetchInterval: 60_000,
    select: (res) => {
      const list = Array.isArray(res?.slots) ? res.slots : [];
      const slots: TimetableSlot[] = list.map((item: any, idx: number) => {
        const rawDay = String(item.day || 'Mon').slice(0, 3) as (typeof TIMETABLE_DAYS)[number];
        const validDay = TIMETABLE_DAYS.includes(rawDay) ? rawDay : 'Mon';
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
      });
      return { meta: res, slots };
    },
  });
}
