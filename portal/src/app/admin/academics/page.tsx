'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

export default function AdminAcademicsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [deptForm, setDeptForm] = useState({ name: '', code: '', hod_email: '' });
  const [courseForm, setCourseForm] = useState({ department_id: '', name: '', code: '', credits: '3' });
  const [termForm, setTermForm] = useState({ name: '', academic_year: '2026-2027', status: 'active' });
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '' });

  const loadAll = useCallback(async () => {
    try {
      const [d, c, s, sem, h] = await Promise.all([
        api.admin.departments.list(),
        api.admin.courses.list(),
        api.admin.sections.list(),
        api.admin.semesters.list(),
        api.admin.holidays.list(),
      ]);
      setDepartments(d?.departments || []);
      setCourses(c?.courses || []);
      setSections(s?.sections || []);
      setTerms(sem?.terms || []);
      setHolidays(h?.holidays || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load academic infrastructure.');
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.admin.departments.create(deptForm);
      setDeptForm({ name: '', code: '', hod_email: '' });
      setNotice('Department created.');
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to create department.'); }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.admin.courses.create({ ...courseForm, credits: Number(courseForm.credits) });
      setCourseForm({ department_id: '', name: '', code: '', credits: '3' });
      setNotice('Course created.');
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to create course.'); }
  };

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.admin.semesters.create(termForm);
      setTermForm({ name: '', academic_year: '2026-2027', status: 'active' });
      setNotice('Academic term saved.');
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to create term.'); }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.admin.holidays.create(holidayForm);
      setHolidayForm({ name: '', date: '' });
      setNotice('Holiday added.');
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to add holiday.'); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Academic Structure"
        title="Departments, Courses, Semesters & Calendar"
        subtitle="Configure institutional academic entities with referential integrity protection."
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{notice}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display text-sm font-bold text-white mb-3">Departments ({departments.length})</h3>
          <form onSubmit={handleCreateDept} className="flex flex-wrap gap-2 mb-4 text-xs">
            <input required placeholder="Name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="flex-1 rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <input required placeholder="Code" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} className="w-24 rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <Button type="submit">Add</Button>
          </form>
          <div className="space-y-2 text-xs">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <div><span className="font-semibold text-white">{d.name}</span> <span className="font-mono text-faint">({d.code})</span></div>
                <button onClick={() => api.admin.departments.remove(d.id).then(loadAll).catch((e) => setError(e.message))} className="text-red-400 hover:text-red-300">Delete</button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-sm font-bold text-white mb-3">Courses ({courses.length}) &amp; Sections ({sections.length})</h3>
          <form onSubmit={handleCreateCourse} className="flex flex-wrap gap-2 mb-4 text-xs">
            <select required value={courseForm.department_id} onChange={(e) => setCourseForm({ ...courseForm, department_id: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-2.5 py-2 text-white">
              <option value="">Dept...</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
            </select>
            <input required placeholder="Course Name" value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} className="flex-1 rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <input required placeholder="Code" value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} className="w-24 rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <Button type="submit">Add</Button>
          </form>
          <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
            {courses.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <span className="text-white font-semibold">{c.code} — {c.name}</span>
                <Badge tone="neutral">{c.credits} cr</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-sm font-bold text-white mb-3">Academic Semesters ({terms.length})</h3>
          <form onSubmit={handleCreateTerm} className="flex flex-wrap gap-2 mb-4 text-xs">
            <input required placeholder="Term (e.g. Even 2027)" value={termForm.name} onChange={(e) => setTermForm({ ...termForm, name: e.target.value })} className="flex-1 rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <input required placeholder="Year" value={termForm.academic_year} onChange={(e) => setTermForm({ ...termForm, academic_year: e.target.value })} className="w-28 rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <Button type="submit">Add Term</Button>
          </form>
          <div className="space-y-2 text-xs">
            {terms.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <span className="text-white">{t.name} ({t.academic_year})</span>
                <Badge tone={t.status === 'active' ? 'success' : 'neutral'}>{t.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-sm font-bold text-white mb-3">Academic Holidays ({holidays.length})</h3>
          <form onSubmit={handleCreateHoliday} className="flex flex-wrap gap-2 mb-4 text-xs">
            <input required placeholder="Holiday Name" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} className="flex-1 rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <input required type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <Button type="submit">Add</Button>
          </form>
          <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <span className="text-white">{h.name}</span>
                <span className="font-mono text-faint">{h.date ? new Date(h.date).toLocaleDateString() : ''}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
