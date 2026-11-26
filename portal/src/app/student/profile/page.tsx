'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserRound, Mail, Phone, Building2, Hash, ShieldCheck, Save, CheckCircle2,
  ScanFace, Upload, Laptop, Smartphone, Trash2, LogOut, Shield, KeyRound, BellRing, Download,
} from 'lucide-react';
import { api, ApiError, resolveMediaUrl } from '@/lib/api';

export default function StudentProfilePage() {
  const { user, updateUser, refreshProfile, logout } = useAuth();
  const profile = user || { id: '', name: '', email: '', phone: '', avatar: '', role: 'student' as const };
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone || '');
  const [language, setLanguage] = useState(profile.language_preference || 'English');
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const lastLoadedUserIdRef = useRef<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  // Notification preferences & Biometric status
  const [prefs, setPrefs] = useState({ email: true, push: true, in_app: true, shortage_alerts: true });
  const [prefsMsg, setPrefsMsg] = useState('');
  const [bioStatus, setBioStatus] = useState<{ enrolled: boolean; vector_version: string | null; updated_at: string | null } | null>(null);
  const [bioMsg, setBioMsg] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [deviceMsg, setDeviceMsg] = useState('');
  const [privacyMsg, setPrivacyMsg] = useState('');

  useEffect(() => {
      if (user && (user.id !== lastLoadedUserIdRef.current || !lastLoadedUserIdRef.current)) {
        lastLoadedUserIdRef.current = user.id || user.email;
        setName(user.name || '');
        setPhone(user.phone || '');
        setLanguage(user.language_preference || 'English');
        setAvatar(user.avatar || '');
      }
    }, [user]);

  useEffect(() => {
    let mounted = true;
        async function loadProfileExtras() {
          const [devRes, bioRes, profRes] = await Promise.allSettled([
            api.devices.list(),
            api.auth.biometricStatus(),
            api.auth.profile(),
          ]);
          if (!mounted) return;
          if (devRes.status === 'fulfilled' && devRes.value?.devices) {
            setDevices(devRes.value.devices);
          }
          if (bioRes.status === 'fulfilled' && bioRes.value) {
            setBioStatus({
              enrolled: Boolean(bioRes.value.enrolled),
              vector_version: bioRes.value.vector_version,
              updated_at: bioRes.value.updated_at,
            });
          }
          if (profRes.status === 'fulfilled' && profRes.value?.notification_preferences) {
            const p = profRes.value.notification_preferences;
            setPrefs({
              email: p.email !== false,
              push: p.push !== false,
              in_app: p.in_app !== false,
              shortage_alerts: p.shortage_alerts !== false,
            });
          }
        }
        loadProfileExtras();
        return () => {
          mounted = false;
        };
      }, []);

  const handleDisconnectDevice = async (id: string) => {
    try {
      await api.devices.disconnect(id);
  setDevices((prev) => prev.filter((d) => d.id !== id));
  setDeviceMsg('Device session revoked successfully.');
} catch {
  setDeviceMsg('Failed to disconnect device.');
}
setTimeout(() => setDeviceMsg(''), 3000);
  };

  const handleLogoutAllDevices = async () => {
    try {
      await api.devices.logoutAll();
      setDevices((prev) => prev.filter((d) => d.isCurrent));
      setDeviceMsg('All remote sessions terminated.');
    } catch {
      setDeviceMsg('Failed to terminate remote sessions.');
    }
    setTimeout(() => setDeviceMsg(''), 3000);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    if (!name.trim()) {
      setSaveError('Full name is required.');
      return;
    }
    try {
      await api.student.updateProfile({ full_name: name.trim(), phone: phone.trim(), language_preference: language });
      updateUser({ name: name.trim(), phone: phone.trim(), language_preference: language });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to update profile.');
    }
  };

        const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          setUploadError('');
          try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await api.student.uploadAvatar(fd);
            const nextAvatar = resolveMediaUrl(res?.profilePhotoUrl || res?.avatar_url || '');
            if (nextAvatar) {
              setAvatar(nextAvatar);
              updateUser({ avatar: nextAvatar });
            }
          } catch (err: unknown) {
            setUploadError(err instanceof ApiError ? err.message : 'Failed to upload photo.');
          } finally {
            setUploading(false);
            e.target.value = '';
          }
    };

  const handleChangePassword = async (e: React.FormEvent) => {
          e.preventDefault();
        setPwMsg(null);
        if (newPassword !== confirmPassword) {
          setPwMsg({ ok: false, text: 'New password and confirmation do not match.' });
        return;
    }
        if (newPassword.length < 8) {
          setPwMsg({ ok: false, text: 'New password must be at least 8 characters.' });
        return;
    }
        setPwBusy(true);
        try {
          await api.auth.changePassword({ current_password: currentPassword, new_password: newPassword });
        setPwMsg({ok: true, text: 'Password updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (err: unknown) {
          setPwMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Failed to update password.' });
    } finally {
          setPwBusy(false);
    }
  };

  const togglePref = async (key: keyof typeof prefs) => {
    const next = {...prefs, [key]: !prefs[key] };
            setPrefs(next);
            try {
              await api.auth.updateNotificationPreferences(next);
            setPrefsMsg('Preferences saved.');
      setTimeout(() => setPrefsMsg(''), 2000);
    } catch {
              setPrefs(prefs);
            setPrefsMsg('Failed to update preferences.');
    }
  };

  const handleDeleteBiometric = async () => {
    try {
                    await api.auth.deleteBiometric();
                  setBioStatus({enrolled: false, vector_version: null, updated_at: null });
                  updateUser({biometric_registered: false });
                  setBioMsg('Biometric template deleted and consent withdrawn.');
    } catch (err: unknown) {
                    setBioMsg(err instanceof ApiError ? err.message : 'Failed to delete biometric data.');
    }
  };

  const handleExportPersonalData = async () => {
    try {
      const data = await api.auth.exportPrivacyData();
                  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `smartface_personal_data_${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setPrivacyMsg('Personal data export downloaded (biometric embeddings excluded).');
    } catch {
                    setPrivacyMsg('Unable to export personal data.');
    }
  };

  const handleDeletionRequest = async () => {
    try {
      const res = await api.auth.requestAccountDeletion('Student requested personal data deletion review');
                  setPrivacyMsg(res.message);
    } catch {
                    setPrivacyMsg('Unable to log deletion request.');
    }
  };

                  return (
                  <DashboardLayout>
                    <PageHeader
                      kicker="Account"
                      title="Student Profile"
                      subtitle="Manage your personal details, notification preferences, biometric consent, and active sessions."
                    />

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      {/* Identity card */}
                      <Card className="page-enter flex flex-col items-center p-6 text-center">
                        <Avatar src={avatar || profile.avatar} name={name || 'Student'} size="xl" />
                        <label className="mt-3 btn-pill-glass cursor-pointer text-[11px] h-7 px-3 flex items-center gap-1.5 font-medium">
                          <Upload className="h-3 w-3 text-accent" />
                          <span>{uploading ? 'Uploading…' : 'Change Photo'}</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                        </label>
                        {uploadError && <p className="mt-2 text-xs text-red-400 font-mono">{uploadError}</p>}
                        <h2 className="mt-4 font-display text-lg font-semibold text-hi">{name || 'Student'}</h2>
                        <p className="font-mono text-xs text-accent uppercase tracking-wider">{profile.rollNo || profile.student_id || 'Unassigned ID'}</p>
                        {profile.department && (
                          <span className="mt-1.5 chip-bytune text-[11px] h-6 px-3">{profile.department}</span>
                        )}

                        <div className="mt-6 w-full space-y-3 border-t border-white/[0.08] pt-5 text-left text-xs">
                          {[
                            { icon: Mail, label: 'Email', value: profile.email || '—' },
                            { icon: Phone, label: 'Phone', value: phone || 'Not set' },
                            { icon: Building2, label: 'Department', value: profile.department || 'Not assigned' },
                            { icon: Hash, label: 'Roll / ID', value: profile.rollNo || profile.student_id || 'Not assigned' },
                            { icon: ShieldCheck, label: 'Semester & Sec', value: [profile.semester, profile.section].filter(Boolean).join(' · ') || 'Not assigned' },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 font-mono text-[11px] text-faint">
                                <row.icon className="h-3.5 w-3.5 text-accent" /> {row.label}
                              </span>
                              <span className="truncate font-mono text-xs text-mid">{row.value}</span>
                            </div>
                          ))}
                        </div>

                        <div className={`mt-5 flex w-full items-center justify-between gap-2 rounded-[14px] border px-3.5 py-2.5 font-mono text-[11px] ${bioStatus?.enrolled
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                          }`}>
                          <span className="flex items-center gap-2">
                            <ScanFace className="h-4 w-4 shrink-0" />
                            {bioStatus === null ? 'Checking biometric status…' : bioStatus.enrolled ? 'Biometric Enrolled' : 'Not Enrolled'}
                          </span>
                          {bioStatus?.enrolled && (
                            <button
                              type="button"
                              onClick={handleDeleteBiometric}
                              className="text-[10px] underline hover:text-red-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        {bioMsg && <p className="mt-2 font-mono text-[10.5px] text-mid">{bioMsg}</p>}
                      </Card>

                      {/* Edit & Security forms */}
                      <Card className="page-enter p-6 lg:col-span-2">
                        <CardHeader icon={<UserRound className="h-5 w-5 text-accent" />} title="Edit Profile" subtitle="Institution-assigned identifiers are locked and managed by administration." />
                        <form onSubmit={save} className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">Full name</label>
                              <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-xs text-hi focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">Phone</label>
                              <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-xs text-hi focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-faint">Email (Institutional Lock)</label>
                              <input
                                value={profile.email}
                                disabled
                                className="w-full rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 text-xs text-faint font-mono"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">Language Preference</label>
                              <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-xs text-hi focus:border-accent focus:outline-none"
                              >
                                <option value="English">English</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Kannada">Kannada</option>
                              </select>
                            </div>
                          </div>
                      {saved && (
                        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-300 font-mono">
                          <CheckCircle2 className="h-4 w-4" /> Profile updated successfully.
                        </p>
                      )}
                      {saveError && (
                        <p className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300 font-mono">
                          {saveError}
                        </p>
                      )}
                      <div className="flex gap-3 pt-2">
                        <Button type="submit"><Save className="h-3.5 w-3.5" /> Save Changes</Button>
                        <Button type="button" variant="danger" onClick={logout}>Sign out</Button>
                      </div>
                    </form>

                            {/* Change Password */}
                            <div className="mt-8 rounded-[18px] border border-white/[0.06] bg-surface p-5">
                              <CardHeader icon={<KeyRound className="h-4 w-4 text-accent" />} title="Change Password" subtitle="Requires your current password and strong complexity" />
                              <form onSubmit={handleChangePassword} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <input
                                  type="password"
                                  value={currentPassword}
                                  onChange={(e) => setCurrentPassword(e.target.value)}
                                  placeholder="Current password"
                                  className="rounded-xl border border-[var(--hairline)] bg-[#0c0c12] px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
                                />
                              <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password"
                                className="rounded-xl border border-[var(--hairline)] bg-[#0c0c12] px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
                              />
                              <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="rounded-xl border border-[var(--hairline)] bg-[#0c0c12] px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
                              />
                            <div className="sm:col-span-3 flex items-center justify-between gap-3">
                              {pwMsg ? (
                                <p className={`text-xs font-mono ${pwMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg.text}</p>
                              ) : <span />}
                              <Button type="submit" variant="secondary" loading={pwBusy} className="text-xs">Update Password</Button>
                            </div>
                          </form>
                        </div>

                          {/* Notification Preferences */}
                          <div className="mt-6 rounded-[18px] border border-white/[0.06] bg-surface p-5">
                            <CardHeader
                              icon={<BellRing className="h-4 w-4 text-accent" />}
                              title="Notification Preferences"
                              right={prefsMsg ? <span className="font-mono text-[11px] text-emerald-400">{prefsMsg}</span> : null}
                            />
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                              {(
                                [
                                  ['email', 'Email Alerts'],
                                  ['push', 'Push Alerts'],
                                  ['in_app', 'In-App Feed'],
                                  ['shortage_alerts', 'Shortage Warnings'],
                                ] as const
                              ).map(([k, label]) => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => togglePref(k)}
                                  className={`rounded-xl border px-3 py-2 text-left transition-all ${prefs[k] ? 'border-accent/40 bg-accent/10 text-hi' : 'border-white/5 bg-white/[0.02] text-faint'
                                    }`}
                                >
                                  <p className="font-semibold">{label}</p>
                                  <p className="mt-0.5 font-mono text-[10px]">{prefs[k] ? 'Enabled' : 'Muted'}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                              {/* Active Devices & Session Management */}
                              <div className="mt-6 rounded-[18px] border border-white/[0.06] bg-surface p-5">
                                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                                  <div>
                                    <h3 className="font-semibold text-hi text-sm flex items-center gap-2">
                                      <Shield className="h-4 w-4 text-accent" /> Active Devices & Sessions
                                    </h3>
                                    <p className="text-[11px] text-faint">Manage authenticated sessions for your account</p>
                                  </div>
                                  <Button variant="ghost" onClick={handleLogoutAllDevices} className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300">
                                    <LogOut className="h-3.5 w-3.5 mr-1" /> Revoke All
                                  </Button>
                                </div>

                              {deviceMsg && (
                                <p className="mt-3 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                                  {deviceMsg}
                                </p>
                              )}

                                          <div className="mt-4 space-y-3">
                                            {devices.length === 0 ? (
                                              <p className="font-mono text-xs text-faint">No active device records found.</p>
                                            ) : (
                                              devices.map((dev) => (
                                                <div key={dev.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                  <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                                      {String(dev.device || '').toLowerCase().includes('mobile') ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                      <div className="text-xs font-semibold text-hi flex items-center gap-2">
                                                        <span className="truncate max-w-[240px]">{dev.device || 'Authorized Client'}</span>
                                                        {dev.isCurrent && (
                                                          <Badge tone="success">THIS DEVICE</Badge>
                                                        )}
                                                      </div>
                                                      <div className="text-[10px] font-mono text-faint">
                                                        IP: {dev.ip || '—'} • Active: {dev.lastActive ? new Date(dev.lastActive).toLocaleString() : 'Recently'}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  {!dev.isCurrent && (
                                                    <button
                                                      onClick={() => handleDisconnectDevice(dev.id)}
                                                      className="text-faint hover:text-red-400 p-1.5 transition-colors"
                                                      title="Disconnect session"
                                                    >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                  )}
                                                </div>
                                        ))
              )}
                                      </div>
                                    </div>

                          {/* Privacy & Data Rights */}
                          <div className="mt-6 rounded-[18px] border border-white/[0.06] bg-surface p-5">
                            <CardHeader title="Privacy & Data Access" subtitle="Download your academic records or submit a data deletion review request" />
                            <div className="flex flex-wrap gap-3">
                              <Button type="button" variant="secondary" onClick={handleExportPersonalData} className="text-xs">
                                <Download className="h-3.5 w-3.5" /> Download My Data (JSON)
                              </Button>
                              <Button type="button" variant="danger" onClick={handleDeletionRequest} className="text-xs">
                                Request Account Deletion
                              </Button>
                            </div>
                            {privacyMsg && <p className="mt-2.5 font-mono text-[11px] text-accent">{privacyMsg}</p>}
                          </div>
                        </Card>
                      </div>
                  </DashboardLayout>
                  );
}
