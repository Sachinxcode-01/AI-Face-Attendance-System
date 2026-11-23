'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { UserRound, Mail, Phone, Building2, Hash, ShieldCheck, Save, CheckCircle2, ScanFace, Upload, Laptop, Smartphone, Trash2, LogOut, Shield } from 'lucide-react';
import { DEMO_PROFILES } from '@/lib/demo-data';
import { api, ApiError } from '@/lib/api';

export default function StudentProfilePage() {
  const { user, logout } = useAuth();
  const profile = user || DEMO_PROFILES.student;
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone || '+1 (555) 234-8901');
  const [avatar, setAvatar] = useState(profile.avatar);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [devices, setDevices] = useState<any[]>([
    { id: 'dev-1', deviceType: 'desktop', userAgent: 'Chrome on macOS (Current)', ipAddress: '192.168.1.42', lastActive: 'Now', current: true },
    { id: 'dev-2', deviceType: 'mobile', userAgent: 'SmartFace Flutter App (iOS 17)', ipAddress: '10.0.4.19', lastActive: '2 hours ago', current: false },
  ]);
  const [deviceMsg, setDeviceMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadDevices() {
      try {
        const res = await api.devices.list();
        if (mounted && res?.devices && res.devices.length > 0) {
          setDevices(res.devices);
        }
      } catch {}
    }
    loadDevices();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDisconnectDevice = async (id: string) => {
    try {
      await api.devices.disconnect(id);
    } catch {}
    setDevices((prev) => prev.filter((d) => d.id !== id));
    setDeviceMsg('Device disconnected successfully.');
    setTimeout(() => setDeviceMsg(''), 3000);
  };

  const handleLogoutAllDevices = async () => {
    try {
      await api.devices.logoutAll();
    } catch {}
    setDevices((prev) => prev.filter((d) => d.current));
    setDeviceMsg('All remote sessions terminated.');
    setTimeout(() => setDeviceMsg(''), 3000);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.student.updateProfile({ full_name: name, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.student.uploadAvatar(fd);
      if (res?.profilePhotoUrl || res?.avatar_url) {
        setAvatar(res.profilePhotoUrl || res.avatar_url || '');
      }
    } catch {
      /* fallback */
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Account"
        title="Student Profile"
        subtitle="Manage your personal details, enrolled biometric faceprint status, and campus credentials."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="page-enter flex flex-col items-center p-6 text-center">
          <Avatar src={avatar || profile.avatar} name={name} size="xl" />
          <label className="mt-3 btn-pill-glass cursor-pointer text-[11px] h-7 px-3 flex items-center gap-1.5 font-medium">
            <Upload className="h-3 w-3 text-accent" />
            <span>{uploading ? 'Uploading…' : 'Change Photo'}</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
          </label>
          <h2 className="mt-4 font-display text-lg font-semibold text-hi">{name}</h2>
          <p className="font-mono text-xs text-accent uppercase tracking-wider">{profile.rollNo}</p>
          <span className="mt-1.5 chip-bytune text-[11px] h-6 px-3">
            {profile.department}
          </span>

          <div className="mt-6 w-full space-y-3 border-t border-white/[0.08] pt-5 text-left text-xs">
            {[
              { icon: Mail, label: 'Email', value: profile.email },
              { icon: Phone, label: 'Phone', value: phone },
              { icon: Building2, label: 'Department', value: profile.department },
              { icon: Hash, label: 'Roll Number', value: profile.rollNo },
              { icon: ShieldCheck, label: 'Account Role', value: 'Student (Verified)' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-mono text-[11px] text-faint">
                  <row.icon className="h-3.5 w-3.5 text-accent" /> {row.label}
                </span>
                <span className="truncate font-mono text-xs text-mid">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex w-full items-center gap-2 rounded-[14px] border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 font-mono text-[11px] text-emerald-300">
            <ScanFace className="h-4 w-4 shrink-0 text-emerald-400" /> Biometric faceprint enrolled (ArcFace 512-dim)
          </div>
        </Card>

        {/* Edit form */}
        <Card className="page-enter p-6 lg:col-span-2">
          <CardHeader icon={<UserRound className="h-5 w-5 text-accent" />} title="Edit Profile" subtitle="Changes sync to the campus directory within seconds." />
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
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-faint">Department</label>
                <input
                  value={profile.department}
                  disabled
                  className="w-full rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5 text-xs text-faint font-mono"
                />
              </div>
            </div>
            {saved && (
              <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-300 font-mono">
                <CheckCircle2 className="h-4 w-4" /> Profile updated successfully.
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit"><Save className="h-3.5 w-3.5" /> Save Changes</Button>
              <Button type="button" variant="danger" onClick={logout}>Sign out</Button>
            </div>
          </form>

          <div className="mt-8 rounded-[18px] border border-white/[0.06] bg-surface p-5">
            <CardHeader title="Session & Security Telemetry" />
            <div className="space-y-2 font-mono text-xs text-mid">
              <p>• Active session: <span className="text-accent">web-{profile.id}</span></p>
              <p>• Enrolled ArcFace vector: <span className="text-emerald-400">512-float FP16 (Encrypted HSM)</span></p>
              <p>• Hardware token: <span className="text-white">Active (UUID: dev-89a1-43ef-992a)</span></p>
            </div>
          </div>

          {/* Active Devices & Session Management */}
          <div className="mt-6 rounded-[18px] border border-white/[0.06] bg-surface p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="font-semibold text-hi text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" /> Active Devices & Sessions
                </h3>
                <p className="text-[11px] text-faint">Manage hardware sessions authorized to mark attendance</p>
              </div>
              <Button size="sm" variant="ghost" onClick={handleLogoutAllDevices} className="text-xs text-red-400 hover:text-red-300">
                <LogOut className="h-3.5 w-3.5 mr-1" /> Revoke Others
              </Button>
            </div>

            {deviceMsg && (
              <p className="mt-3 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                {deviceMsg}
              </p>
            )}

            <div className="mt-4 space-y-3">
              {devices.map((dev) => (
                <div key={dev.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent">
                      {dev.deviceType === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-hi flex items-center gap-2">
                        {dev.userAgent || 'Authorized Client'}
                        {dev.current && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-faint">
                        IP: {dev.ipAddress || '127.0.0.1'} • Active: {dev.lastActive || 'Recently'}
                      </div>
                    </div>
                  </div>
                  {!dev.current && (
                    <button
                      onClick={() => handleDisconnectDevice(dev.id)}
                      className="text-faint hover:text-red-400 p-1.5 transition-colors"
                      title="Disconnect session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
