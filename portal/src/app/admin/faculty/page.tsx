'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { UserPlus, Link2, Unlink, Pencil } from 'lucide-react';

export default function AdminFacultyParentsPage() {
  const [tab, setTab] = useState<'faculty' | 'parents'>('faculty');
  const [faculty, setFaculty] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [facForm, setFacForm] = useState({ full_name: '', email: '', department: '', designation: 'Assistant Professor', employee_id: '' });
  const [editingFac, setEditingFac] = useState<any | null>(null);
  const [editFacForm, setEditFacForm] = useState({ full_name: '', department: '', designation: '', employee_id: '' });

  const [linkParentEmail, setLinkParentEmail] = useState('');
  const [linkStudentEmail, setLinkStudentEmail] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [facRes, parRes] = await Promise.all([
        api.admin.users({ role: 'teacher', limit: 50 }),
        api.admin.parents.list(),
      ]);
      setFaculty(facRes?.users || []);
      setParents(parRes?.parents || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load faculty and parents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createUser({ ...facForm, role: 'teacher' });
      setNotice(`Registered faculty ${facForm.full_name}.`);
      setShowAddFaculty(false);
      setFacForm({ full_name: '', email: '', department: '', designation: 'Assistant Professor', employee_id: '' });
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to register faculty.');
    }
  };

  const handleSaveFacEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFac) return;
    setError('');
    try {
      await api.admin.updateUser(editingFac.id, editFacForm);
      setNotice(`Updated faculty ${editFacForm.full_name}.`);
      setEditingFac(null);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update faculty.');
    }
  };

  const handleLinkParent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.parents.link(linkParentEmail, linkStudentEmail);
      setNotice(`Linked ${linkParentEmail} to ${linkStudentEmail}.`);
      setLinkParentEmail('');
      setLinkStudentEmail('');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to link parent.');
    }
  };

  const handleUnlink = async (pEmail: string, sEmail: string) => {
    try {
      await api.admin.parents.unlink(pEmail, sEmail);
      setNotice(`Unlinked ${pEmail} from ${sEmail}.`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to unlink.');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Institutional Directory"
        title="Faculty & Parent Administration"
        subtitle="Manage teaching staff, account statuses, and verified guardian-student relationships."
        actions={
          <Button onClick={() => setShowAddFaculty(true)}>
            <UserPlus className="h-4 w-4" /> Register Faculty
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{notice}</div>}

      <div className="mb-6 flex gap-2">
        <Button variant={tab === 'faculty' ? 'primary' : 'secondary'} onClick={() => setTab('faculty')}>Faculty ({faculty.length})</Button>
        <Button variant={tab === 'parents' ? 'primary' : 'secondary'} onClick={() => setTab('parents')}>Parents &amp; Guardians ({parents.length})</Button>
      </div>

      {tab === 'faculty' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-faint font-mono uppercase">
                  <th className="py-3 px-3">Faculty</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Designation</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-faint">Loading...</td></tr>
                ) : faculty.map((f) => (
                  <tr key={f.id}>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-white">{f.full_name}</p>
                      <p className="text-[11px] text-faint">{f.email}</p>
                    </td>
                    <td className="py-3 px-3">{f.department || '—'}</td>
                    <td className="py-3 px-3">{f.designation || 'Faculty'}</td>
                    <td className="py-3 px-3"><Badge tone={f.account_status === 'active' ? 'success' : 'danger'}>{f.account_status || 'active'}</Badge></td>
                      <td className="py-3 px-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingFac(f);
                            setEditFacForm({
                              full_name: f.full_name || '',
                              department: f.department || '',
                              designation: f.designation || '',
                              employee_id: f.employee_id || '',
                            });
                          }}
                          className="rounded bg-white/5 px-2 py-1 text-accent hover:bg-white/10"
                          title="Edit Faculty"
                        >
                          <Pencil className="h-3.5 w-3.5 inline" />
                        </button>
                        <button
                          onClick={() => api.admin.updateUserStatus(f.id, f.account_status === 'suspended' ? 'active' : 'suspended').then(loadData)}
                          className="rounded bg-white/5 px-2.5 py-1 text-gray-300 hover:bg-white/10"
                        >
                          {f.account_status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <h3 className="font-display text-sm font-bold text-white mb-3">Link Verified Guardian to Student</h3>
            <form onSubmit={handleLinkParent} className="flex flex-wrap gap-3 text-xs">
              <input required type="email" placeholder="Parent Email" value={linkParentEmail} onChange={(e) => setLinkParentEmail(e.target.value)} className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
              <input required type="email" placeholder="Student Email" value={linkStudentEmail} onChange={(e) => setLinkStudentEmail(e.target.value)} className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
              <Button type="submit"><Link2 className="h-4 w-4" /> Link Account</Button>
            </form>
          </Card>

          <Card>
            <div className="space-y-3 text-xs">
              {parents.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div>
                    <p className="font-semibold text-white">{p.full_name} <span className="text-faint font-normal">({p.email})</span></p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(p.children || []).map((c: string) => (
                        <span key={c} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-accent">
                          {c}
                          <button onClick={() => handleUnlink(p.email, c)} title="Revoke link" className="text-red-400 hover:text-red-300">
                            <Unlink className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <Badge tone={p.account_status === 'active' ? 'success' : 'danger'}>{p.account_status || 'active'}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal open={showAddFaculty} onClose={() => setShowAddFaculty(false)} title="Register Faculty Member">
        <form onSubmit={handleAddFaculty} className="space-y-3 text-xs">
          <input required placeholder="Full Name" value={facForm.full_name} onChange={(e) => setFacForm({ ...facForm, full_name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input required type="email" placeholder="Institutional Email" value={facForm.email} onChange={(e) => setFacForm({ ...facForm, email: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input placeholder="Department" value={facForm.department} onChange={(e) => setFacForm({ ...facForm, department: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input placeholder="Designation" value={facForm.designation} onChange={(e) => setFacForm({ ...facForm, designation: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input placeholder="Employee ID" value={facForm.employee_id} onChange={(e) => setFacForm({ ...facForm, employee_id: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowAddFaculty(false)}>Cancel</Button>
            <Button type="submit">Register</Button>
          </div>
        </form>
      </Modal>
      <Modal open={Boolean(editingFac)} onClose={() => setEditingFac(null)} title="Edit Faculty Member">
        <form onSubmit={handleSaveFacEdit} className="space-y-3 text-xs">
          <input required placeholder="Full Name" value={editFacForm.full_name} onChange={(e) => setEditFacForm({ ...editFacForm, full_name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input placeholder="Department" value={editFacForm.department} onChange={(e) => setEditFacForm({ ...editFacForm, department: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input placeholder="Designation" value={editFacForm.designation} onChange={(e) => setEditFacForm({ ...editFacForm, designation: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input placeholder="Employee ID" value={editFacForm.employee_id} onChange={(e) => setEditFacForm({ ...editFacForm, employee_id: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditingFac(null)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
