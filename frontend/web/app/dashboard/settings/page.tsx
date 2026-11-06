/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Palette,
  BellRing,
  Laptop,
  CheckCircle,
  Clock,
  LogOut,
  Lock,
  Eye,
  Settings
} from 'lucide-react';
import { DashboardCard } from '@/components/portal/ui-helpers';

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState<'account' | 'security' | 'appearance' | 'notifications' | 'devices'>('account');

  // Account state
  const [firstName, setFirstName] = useState('Alice');
  const [lastName, setLastName] = useState('Cooper');
  const [email, setEmail] = useState('alice@smartface.pro');

  // Security state
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Appearance state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('theme-light', newTheme === 'light');
  };

  // Notifications state
  const [notifyAttendance, setNotifyAttendance] = useState(true);
  const [notifyLeaves, setNotifyLeaves] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(false);

  // Devices state
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome / Windows 11', ip: '192.168.1.108', current: true, location: 'San Francisco, CA' },
    { id: 2, device: 'SmartFace App / iPhone 15 Pro', ip: '10.0.0.44', current: false, location: 'Staging Area' }
  ]);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Account details successfully compiled and saved.');
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Security credentials successfully updated.');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Settings className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-xl font-black text-white font-sans uppercase">System Settings</h2>
          <p className="text-xs text-slate-400 font-sans">
            Configure your account preferences, theme configurations, security rules, and device credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sub-tabs Sidebar selector */}
        <div className="lg:col-span-1 space-y-1">
          {[
            { id: 'account', name: 'Account Profile', icon: User },
            { id: 'security', name: 'Security & Sign In', icon: Shield },
            { id: 'appearance', name: 'Appearance Theme', icon: Palette },
            { id: 'notifications', name: 'Notifications Alert', icon: BellRing },
            { id: 'devices', name: 'Device Sessions', icon: Laptop }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold font-sans transition ${
                  activeSubTab === tab.id
                    ? 'bg-white/5 text-white border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab workspace content */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: ACCOUNT DETAILS */}
          {activeSubTab === 'account' && (
            <DashboardCard>
              <h3 className="font-extrabold text-sm font-sans mb-4 text-white">Account Information</h3>
              <form onSubmit={handleSaveAccount} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:border-primary transition outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:border-primary transition outline-none font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:border-primary transition outline-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition text-xs border border-primary/20 shadow-md shadow-primary/10"
                >
                  Save Account Changes
                </button>
              </form>
            </DashboardCard>
          )}

          {/* TAB 2: SECURITY */}
          {activeSubTab === 'security' && (
            <DashboardCard className="space-y-6">
              {/* MFA Switcher */}
              <div className="pb-4 border-b border-white/5 flex items-center justify-between">
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-white font-sans">Multi-Factor Authentication (MFA)</h4>
                  <p className="text-slate-400 leading-normal max-w-sm">
                    Require OTP verification alongside institutional email passcodes on logins.
                  </p>
                </div>
                
                <button
                  onClick={() => setMfaEnabled(!mfaEnabled)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors ${
                    mfaEnabled ? 'bg-primary' : 'bg-slate-800'
                  } relative flex items-center`}
                >
                  <motion.span
                    animate={{ x: mfaEnabled ? 22 : 2 }}
                    className="w-4.5 h-4.5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              {/* Password update form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white font-sans flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-primary" />
                  Update Password
                </h4>
                
                <form onSubmit={handlePasswordReset} className="space-y-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:border-primary transition outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-white focus:border-primary transition outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition text-xs border border-primary/20"
                  >
                    Reset Password Credentials
                  </button>
                </form>
              </div>
            </DashboardCard>
          )}

          {/* TAB 3: APPEARANCE */}
          {activeSubTab === 'appearance' && (
            <DashboardCard className="space-y-6">
              <h3 className="font-extrabold text-sm font-sans text-white mb-2">Display Theme</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'dark', name: 'Indigo Dark', desc: 'A calm dark canvas with indigo surfaces.', color: 'bg-slate-950 border-indigo-400/30' },
                  { id: 'light', name: 'Lavender Light', desc: 'Soft lavender canvas with clean white surfaces.', color: 'bg-white border-indigo-200' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleThemeChange(item.id as any)}
                    className={`p-4 rounded-2xl border text-xs text-left transition relative overflow-hidden bg-slate-900/10 ${
                      theme === item.id ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-white/5'
                    }`}
                  >
                    <span className="font-bold text-white font-sans block mb-1">{item.name}</span>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{item.desc}</p>
                    <div className="mt-3 flex gap-1 items-center">
                      <span className={`w-3.5 h-3.5 rounded-full ${item.color} border block`} />
                      {theme === item.id && <CheckCircle className="w-4.5 h-4.5 text-primary ml-auto" />}
                    </div>
                  </button>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeSubTab === 'notifications' && (
            <DashboardCard className="space-y-4">
              <h3 className="font-extrabold text-sm font-sans text-white mb-2">Notification Routing Preferences</h3>
              
              <div className="space-y-4 text-xs font-sans">
                {/* Switcher 1 */}
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Attendance Check-In Logs</span>
                    <p className="text-[10px] text-slate-400 leading-normal">Receive push logs upon biometric scan check-in.</p>
                  </div>
                  <button
                    onClick={() => setNotifyAttendance(!notifyAttendance)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                      notifyAttendance ? 'bg-primary' : 'bg-slate-800'
                    } relative flex items-center`}
                  >
                    <motion.span
                      animate={{ x: notifyAttendance ? 18 : 2 }}
                      className="w-3.5 h-3.5 bg-white rounded-full shadow"
                    />
                  </button>
                </div>

                {/* Switcher 2 */}
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Leave Approvals Status</span>
                    <p className="text-[10px] text-slate-400 leading-normal">Notify me immediately when leaves are approved/rejected.</p>
                  </div>
                  <button
                    onClick={() => setNotifyLeaves(!notifyLeaves)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                      notifyLeaves ? 'bg-primary' : 'bg-slate-800'
                    } relative flex items-center`}
                  >
                    <motion.span
                      animate={{ x: notifyLeaves ? 18 : 2 }}
                      className="w-3.5 h-3.5 bg-white rounded-full shadow"
                    />
                  </button>
                </div>

                {/* Switcher 3 */}
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Security Warnings Alerts</span>
                    <p className="text-[10px] text-slate-400 leading-normal">Send email warnings for failed login brute attacks (Admin Only).</p>
                  </div>
                  <button
                    onClick={() => setNotifySecurity(!notifySecurity)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                      notifySecurity ? 'bg-primary' : 'bg-slate-800'
                    } relative flex items-center`}
                  >
                    <motion.span
                      animate={{ x: notifySecurity ? 18 : 2 }}
                      className="w-3.5 h-3.5 bg-white rounded-full shadow"
                    />
                  </button>
                </div>
              </div>
            </DashboardCard>
          )}

          {/* TAB 5: ACTIVE SESSIONS */}
          {activeSubTab === 'devices' && (
            <DashboardCard className="space-y-4">
              <h3 className="font-extrabold text-sm font-sans text-white mb-2">Device Management</h3>
              
              <div className="space-y-3">
                {sessions.map((ses) => (
                  <div
                    key={ses.id}
                    className="p-4 border border-white/5 rounded-2xl bg-slate-950/20 flex justify-between items-center text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-sans">{ses.device}</span>
                        {ses.current && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        IP: {ses.ip} | Location: {ses.location}
                      </div>
                    </div>

                    {!ses.current && (
                      <button className="p-2 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-white/5 transition">
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

        </div>

      </div>

    </div>
  );
}
