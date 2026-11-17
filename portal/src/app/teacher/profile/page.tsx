'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, UserRound, Camera, KeyRound, Loader2, CheckCircle } from 'lucide-react';

export default function TeacherProfilePage() {
  const { user, role } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [department, setDepartment] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await apiFetch('/auth/profile')) as Record<string, unknown>;
      setProfile(data);
      setFullName(String(data.full_name || data.name || user?.name || ''));
      setPhone(String(data.phone || ''));
      setDesignation(String(data.designation || ''));
      setSpecialization(String(data.specialization || ''));
      setDepartment(String(data.department || ''));
    } catch {
      push('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [push, user?.name]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const uploadPhoto = async (file: File) => {
    // Client-side validation per upload security rules
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      push('Only JPEG, PNG, or WebP images are accepted', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      push('Image must be under 2MB', 'error');
      return;
    }
    setPhotoUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const result = (await apiFetch('/auth/update-profile-photo', {
        method: 'POST',
        body: form,
      })) as { profilePhotoUrl?: string; avatar_url?: string };
      push('Profile photo updated', 'success');
      setProfile((prev) =>
        prev
          ? { ...prev, profilePhotoUrl: result.profilePhotoUrl ?? prev.profilePhotoUrl, avatar_url: result.avatar_url ?? prev.avatar_url }
          : prev
      );
    } catch (err) {
      push(err instanceof Error ? err.message : 'Photo upload failed', 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiFetch('/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          designation: designation.trim(),
          specialization: specialization.trim(),
          department: department.trim(),
        }),
      });
      push('Profile updated', 'success');
      await loadProfile();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      push('New password must be at least 8 characters', 'error');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      push('Password needs uppercase, lowercase, number, and special character', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      push('New passwords do not match', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      push('Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const photoUrl = String(profile?.profilePhotoUrl ?? profile?.avatar_url ?? user?.avatar ?? '');

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Faculty Account"
        title="Profile & Security"
        subtitle="Manage your personal information, profile photo, and account credentials."
        backTo="/teacher"
        backLabel="Back to Dashboard"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="page-enter p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar src={photoUrl} name={String(profile?.full_name || user?.name || 'Teacher')} size="xl" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[#050507] shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
                aria-label="Upload profile photo"
                title="Upload profile photo"
              >
                {photoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                  e.target.value = '';
                }}
              />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-hi">
              {String(profile?.full_name || user?.name || '—')}
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-faint">{String(profile?.email || user?.email || '')}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="purple">{role}</Badge>
              {String(profile?.department || '') && <Badge tone="neutral">{String(profile?.department)}</Badge>}
            </div>
            <div className="mt-5 w-full space-y-2 border-t border-white/5 pt-5 text-left">
              {[
                ['Designation', String(profile?.designation || '—')],
                ['Specialization', String(profile?.specialization || '—')],
                ['Employee ID', String(profile?.employee_id || '—')],
                ['Biometric', profile?.biometric_registered ? 'Enrolled' : 'Pending'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="font-mono uppercase tracking-wider text-faint">{label}</span>
                  <span className="font-semibold text-mid">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Personal info form */}
        <Card className="page-enter p-6 lg:col-span-2">
          <CardHeader icon={<UserRound className="h-5 w-5 text-accent" />} title="Personal Information" />
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-white/[0.06]" />
              ))}
            </div>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="pf-name" className="mb-1.5 block text-xs font-semibold text-mid">Full Name</label>
                  <input id="pf-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30" />
                </div>
                <div>
                  <label htmlFor="pf-phone" className="mb-1.5 block text-xs font-semibold text-mid">Phone</label>
                  <input id="pf-phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30" />
                </div>
                <div>
                  <label htmlFor="pf-dept" className="mb-1.5 block text-xs font-semibold text-mid">Department</label>
                  <input id="pf-dept" type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30" />
                </div>
                <div>
                  <label htmlFor="pf-desig" className="mb-1.5 block text-xs font-semibold text-mid">Designation</label>
                  <input id="pf-desig" type="text" value={designation} onChange={(e) => setDesignation(e.target.value)}
                    className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30" />
                </div>
              </div>
              <div>
                <label htmlFor="pf-spec" className="mb-1.5 block text-xs font-semibold text-mid">Specialization</label>
                <input id="pf-spec" type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30" />
              </div>
              <Button type="submit" loading={savingProfile} className="h-9 px-5 text-xs font-semibold">
                Save Changes
              </Button>
            </form>
          )}
        </Card>
      </div>

      {/* Change password */}
      <Card className="page-enter mt-6 p-6">
        <CardHeader icon={<KeyRound className="h-5 w-5 text-amber-400" />} title="Change Password" subtitle="Use a strong password with uppercase, lowercase, number, and special character." />
        <form onSubmit={changePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="pw-current" className="mb-1.5 block text-xs font-semibold text-mid">Current Password</label>
            <input id="pw-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30" />
          </div>
          <div>
            <label htmlFor="pw-new" className="mb-1.5 block text-xs font-semibold text-mid">New Password</label>
            <input id="pw-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30" />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="mb-1.5 block text-xs font-semibold text-mid">Confirm New Password</label>
            <input id="pw-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30" />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" loading={changingPassword} className="h-9 px-5 text-xs font-semibold">
              <CheckCircle className="h-3.5 w-3.5" /> Update Password
            </Button>
          </div>
        </form>
      </Card>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </DashboardLayout>
  );
}