'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentKeys } from '@/core/query/queryKeys';
import { studentLeaveApi } from './leave.api';
import type { LeaveRequest } from '@/lib/types';

function mapLeaveStatus(raw: string): LeaveRequest['status'] {
  const s = (raw || 'pending').toLowerCase().trim();
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'under review' || s === 'under_review') return 'under_review';
  if (s === 'clarification' || s === 'clarification requested') return 'clarification';
  if (s === 'withdrawn') return 'withdrawn';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'draft') return 'draft';
  return 'pending';
}

export function useStudentLeavesQuery(
  email?: string | null,
  studentMeta?: { name?: string; rollNo?: string; student_id?: string }
) {
  return useQuery({
    queryKey: studentKeys.leaves(email),
    queryFn: ({ signal }) => studentLeaveApi.list(email!, signal),
    enabled: Boolean(email),
    staleTime: 25_000,
    select: (data): LeaveRequest[] => {
      if (!Array.isArray(data)) return [];
      return data.map((l: any) => {
        const validStatus = mapLeaveStatus(l.status);
        const reasonMatch = String(l.reason || '').match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
        const category = (l.category || (reasonMatch ? reasonMatch[1] : 'Academic')) as LeaveRequest['category'];
        const cleanReason = reasonMatch ? reasonMatch[2] : (l.reason || '');
        return {
          id: l.id || l._id,
          studentName: studentMeta?.name || email || 'Student',
          rollNo: studentMeta?.rollNo || studentMeta?.student_id || '',
          reason: cleanReason,
          category,
          startDate: l.start_date ? String(l.start_date).split('T')[0] : '—',
          endDate: l.end_date ? String(l.end_date).split('T')[0] : '—',
          status: validStatus,
          rawStatus: l.status || 'Pending',
          remarks: l.remarks || undefined,
          reviewedBy: l.reviewed_by || undefined,
          reviewedAt: l.reviewed_at || undefined,
          documentUrl: l.document_url || undefined,
          documentName: l.document_name || undefined,
          statusHistory: Array.isArray(l.status_history) ? l.status_history : [],
          createdAt: l.created_at || undefined,
        };
      });
    },
  });
}

export function useApplyLeaveMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentLeaveApi.apply,
    onSuccess: () => {
      if (email) {
        qc.invalidateQueries({ queryKey: studentKeys.leaves(email) });
        qc.invalidateQueries({ queryKey: studentKeys.dashboard(email) });
      }
    },
  });
}

export function useWithdrawLeaveMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentLeaveApi.withdraw,
    onSuccess: () => {
      if (email) {
        qc.invalidateQueries({ queryKey: studentKeys.leaves(email) });
        qc.invalidateQueries({ queryKey: studentKeys.dashboard(email) });
      }
    },
  });
}

export function useUploadLeaveDocMutation() {
  return useMutation({
    mutationFn: studentLeaveApi.uploadDocument,
  });
}
