'use client';

import { useQuery } from '@tanstack/react-query';
import { studentKeys } from '@/core/query/queryKeys';
import { studentAttendanceApi, type AttendanceHistoryFilters } from './attendance.api';
import type { AttendanceRecord } from '@/lib/types';

export function normalizeAttendanceStatus(rawStatusInput?: string, methodInput?: string): AttendanceRecord['status'] {
  const rawStatus = (rawStatusInput || 'Present').toLowerCase();
  const method = (methodInput || '').toLowerCase();
  if (rawStatus === 'absent') return 'absent';
  if (rawStatus === 'late') return 'late';
  if (rawStatus.includes('excused')) return 'excused';
  if (rawStatus.includes('medical')) return 'medical_leave';
  if (rawStatus.includes('approved')) return 'approved_leave';
  if (rawStatus.includes('pending')) return 'pending_verification';
  if (rawStatus.includes('cancelled')) return 'cancelled_session';
  if (rawStatus.includes('not recorded')) return 'not_recorded';
  if (method === 'face') return 'verified_face';
  if (method === 'qr') return 'verified_qr';
  if (method === 'manual') return 'manually_recorded';
  return 'present';
}

export function useStudentAttendanceQuery(email?: string | null, filters: AttendanceHistoryFilters = {}) {
  return useQuery({
    queryKey: studentKeys.attendance(email, filters as Record<string, string | number>),
    queryFn: ({ signal }) => studentAttendanceApi.getHistory(email!, filters, signal),
    enabled: Boolean(email),
    staleTime: 25_000,
    select: (histRes) => {
      const rawList = Array.isArray(histRes)
        ? histRes
        : Array.isArray(histRes?.records)
          ? histRes.records
          : Array.isArray(histRes?.logs)
            ? histRes.logs
            : [];

      const records: AttendanceRecord[] = rawList.map((r: any, i: number) => ({
        id: r.id || r._id || `att_${i}`,
        receipt_id: r.receipt_id,
        session_id: r.session_id,
        date: r.date || '—',
        time: r.time || '—',
        scheduled_time: r.scheduled_time,
        registration_time: r.registration_time,
        subject: r.subject || 'Class Session',
        subject_code: r.subject_code,
        faculty_name: r.faculty_name,
        status: normalizeAttendanceStatus(r.status, r.verified_by || r.verification_method),
        raw_status: r.status || 'Present',
        verified_by: r.verified_by,
        confidence: typeof r.confidence === 'number' ? r.confidence : null,
        room: r.room || 'Campus Room',
        correction_status: r.correction_status,
        correction_id: r.correction_id,
        remarks: r.remarks,
        semester: r.semester,
        updated_at: r.updated_at,
      }));

      return {
        records,
        allSubjects: Array.isArray(histRes?.all_subjects) ? (histRes.all_subjects as string[]) : [],
        allSemesters: Array.isArray(histRes?.all_semesters) ? (histRes.all_semesters as string[]) : [],
        summary: histRes?.summary || null,
      };
    },
  });
}

export function useStudentDisputesQuery(email?: string | null) {
  return useQuery({
    queryKey: studentKeys.disputes(email),
    queryFn: ({ signal }) => studentAttendanceApi.getDisputes(signal),
    enabled: Boolean(email),
    staleTime: 25_000,
    select: (res) => (Array.isArray(res?.disputes) ? res.disputes : []),
  });
}

export function useStudentHeatmapQuery(email?: string | null, days = 30) {
  return useQuery({
    queryKey: studentKeys.heatmap(email, days),
    queryFn: ({ signal }) => studentAttendanceApi.getHeatmap(days, signal),
    enabled: Boolean(email),
    staleTime: 30_000,
  });
}
