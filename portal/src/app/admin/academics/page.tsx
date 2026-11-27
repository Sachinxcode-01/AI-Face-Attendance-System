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
  const [sectionForm, setSectionForm] = useState({ course_id: '', name: '', semester: '1', academic_year: '2026-2027' });
  const [termForm, setTermForm] = useState({ name: '', academic_year: '2026-2027', status: 'active' });
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '' });
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any>(null);
  const [ttForm, setTtForm] = useState({ user_id: '', subject: '', day: 'Monday', time: '09:00-10:00', room: '', teacher_email: '' });

  const loadAll = useCallback(async () => {
    try {
      const [d, c, s, sem, h, tt] = await Promise.all([
        api.admin.departments.list(),
        api.admin.courses.list(),
        api.admin.sections.list(),
        api.admin.semesters.list(),
        api.admin.holidays.list(),
        api.admin.timetable.list().catch(() => ({ slots: [] })),
      ]);
      setDepartments(d?.departments || []);
      setCourses(c?.courses || []);
      setSections(s?.sections || []);
      setTerms(sem?.terms || []);
      setHolidays(h?.holidays || []);
      setTimetableSlots(tt?.slots || []);
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

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.admin.sections.create({ ...sectionForm, semester: Number(sectionForm.semester) });
      setSectionForm({ course_id: '', name: '', semester: '1', academic_year: '2026-2027' });
      setNotice('Section created.');
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to create section.'); }
  };

  const handleTermStatus = async (termId: string, status: 'active' | 'closed') => {
    setError('');
    try {
      await api.admin.semesters.updateStatus(termId, status);
      setNotice(`Academic term marked ${status}.`);
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to update term status.'); }
  };

  const handleCreateTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.admin.timetable.create(ttForm);
      setTtForm({ user_id: '', subject: '', day: 'Monday', time: '09:00-10:00', room: '', teacher_email: '' });
      setNotice('Timetable slot created.');
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to create timetable slot.'); }
  };

  const handleCheckConflicts = async () => {
    setError('');
    try {
      const res = await api.admin.timetable.conflicts();
      setConflicts(res);
    } catch (err: any) { setError(err?.message || 'Conflict check failed.'); }
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
            <div className="space-y-2 text-xs max-h-40 overflow-y-auto mb-4">
              {courses.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <span className="text-white font-semibold">{c.code} — {c.name}</span>
                  <Badge tone="neutral">{c.credits} cr</Badge>
                </div>
              ))}
            </div>
            <form onSubmit={handleCreateSection} className="flex flex-wrap gap-2 pt-3 border-t border-white/10 text-xs">
              <select required value={sectionForm.course_id} onChange={(e) => setSectionForm({ ...sectionForm, course_id: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-2.5 py-2 text-white">
                <option value="">Course...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
              <input required placeholder="Sec (A)" value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} className="w-20 rounded-xl border border-white/10 bg-[#08080c] px-2.5 py-2 text-white" />
              <input required type="number" min={1} max={12} placeholder="Sem" value={sectionForm.semester} onChange={(e) => setSectionForm({ ...sectionForm, semester: e.target.value })} className="w-16 rounded-xl border border-white/10 bg-[#08080c] px-2.5 py-2 text-white" />
              <Button type="submit">Add Section</Button>
            </form>
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
                <div key={t._id || i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                  <span className="text-white">{t.name} ({t.academic_year})</span>
                  <div className="flex items-center gap-2">
                    <Badge tone={t.status === 'active' ? 'success' : 'neutral'}>{t.status}</Badge>
                    {t._id && t.status !== 'active' && (
                      <button onClick={() => handleTermStatus(t._id, 'active')} className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">Activate</button>
                    )}
                    {t._id && t.status === 'active' && (
                      <button onClick={() => handleTermStatus(t._id, 'closed')} className="rounded bg-white/10 px-2 py-0.5 text-gray-300">Close</button>
                    )}
                  </div>
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

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="font-display text-sm font-bold text-white">Institutional Timetable &amp; Conflict Detection ({timetableSlots.length})</h3>
          <Button variant="secondary" onClick={handleCheckConflicts}>Detect Schedule Conflicts</Button>
        </div>
        {conflicts && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
            <p className="font-semibold text-white">
              Checked {conflicts.total_slots_checked} slot(s): {conflicts.conflicts_found} conflict(s) detected
            </p>
            {conflicts.room_conflicts?.map((rc: any, idx: number) => (
              <p key={`rc-${idx}`} className="text-amber-300 mt-1">Room {rc.room} double-booked on {rc.day} {rc.time}</p>
            ))}
            {conflicts.teacher_conflicts?.map((tc: any, idx: number) => (
              <p key={`tc-${idx}`} className="text-red-300 mt-1">Faculty {tc.teacher_email} double-booked on {tc.day} {tc.time}</p>
            ))}
          </div>
        )}
        <form onSubmit={handleCreateTimetableSlot} className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-4 text-xs">
          <input required placeholder="Class/Group (e.g. CSE-3-A)" value={ttForm.user_id} onChange={(e) => setTtForm({ ...ttForm, user_id: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input required placeholder="Subject" value={ttForm.subject} onChange={(e) => setTtForm({ ...ttForm, subject: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <select value={ttForm.day} onChange={(e) => setTtForm({ ...ttForm, day: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input required placeholder="09:00-10:00" value={ttForm.time} onChange={(e) => setTtForm({ ...ttForm, time: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input placeholder="Room" value={ttForm.room} onChange={(e) => setTtForm({ ...ttForm, room: e.target.value })} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <Button type="submit">Add Slot</Button>
        </form>
        <div className="space-y-2 text-xs max-h-56 overflow-y-auto">
          {timetableSlots.slice(0, 30).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
              <div>
                <span className="font-semibold text-white">{s.subject}</span> <span className="text-faint">• {s.user_id} • {s.day} {s.time} • {s.room || 'TBA'}</span>
              </div>
              <button onClick={() => api.admin.timetable.remove(s.id).then(loadAll).catch((e) => setError(e.message))} className="text-red-400 hover:text-red-300">Remove</button>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}
