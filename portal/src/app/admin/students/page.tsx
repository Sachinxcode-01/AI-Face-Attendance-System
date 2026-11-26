'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { UserPlus, Upload, Download, Search, ShieldCheck, ShieldOff, ArrowUpRight } from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', student_id: '', department: '', course: '', semester: '1', section: 'A', phone: '' });

  const [showBulk, setShowBulk] = useState(false);
  const [csvText, setCsvText] = useState('email,full_name,student_id,department,semester,section\n');
  const [preview, setPreview] = useState<any>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [promoSemester, setPromoSemester] = useState('');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { role: 'student', limit: 50 };
      if (search.trim()) params.q = search.trim();
      if (statusFilter !== 'all') params.account_status = statusFilter;
      const res = await api.admin.users(params);
      setStudents(res?.users || []);
      setTotal(res?.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.admin.createUser({ ...form, role: 'student' });
      setNotice(`Registered student ${form.full_name}.`);
      setShowAdd(false);
      setForm({ full_name: '', email: '', student_id: '', department: '', course: '', semester: '1', section: 'A', phone: '' });
      loadStudents();
    } catch (err: any) {
      setError(err?.message || 'Failed to register student.');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.admin.updateUserStatus(id, status);
      setNotice(`Student account marked ${status}.`);
      loadStudents();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status.');
    }
  };

  const parseCsvRows = () => {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
      return obj;
    });
  };

  const handleBulkPreview = async () => {
    setError('');
    try {
      const rows = parseCsvRows();
      const res = await api.admin.bulkPreview(rows, 'student');
      setPreview(res);
    } catch (err: any) {
      setError(err?.message || 'Bulk preview failed.');
    }
  };

  const handleBulkCommit = async () => {
    setError('');
    try {
      const rows = parseCsvRows();
      const res = await api.admin.bulkImport(rows, 'student');
      setNotice(res?.message || 'Bulk import completed.');
      setShowBulk(false);
      setPreview(null);
      loadStudents();
    } catch (err: any) {
      setError(err?.message || 'Bulk import failed.');
    }
  };

  const handlePromoteSelected = async () => {
    if (!selectedIds.length || !promoSemester.trim()) return;
    try {
      const res = await api.admin.promoteStudents({ student_ids: selectedIds, target_semester: promoSemester.trim() });
      setNotice(`Promoted ${res.modified_count} student(s) to semester ${promoSemester}.`);
      setSelectedIds([]);
      setPromoSemester('');
      loadStudents();
    } catch (err: any) {
      setError(err?.message || 'Promotion failed.');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Institutional Registry"
        title="Student Management"
        subtitle={`Managing ${total} enrolled student records with tenant isolation and audit logging.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => api.admin.exportStudentsCsv()}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="secondary" onClick={() => setShowBulk(true)}>
              <Upload className="h-4 w-4" /> Bulk Import
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <UserPlus className="h-4 w-4" /> Register Student
            </Button>
          </>
        }
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{notice}</div>}

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, USN, or roll number..."
              className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-xs text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-xs text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                value={promoSemester}
                onChange={(e) => setPromoSemester(e.target.value)}
                placeholder="Target Sem"
                className="w-24 rounded-xl border border-white/10 bg-[#08080c] px-2.5 py-1.5 text-xs text-white"
              />
              <Button onClick={handlePromoteSelected}>
                <ArrowUpRight className="h-3.5 w-3.5" /> Promote ({selectedIds.length})
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-faint font-mono uppercase">
                <th className="py-3 px-2">Sel</th>
                <th className="py-3 px-3">Student</th>
                <th className="py-3 px-3">ID / USN</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Sem / Sec</th>
                <th className="py-3 px-3">Biometric</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-faint">Loading students...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-faint">No students found.</td></tr>
              ) : students.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id))}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-white">{s.full_name}</p>
                    <p className="text-[11px] text-faint">{s.email}</p>
                  </td>
                  <td className="py-3 px-3 font-mono text-white">{s.student_id || '—'}</td>
                  <td className="py-3 px-3">{s.department || '—'}</td>
                  <td className="py-3 px-3">Sem {s.semester || '—'} / {s.section || '—'}</td>
                  <td className="py-3 px-3">
                    <Badge tone={s.biometric_registered ? 'success' : 'warning'}>
                      {s.biometric_registered ? 'Enrolled' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">
                    <Badge tone={s.account_status === 'active' ? 'success' : s.account_status === 'suspended' ? 'danger' : 'neutral'}>
                      {s.account_status || 'active'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
                    {s.account_status !== 'suspended' ? (
                      <button onClick={() => handleStatusChange(s.id, 'suspended')} className="rounded bg-amber-500/10 px-2 py-1 text-amber-300 hover:bg-amber-500/20" title="Suspend">
                        <ShieldOff className="h-3.5 w-3.5 inline" />
                      </button>
                    ) : (
                      <button onClick={() => handleStatusChange(s.id, 'active')} className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-300 hover:bg-emerald-500/20" title="Activate">
                        <ShieldCheck className="h-3.5 w-3.5 inline" />
                      </button>
                    )}
                    <button onClick={() => handleStatusChange(s.id, 'archived')} className="rounded bg-white/5 px-2 py-1 text-gray-300 hover:bg-white/10">
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Register New Student">
        <form onSubmit={handleRegister} className="space-y-3 text-xs">
          <input required placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input required type="email" placeholder="Institutional Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="USN / Reg No" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <input placeholder="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <input placeholder="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          </div>
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Register</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showBulk} onClose={() => setShowBulk(false)} title="Bulk Student CSV Import" wide>
        <div className="space-y-3 text-xs">
          <textarea
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#08080c] p-3 font-mono text-white"
          />
          {preview && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
              <p className="font-semibold text-white">Preview: {preview.valid_count} valid, {preview.error_count} errors</p>
              {preview.errors?.slice(0, 5).map((err: any, i: number) => (
                <p key={i} className="text-red-300">Row {err.row} ({err.email || 'empty'}): {err.reason}</p>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleBulkPreview}>Validate &amp; Preview</Button>
            <Button onClick={handleBulkCommit} disabled={!preview || preview.valid_count === 0}>Execute Import</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
