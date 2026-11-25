'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  BarChart3,
  Bot,
  UserRound,
  ScanFace,
  QrCode,
  MonitorPlay,
  UsersRound,
  FileCheck2,
  ShieldAlert,
  Eye,
  Cpu,
  FileTerminal,
  FileSpreadsheet,
  Settings2,
  Activity,
  Users,
  BellRing,
  UserRoundCheck,
  HeartHandshake,
  LogOut,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV: Record<string, NavItem[]> = {
  student: [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'Attendance', href: '/student/attendance', icon: ClipboardCheck },
    { label: 'Heatmap', href: '/student/attendance/heatmap', icon: CalendarDays },
    { label: 'Timetable', href: '/student/timetable', icon: CalendarDays },
    { label: 'Leave Requests', href: '/student/leave', icon: FileCheck2 },
    { label: 'Apply Leave', href: '/student/leave/apply', icon: ClipboardCheck },
    { label: 'Analytics', href: '/student/analytics', icon: BarChart3 },
    { label: 'Nexa AI Chat', href: '/student/ai-chat', icon: Bot },
    { label: 'Face Check-in', href: '/student/checkin', icon: ScanFace },
    { label: 'Profile', href: '/student/profile', icon: UserRound },
  ],
  teacher: [
    { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    { label: 'Sessions', href: '/teacher/sessions', icon: MonitorPlay },
    { label: 'New Session', href: '/teacher/sessions/create', icon: ClipboardCheck },
    { label: 'QR Projector', href: '/teacher/qr-projector', icon: QrCode },
    { label: 'Kiosk Mode', href: '/teacher/kiosk', icon: ScanFace },
    { label: 'Roster', href: '/teacher/roster', icon: UsersRound },
    { label: 'Leave Approvals', href: '/teacher/leave-approvals', icon: FileCheck2 },
    { label: 'Analytics', href: '/teacher/analytics', icon: BarChart3 },
    { label: 'Timetable', href: '/teacher/timetable', icon: CalendarDays },
    { label: 'Notifications', href: '/teacher/notifications', icon: BellRing },
    { label: 'Reports', href: '/teacher/reports', icon: FileSpreadsheet },
    { label: 'Profile', href: '/teacher/profile', icon: UserRound },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Telemetry', href: '/admin#telemetry', icon: Activity },
    { label: 'Intruder Sentinel', href: '/admin#sentinel', icon: ShieldAlert },
    { label: 'ArcFace Calibration', href: '/admin#calibration', icon: Cpu },
    { label: 'Super Admin', href: '/admin/super-admin', icon: Settings2 },
  ],
  super_admin: [
    { label: 'Super Admin Console', href: '/admin/super-admin', icon: Settings2 },
    { label: 'Admin Sentinel', href: '/admin', icon: LayoutDashboard },
    { label: 'Telemetry', href: '/admin#telemetry', icon: Activity },
    { label: 'Security', href: '/admin#sentinel', icon: ShieldAlert },
  ],
  parent: [
    { label: 'Dashboard', href: '/parent', icon: LayoutDashboard },
    { label: 'Children', href: '/parent#children', icon: HeartHandshake },
    { label: 'Notifications', href: '/parent#notifications', icon: BellRing },
    { label: 'Absence Notice', href: '/parent#leave', icon: FileCheck2 },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  student: 'Student Portal',
  teacher: 'Teacher Portal',
  admin: 'Admin Sentinel',
  parent: 'Parent Portal',
  super_admin: 'Super Admin Console',
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = (role && NAV[role]) || NAV.student;

  const isActive = (href: string) => {
    if (href === `/${role}`) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const content = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[#050507] shadow-lg shadow-accent/25">
          <ScanFace className="h-4 w-4" strokeWidth={2.4} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-white">SmartFace</p>
            <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-accent">
              {ROLE_LABEL[role ?? 'student']}
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto hidden rounded-full p-1 text-faint hover:bg-white/5 hover:text-white lg:block"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-full px-3.5 py-2.5 text-xs font-semibold transition-all ${active
                ? 'bg-white/[0.08] text-white shadow-sm border border-white/10'
                : 'text-mid hover:bg-white/[0.04] hover:text-white'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              title={item.label}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-accent' : 'text-faint group-hover:text-mid'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-3 border border-white/5">
          <Avatar src={user?.avatar} name={user?.name ?? 'User'} size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-hi">{user?.name}</p>
              <p className="truncate text-[10px] text-faint capitalize">{user?.role}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="rounded-full p-1.5 text-faint transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-white/[0.08] bg-[#050507]/95 backdrop-blur-xl transition-all duration-300 lg:block ${collapsed ? 'w-[72px]' : 'w-60'
          }`}
      >
        {content}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#050507]/90 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[#050507] shadow-lg shadow-accent/25">
            <ScanFace className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <span className="font-display text-sm font-bold text-white">SmartFace</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-300"
          aria-label="Open menu"
        >
          <Users className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-white/[0.08] bg-[#050507]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1 text-gray-500 hover:text-white"
              aria-label="Close menu"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
