'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

export default function AdminCommunicationsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annForm, setAnnForm] = useState({ title: '', body: '', target_role: 'all', priority: 'normal' });
  const [bcForm, setBcForm] = useState({ title: '', message: '', target_role: 'all', priority: 'Normal' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const res = await api.admin.announcements.list();
      setAnnouncements(res?.announcements || []);
    } catch (err: any) { setError(err?.message || 'Failed to load announcements.'); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.announcements.create(annForm);
      setAnnForm({ title: '', body: '', target_role: 'all', priority: 'normal' });
      setNotice('Announcement published.');
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to publish announcement.'); }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.admin.broadcast(bcForm);
      setBcForm({ title: '', message: '', target_role: 'all', priority: 'Normal' });
      setNotice(`Broadcast delivered to ${res.recipient_count} recipient(s).`);
    } catch (err: any) { setError(err?.message || 'Failed to send broadcast.'); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Institutional Communications"
        title="Announcements & Targeted Notifications"
        subtitle="Publish official campus notices and send targeted real-time notifications."
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{notice}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-display text-sm font-bold text-white mb-3">Publish Announcement</h3>
          <form onSubmit={handlePublish} className="space-y-3 text-xs">
            <input required placeholder="Title" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <textarea required rows={3} placeholder="Announcement details..." value={annForm.body} onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <select value={annForm.target_role} onChange={(e) => setAnnForm({ ...annForm, target_role: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white">
              <option value="all">All Institutional Users</option>
              <option value="student">Students Only</option>
              <option value="teacher">Faculty Only</option>
              <option value="parent">Parents Only</option>
            </select>
            <Button type="submit">Publish Notice</Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-display text-sm font-bold text-white mb-3">Send Targeted Notification</h3>
          <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
            <input required placeholder="Notification Title" value={bcForm.title} onChange={(e) => setBcForm({ ...bcForm, title: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <textarea required rows={3} placeholder="Message..." value={bcForm.message} onChange={(e) => setBcForm({ ...bcForm, message: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <select value={bcForm.target_role} onChange={(e) => setBcForm({ ...bcForm, target_role: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white">
              <option value="all">All Users</option>
              <option value="student">Students</option>
              <option value="teacher">Faculty</option>
              <option value="parent">Parents</option>
            </select>
            <Button type="submit">Send Broadcast</Button>
          </form>
        </Card>
      </div>

      <Card>
        <h3 className="font-display text-sm font-bold text-white mb-3">Published Announcements</h3>
        <div className="space-y-2 text-xs">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex justify-between items-start">
              <div>
                <p className="font-semibold text-white">{a.title}</p>
                <p className="text-faint mt-1">{a.body}</p>
              </div>
              <Badge tone="neutral">{a.target_role}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}
