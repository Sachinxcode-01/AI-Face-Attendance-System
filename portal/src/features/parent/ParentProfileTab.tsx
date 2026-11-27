'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserRound } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  onRelationshipChanged: () => void;
}

export function ParentProfileTab({ onRelationshipChanged }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('English');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [shortageAlerts, setShortageAlerts] = useState(true);
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const loadAll = (signal?: AbortSignal) => {
    Promise.all([
      api.parent.profile(signal).catch(() => ({ profile: null })),
      api.parent.relationships(signal).catch(() => ({ relationships: [] })),
    ]).then(([pRes, rRes]) => {
      if (signal?.aborted) return;
      const p = pRes?.profile;
      if (p) {
        setProfile(p);
        setFullName(p.full_name || '');
        setPhone(p.phone || '');
        setLanguage(p.language_preference || 'English');
        setEmailAlerts(p.notification_preferences?.email ?? true);
        setShortageAlerts(p.notification_preferences?.shortage_alerts ?? true);
        setQuietEnabled(p.notification_preferences?.quiet_hours?.enabled ?? false);
      }
      setRelationships(Array.isArray(rRes?.relationships) ? rRes.relationships : []);
    });
  };

  useEffect(() => {
    const ctrl = new AbortController();
    loadAll(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg('');
    try {
      await api.parent.updateProfile({
        full_name: fullName,
        phone,
        language_preference: language,
        notification_preferences: {
          email: emailAlerts,
          push: true,
          in_app: true,
          shortage_alerts: shortageAlerts,
          quiet_hours: { enabled: quietEnabled, start: '22:00', end: '07:00' },
        },
      });
      setSaveMsg('Preferences saved.');
    } catch (err: any) {
      setSaveMsg(err?.message || 'Failed to save preferences.');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.parent.revokeRelationship(id, 'Revoked by guardian in Parent Portal');
      loadAll();
      onRelationshipChanged();
    } catch { }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-6 rounded-[22px] card-surface p-6">
        <h3 className="font-display text-base font-bold text-hi mb-4 flex items-center gap-2">
          <UserRound className="h-5 w-5 text-accent" />
          <span>Guardian Profile & Notification Preferences</span>
        </h3>
        <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
          <div>
            <label className="block text-mid mb-1">Registered Email</label>
            <input type="text" disabled value={profile?.email || ''} className="w-full rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2 text-faint" />
          </div>
          <div>
            <label className="block text-mid mb-1">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-hi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-mid mb-1">Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-hi" />
            </div>
            <div>
              <label className="block text-mid mb-1">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-xl bg-[#0B0B10] border border-white/10 px-3 py-2 text-hi">
                <option value="English">English</option>
                <option value="Kannada">Kannada</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-mid">
              <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
              <span>Email attendance notifications</span>
            </label>
            <label className="flex items-center gap-2 text-mid">
              <input type="checkbox" checked={shortageAlerts} onChange={(e) => setShortageAlerts(e.target.checked)} />
              <span>Attendance shortage & risk alerts</span>
            </label>
            <label className="flex items-center gap-2 text-mid">
              <input type="checkbox" checked={quietEnabled} onChange={(e) => setQuietEnabled(e.target.checked)} />
              <span>Quiet hours (22:00 – 07:00) for non-critical alerts</span>
            </label>
          </div>
          <button type="submit" className="btn-pill-accent px-5 py-2 text-xs font-semibold">Save Settings</button>
          {saveMsg && <p className="text-xs text-emerald-300">{saveMsg}</p>}
        </form>
      </div>

      <div className="lg:col-span-6 rounded-[22px] card-surface p-6">
        <h3 className="font-display text-base font-bold text-hi mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-spotify" />
          <span>Guardian Relationships & Privacy Governance</span>
        </h3>
        {relationships.length === 0 ? (
          <p className="text-xs text-faint">No guardian relationships recorded.</p>
        ) : (
          <div className="space-y-2.5">
            {relationships.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-[16px] bg-white/[0.02] border border-white/5 p-3">
                <div>
                  <p className="text-xs font-bold text-hi">{r.student_name} ({r.student_id || r.student_email})</p>
                  <p className="text-[11px] text-mid capitalize">
                    {String(r.relationship_type || '').replace('_', ' ')} • {String(r.status || '').replace('_', ' ')}
                  </p>
                </div>
                {r.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(r.id)}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
