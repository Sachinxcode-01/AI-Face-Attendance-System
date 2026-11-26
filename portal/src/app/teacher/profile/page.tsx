'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { api, resolveMediaUrl } from '@/lib/api';
import { useTeacherDashboardQuery } from '@/features/teacher/teacher.queries';
import { teacherApi } from '@/features/teacher/teacher.api';
import {
  User, Camera, KeyRound, Bell, Laptop, LogOut, Trash2, Building2, BookOpen,
} from 'lucide-react';

interface DeviceSession {
  id: string;
  device_name?: string;
  ip_address?: string;
  last_active?: string;
  current?: boolean;
}

export default function TeacherProfilePage() {
  const { user, refreshProfile, logout } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const { data: dash } = useTeacherDashboardQuery(user?.email);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Editable personal profile fields ONLY (institution/department/employee_id locked by server policy)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Read-only institutional metadata
  const [readOnlyMeta, setReadOnlyMeta] = useState<{
    department?: string;
    college?: string;
    college_id?: string;
    employee_id?: string;
  }>({});

  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

    // Notification prefs
    const [prefs, setPrefs] = useState({
      email: true,
      push: true,
      in_app: true,
      shortage_alerts: true,
      reminder_minutes_before: 10,
    });
    const [savingPrefs, setSavingPrefs] = useState(false);

    // Active devices
    const [devices, setDevices] = useState<DeviceSession[]>([]);
    const [loadingDevices, setLoadingDevices] = useState(false);

    useEffect(() => {
      let active = true;
      const loadAll = async () => {
        try {
          const [pRes, dRes] = await Promise.allSettled([api.auth.profile(), teacherApi.getDevices()]);
          if (!active) return;
          if (pRes.status === 'fulfilled' && pRes.value) {
            const p = pRes.value;
            setFullName(p.full_name || user?.name || '');
            setPhone(p.phone || '');
            setDesignation(p.designation || '');
            setSpecialization(p.specialization || '');
            setQualification(p.qualification || '');
            setExperience(p.experience != null ? String(p.experience) : '');
            setAddress(p.address || '');
            setPhotoUrl(p.profilePhotoUrl || p.avatar_url || '');
            setReadOnlyMeta({
              department: p.department || user?.department,
              college: p.college || dash?.academic_info?.college_name || undefined,
              college_id: p.college_id,
              employee_id: p.employee_id,
            });
            if (p.notification_preferences) {
              setPrefs((prev) => ({ ...prev, ...p.notification_preferences }));
            }
          }
          if (dRes.status === 'fulfilled' && dRes.value?.devices) {
            setDevices(dRes.value.devices);
          }
        } finally {
          if (active) setLoadingProfile(false);
        }
      };
      if (user?.email) loadAll();
      return () => { active = false; };
    }, [user?.email, user?.name, user?.department, dash?.academic_info?.college_name]);

    const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setSavingProfile(true);
      try {
        await api.student.updateProfile({
          full_name: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          ...({
            designation: designation.trim(),
            specialization: specialization.trim(),
            qualification: qualification.trim(),
            experience: experience.trim(),
          } as Record<string, unknown>),
        });
        await refreshProfile();
        push('Personal profile updated', 'success');
      } catch (err) {
        push(err instanceof Error ? err.message : 'Profile update failed', 'error');
      } finally {
        setSavingProfile(false);
      }
};

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.student.uploadAvatar(fd);
      setPhotoUrl(res.profilePhotoUrl || res.avatar_url || '');
      await refreshProfile();
      push('Profile photo updated', 'success');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Avatar upload failed', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

    const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
        if (newPassword.length < 8) {
          push('New password must be at least 8 characters.', 'info');
          return;
        }
        setSavingPassword(true);
        try {
          await api.auth.changePassword({ current_password: currentPassword, new_password: newPassword });
          setCurrentPassword('');
          setNewPassword('');
          push('Password updated successfully', 'success');
        } catch (err) {
          push(err instanceof Error ? err.message : 'Password change failed', 'error');
        } finally {
          setSavingPassword(false);
        }
      };

          const handleSavePrefs = async () => {
            setSavingPrefs(true);
            try {
              await teacherApi.updateNotificationPreferences(prefs);
              push('Notification preferences saved', 'success');
            } catch (err) {
              push(err instanceof Error ? err.message : 'Failed to save preferences', 'error');
            } finally {
              setSavingPrefs(false);
            }
            };

            const handleRevokeDevice = async (id: string) => {
              setLoadingDevices(true);
              try {
                await teacherApi.disconnectDevice(id);
                setDevices((prev) => prev.filter((d) => d.id !== id));
                push('Device session disconnected', 'info');
              } catch (err) {
                push(err instanceof Error ? err.message : 'Failed to revoke session', 'error');
              } finally {
                setLoadingDevices(false);
              }
            };

            const handleLogoutAll = async () => {
              setLoadingDevices(true);
              try {
                await teacherApi.logoutAllDevices();
                push('All active device sessions signed out', 'success');
                await logout();
              } catch (err) {
                push(err instanceof Error ? err.message : 'Failed to logout all devices', 'error');
              } finally {
                setLoadingDevices(false);
              }
            };

            return (
              <DashboardLayout>
                <Toasts toasts={toasts} dismiss={dismiss} />
                <PageHeader
                  kicker="Faculty Account"
                  title="Profile & Security Settings"
                  subtitle="Manage your faculty contact details, password, alert preferences, and active device sessions."
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                          {/* Left column: Identity & Institutional Scope */}
        <div className="space-y-6">
                          <Card>
                            <div className="flex flex-col items-center text-center">
                              <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-accent/40 bg-white/5">
                                {photoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={resolveMediaUrl(photoUrl)} alt="Faculty Avatar" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-accent">
                                    {(fullName || user?.email || 'T').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <h2 className="font-display text-lg font-bold text-hi">{fullName || user?.name || 'Faculty'}</h2>
                              <p className="text-xs text-faint">{user?.email}</p>
                              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                                <Badge tone="info">{user?.role || 'teacher'}</Badge>
                                {readOnlyMeta.department && <Badge tone="neutral">{readOnlyMeta.department}</Badge>}
                              </div>

                              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
                              <Button
                                variant="secondary"
                                className="mt-4"
                                loading={uploadingPhoto}
                                onClick={() => fileRef.current?.click()}
                              >
                              <Camera className="h-3.5 w-3.5" /> Update Photo
                            </Button>
                        </div>
          </Card>

          <Card>
            <CardHeader
              icon={<Building2 className="h-4 w-4" />}
              title="Institutional Assignment"
              subtitle="Managed by institution administrators (read-only)"
            />
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="text-faint">Institution</span>
                <span className="font-medium text-hi">{readOnlyMeta.college || dash?.academic_info?.college_name || 'Assigned Institution'}</span>
              </div>
              <div className="flex justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="text-faint">Department</span>
                <span className="font-medium text-hi">{readOnlyMeta.department || '—'}</span>
              </div>
              <div className="flex justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                <span className="text-faint">Employee ID</span>
                <span className="font-mono text-hi">{readOnlyMeta.employee_id || '—'}</span>
              </div>
              {dash?.assigned_subjects && dash.assigned_subjects.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                    <BookOpen className="h-3.5 w-3.5 text-accent" /> Assigned Subjects
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {dash.assigned_subjects.map((subj) => (
                      <Badge key={subj} tone="neutral">{subj}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
                      </Card>
                    </div>

                            {/* Right 2 columns */}
                            <div className="space-y-6 lg:col-span-2">
                              <Card>
                                <CardHeader icon={<User className="h-4 w-4" />} title="Personal & Academic Bio" subtitle={loadingProfile ? 'Loading profile...' : 'Update your faculty contact and academic details'} />
                                <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Full Name</label>
                                    <input
                                      required
                                      value={fullName}
                                      onChange={(e) => setFullName(e.target.value)}
                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Phone Number</label>
                                    <input
                                      value={phone}
                                      onChange={(e) => setPhone(e.target.value)}
                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Designation</label>
                                    <input
                                      value={designation}
                                      onChange={(e) => setDesignation(e.target.value)}
                                      placeholder="Associate Professor"
                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Specialization</label>
                                    <input
                                      value={specialization}
                                      onChange={(e) => setSpecialization(e.target.value)}
                                      placeholder="Distributed Systems"
                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Qualification</label>
                                    <input
                                      value={qualification}
                                      onChange={(e) => setQualification(e.target.value)}
                                      placeholder="Ph.D., M.Tech"
                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Experience (Years)</label>
                                    <input
                                      value={experience}
                                      onChange={(e) => setExperience(e.target.value)}
                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-xs font-semibold text-mid">Office / Contact Address</label>
                                    <input
                                      value={address}
                                      onChange={(e) => setAddress(e.target.value)}
                                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-hi"
                                    />
                                  </div>
                                  <div className="flex justify-end sm:col-span-2">
                                    <Button type="submit" loading={savingProfile}>Save Personal Details</Button>
                                  </div>
                                </form>
                              </Card>

                              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <Card>
                                  <CardHeader icon={<KeyRound className="h-4 w-4" />} title="Change Password" subtitle="Minimum 8 characters" />
                                  <form onSubmit={handleChangePassword} className="space-y-3">
                                    <div>
                                      <label className="mb-1 block text-xs font-semibold text-mid">Current Password</label>
                                      <input
                                        type="password"
                                        required
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-semibold text-mid">New Password</label>
                                      <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                                      />
                                    </div>
                                      <div className="flex justify-end pt-1">
                                        <Button type="submit" variant="secondary" loading={savingPassword}>Update Password</Button>
                                      </div>
                                      </form>
                                    </Card>

                                    <Card>
                                      <CardHeader icon={<Bell className="h-4 w-4" />} title="Alert Preferences" subtitle="Customize lecture & shortage alerts" />
                                      <div className="space-y-2.5 text-xs">
                                        {[
                                          { key: 'in_app', label: 'In-app WebSocket notifications' },
                                          { key: 'email', label: 'Email digests for escalations' },
                                          { key: 'push', label: 'Mobile push alerts' },
                                          { key: 'shortage_alerts', label: 'Weekly shortage radar alerts' },
                                        ].map((item) => (
                                          <label key={item.key} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-mid">
                                            <span>{item.label}</span>
                                            <input
                                              type="checkbox"
                                              checked={Boolean(prefs[item.key as keyof typeof prefs])}
                                              onChange={(e) => setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
                                            />
                                          </label>
                                        ))}
                                        <div className="flex justify-end pt-1">
                                          <Button variant="secondary" onClick={handleSavePrefs} loading={savingPrefs}>
                                            Save Preferences
                                          </Button>
                                        </div>
                                      </div>
                                    </Card>
                                  </div>

                                  <Card>
                                    <CardHeader
                                      icon={<Laptop className="h-4 w-4" />}
                                      title="Active Sessions & Devices"
                                      subtitle="Revoke unrecognized sessions immediately"
                                      right={
                                        <Button variant="danger" onClick={handleLogoutAll} loading={loadingDevices}>
                                          <LogOut className="h-3.5 w-3.5" /> Sign Out All Devices
                                        </Button>
                                      }
                                    />
                                    {devices.length === 0 ? (
                                      <p className="text-xs text-faint">Current browser session active.</p>
                                    ) : (
              <div className="space-y-2">
                {devices.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs">
                    <div>
                      <p className="font-medium text-hi">{d.device_name || 'Web / Mobile Client'}</p>
                      <p className="text-[11px] text-faint">
                        IP: {d.ip_address || 'Unknown'} {d.last_active ? `• Active ${new Date(d.last_active).toLocaleString()}` : ''}
                      </p>
                    </div>
                    {!d.current ? (
                      <button
                        onClick={() => handleRevokeDevice(d.id)}
                        className="rounded-full p-1.5 text-faint hover:bg-red-500/10 hover:text-red-400"
                        title="Disconnect session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <Badge tone="success">Current</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
                              </Card>
                            </div>
                          </div>
                        </DashboardLayout>
                      );
}