'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { UserRound, Mail, Phone, Building2, CalendarDays, ScanFace, Save, CheckCircle2 } from 'lucide-react';
import { DEMO_PROFILES } from '@/lib/demo-data';

export default function StudentProfilePage() {
  const { user, logout } = useAuth();
  const profile = DEMO_PROFILES.student;
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [saved, setSaved] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashboardLayout>
      <PageHeader kicker="Account" title="Student Profile" subtitle="Your identity, biometric enrollment, and account settings." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="page-enter flex flex-col items-center p-6 text-center">
          <Avatar src={profile.avatar} name={profile.name} size="lg" />
          <h2 className="mt-4 font-display text-lg font-bold text-white">{profile.name}</h2>
          <p className="text-xs text-gray-400">{profile.department}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge tone="info">{profile.rollNo}</Badge>
            <Badge tone="warning">{profile.streakTier}</Badge>
          </div>
          <div className="mt-5 w-full space-y-2.5 border-t border-white/5 pt-5 text-left text-xs">
            {[
              { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', value: profile.email },
              { icon: <Phone className="h-3.5 w-3.5" />, label: 'Phone', value: profile.phone ?? '—' },
              { icon: <CalendarDays className="h-3.5 w-3.5" />, label: 'Enrolled', value: profile.joinedAt ?? '—' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2.5 text-gray-400">
                {row.icon}
                <span className="w-16 text-gray-500">{row.label}</span>
                <span className="truncate text-gray-300">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex w-full items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
            <ScanFace className="h-4 w-4 shrink-0" /> Biometric faceprint enrolled (ArcFace 512-dim)
          </div>
        </Card>

        {/* Edit form */}
        <Card className="page-enter p-6 lg:col-span-2">
          <CardHeader icon={<UserRound className="h-5 w-5 text-indigo-400" />} title="Edit Profile" subtitle="Changes sync to the directory within seconds." />
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Email (locked)</label>
                <input value={profile.email} disabled className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-gray-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-300">Department</label>
                <input value={profile.department} disabled className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-gray-500" />
              </div>
            </div>
            {saved && (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Profile updated successfully.
              </p>
            )}
            <div className="flex gap-3">
              <Button type="submit"><Save className="h-3.5 w-3.5" /> Save Changes</Button>
              <Button type="button" variant="danger" onClick={logout}>Sign out</Button>
            </div>
          </form>

          <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <CardHeader title="Session & Security" />
            <div className="space-y-2 text-xs text-gray-400">
              <p>• Active session: <span className="font-mono text-gray-300">web-{profile.id}</span></p>
              <p>• JWT expires in 24h • refresh rotation enabled</p>
              <p>• Last biometric verification: Today 09:02 AM, Lab 402</p>
            </div>
            <Button variant="secondary" className="mt-4" onClick={logout}>
              Revoke all other sessions
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
