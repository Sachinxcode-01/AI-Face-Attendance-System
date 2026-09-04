'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  LayoutDashboard,
  CalendarCheck,
  BarChart3,
  FileSpreadsheet,
  Bell,
  Users,
  Settings,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  Menu,
  ShieldAlert,
  Command,
  Sparkles,
  RefreshCw,
  Home
} from 'lucide-react';
import { UserAvatar, DeveloperRoleSwitcher } from './ui-helpers';
import { api } from '@/lib/api';
import GlobalChatbot from './global-chatbot';

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['student', 'parent', 'teacher', 'admin', 'super_admin'] },
  { name: 'Attendance', icon: CalendarCheck, path: '/dashboard?tab=attendance', roles: ['student', 'parent', 'teacher', 'admin'] },
  { name: 'Analytics', icon: BarChart3, path: '/dashboard?tab=analytics', roles: ['student', 'teacher', 'admin'] },
  { name: 'Reports', icon: FileSpreadsheet, path: '/dashboard/reports', roles: ['student', 'parent', 'teacher', 'admin'] },
  { name: 'Users', icon: Users, path: '/dashboard?tab=users', roles: ['admin'] },
  { name: 'Control Panel', icon: Command, path: '/dashboard?tab=control_panel', roles: ['super_admin'] },
  { name: 'Profile', icon: User, path: '/dashboard/profile', roles: ['student', 'parent', 'teacher', 'admin', 'super_admin'] },
  { name: 'Settings', icon: Settings, path: '/dashboard/settings', roles: ['student', 'parent', 'teacher', 'admin', 'super_admin'] }
];

// Extended Search Index Mock Data
const mockStudents = [
  { name: 'Alice Cooper', roll: 'CSE-2026-08', class: 'B.Tech CSE 6th Sem' },
  { name: 'Bob Dylan', roll: 'ECE-2026-12', class: 'B.Tech ECE 6th Sem' },
  { name: 'Charlie Watts', roll: 'ME-2026-22', class: 'B.Tech ME 4th Sem' },
];

const mockTeachers = [
  { name: 'Prof. Miller', dept: 'Computer Science', room: 'Lab 3B' },
  { name: 'Dr. Jane Goodall', dept: 'Biology', room: 'Seminar Room' },
];

const mockReports = [
  { name: 'Monthly Leaves Report May 2026', type: 'PDF' },
  { name: 'Incident Threat Sentinel Log', type: 'CSV' },
  { name: 'Attendance Sheet CSE-302', type: 'Google Sheets' },
];

interface AppShellProps {
  children: React.ReactNode;
}

type Role = 'student' | 'parent' | 'teacher' | 'admin' | 'super_admin';

// Friendly display names per role context
const ROLE_NAMES: Record<Role, string> = {
  student: 'Alice Cooper',
  parent: 'Mr. Cooper',
  teacher: 'Prof. Miller',
  admin: 'John Doe',
  super_admin: 'System Operator',
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-space" />}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}

function AppShellInner({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

  // App states
  const [role, setRole] = useState<Role>('admin');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const userName = ROLE_NAMES[role];

  // Resolve whether a nav item is the active route, accounting for ?tab= query params
  const isNavActive = (itemPath: string) => {
    const [base, query] = itemPath.split('?');
    const itemTab = query ? new URLSearchParams(query).get('tab') : null;
    if (itemTab) {
      return pathname === base && activeTab === itemTab;
    }
    if (base === '/dashboard') {
      return pathname === '/dashboard' && !activeTab;
    }
    return pathname === base || pathname.startsWith(base + '/');
  };

  // Navigate, closing the mobile drawer on selection
  const go = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  // Notifications Mock Feed
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'security', title: 'Critical Intruder Alert', message: 'Unknown guest face captured at Main Lobby Camera.', time: '2m ago', unread: true },
    { id: 2, type: 'leave', title: 'Leave Application Approved', message: 'Dean approved Alice Cooper\'s medical request.', time: '1h ago', unread: true },
    { id: 3, type: 'attendance', title: 'Check-In Success', message: 'Attendance logged for Deep Learning session CSE-302.', time: '3h ago', unread: false },
    { id: 4, type: 'system', title: 'Google Sheets Synced', message: 'Daily attendance sheet sync finished successfully.', time: '12h ago', unread: false }
  ]);



  // Command Search Results
  const [commandResults, setCommandResults] = useState<{ name: string; path: string; icon: React.ComponentType<{ className?: string }> }[]>([]);

  // Monitor keys for Ctrl+K command palette shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update command results when searching
  useEffect(() => {
    if (!searchQuery) {
      setCommandResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results: { name: string; path: string; icon: React.ComponentType<{ className?: string }> }[] = [];

    // Filter page navigation
    navItems
      .filter((item) => item.name.toLowerCase().includes(query))
      .forEach((item) => {
        results.push({ name: `Navigate to ${item.name}`, path: item.path, icon: item.icon });
      });

    // Filter students
    mockStudents
      .filter((s) => s.name.toLowerCase().includes(query) || s.roll.toLowerCase().includes(query))
      .forEach((s) => {
        results.push({ name: `Student: ${s.name} (${s.roll}) - ${s.class}`, path: `/dashboard?search=${s.name}`, icon: Users });
      });

    // Filter teachers
    mockTeachers
      .filter((t) => t.name.toLowerCase().includes(query) || t.dept.toLowerCase().includes(query))
      .forEach((t) => {
        results.push({ name: `Teacher: ${t.name} (${t.dept})`, path: `/dashboard?search=${t.name}`, icon: User });
      });

    // Filter reports
    mockReports
      .filter((r) => r.name.toLowerCase().includes(query))
      .forEach((r) => {
        results.push({ name: `Report: ${r.name} [${r.type}]`, path: `/dashboard/reports`, icon: FileSpreadsheet });
      });

    setCommandResults(results);
  }, [searchQuery]);

  const handleRoleChange = (newRole: 'student' | 'parent' | 'teacher' | 'admin' | 'super_admin') => {
    setRole(newRole);
    localStorage.setItem('userRole', newRole);
    router.refresh();
  };

  useEffect(() => {
    const stored = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    let resolvedRole = stored;

    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const decoded = JSON.parse(decodedJson);
        if (decoded.role && decoded.role !== stored) {
          console.warn("JWT claim role mismatch! Correcting local storage.");
          resolvedRole = decoded.role;
          localStorage.setItem('userRole', decoded.role);
        }
      } catch (e) {
        console.error("Failed to verify JWT claims:", e);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        router.push('/login');
        return;
      }
    } else if (!stored) {
      router.push('/login');
      return;
    }

    if (resolvedRole) {
      setRole(resolvedRole as 'student' | 'parent' | 'teacher' | 'admin' | 'super_admin');
    }
    
    // Initialise display theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.className = '';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (savedTheme === 'cyberpunk') {
      document.documentElement.classList.add('theme-cyberpunk');
    }
  }, [router]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.logout(token);
      }
    } catch (e) {
      console.error("Server logout error:", e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      router.push('/login');
    }
  };

  return (
    <div className="relative min-h-screen bg-space text-primary-text flex flex-col font-sans overflow-hidden transition-colors duration-300">
      
      {/* Dynamic Sandbox Role Context Switcher Bar */}
      <DeveloperRoleSwitcher currentRole={role} onRoleChange={handleRoleChange} />

      {/* Main shell split grid */}
      <div className="flex flex-1 relative">

        {/* Mobile sidebar backdrop */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Collapsible Sidebar */}
        <motion.aside
          animate={{ width: sidebarOpen ? 260 : 76 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`fixed md:static inset-y-0 left-0 border-r border-glass-border bg-glass backdrop-blur-xl flex flex-col z-50 shrink-0 transition-transform duration-300 md:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Brand header */}
          <div className="h-16 px-6 border-b border-glass-border flex items-center justify-between">
            <AnimatePresence mode="wait">
              {sidebarOpen ? (
                <motion.div
                  key="logo-expanded"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => router.push('/')}
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-extrabold text-sm tracking-tight text-white uppercase font-sans">
                    SmartFace <span className="text-primary font-mono text-xs font-black">AI</span>
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="logo-collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-full flex justify-center"
                >
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sidebar collapse toggle (desktop) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white transition p-1 hover:bg-white/5 rounded-lg hidden md:block cursor-pointer"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Close drawer (mobile) */}
            <button
              onClick={() => setMobileOpen(false)}
              className="text-slate-400 hover:text-white transition p-1 hover:bg-white/5 rounded-lg md:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Items List */}
          <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            {navItems
              .filter(item => item.roles.includes(role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = isNavActive(item.path);

                return (
                  <button
                    key={item.name}
                    onClick={() => go(item.path)}
                    title={!sidebarOpen ? item.name : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all group relative cursor-pointer ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(37,99,235,0.06)]'
                        : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'
                    } ${sidebarOpen ? '' : 'justify-center'}`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-white'}`} />
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-sans"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </button>
                );
              })}
          </nav>

          {/* Footer controls */}
          <div className="p-4 border-t border-glass-border space-y-2 bg-glass">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <UserAvatar name={userName} role={role} size="sm" />
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white/5 transition cursor-pointer"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex justify-center p-2.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-white/5 transition"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </motion.aside>

        {/* Core Layout Right Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Top Navbar */}
          <header className="h-16 px-6 border-b border-glass-border flex items-center justify-between bg-glass backdrop-blur-md">
            
            {/* Left side actions: Back button & Breadcrumbs */}
            <div className="flex items-center gap-4">
              {/* Mobile drawer trigger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 rounded-xl border border-glass-border bg-glass hover:bg-glass-hover text-muted hover:text-primary-text transition cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition group border border-glass-border bg-glass px-2.5 py-1.5 rounded-xl hover:bg-glass-hover cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back</span>
              </button>

              <div className="h-4 w-px bg-glass-border hidden sm:block" />

              {/* Breadcrumbs */}
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  <span>Home</span>
                </Link>
                <span>&gt;</span>
                {pathname.split('/').filter(Boolean).map((part, index, arr) => {
                  const href = '/' + arr.slice(0, index + 1).join('/');
                  const name = part.charAt(0).toUpperCase() + part.slice(1);
                  const isLast = index === arr.length - 1;
                  return (
                    <React.Fragment key={part}>
                      {isLast ? (
                        <span className="text-slate-300 font-bold">{name}</span>
                      ) : (
                        <Link href={href} className="hover:text-primary transition-colors">
                          {name}
                        </Link>
                      )}
                      {index < arr.length - 1 && <span>&gt;</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Right actions context */}
            <div className="flex items-center gap-3">
              {/* Refresh button */}
              <button
                onClick={() => router.refresh()}
                className="p-2 rounded-xl border border-glass-border bg-glass hover:bg-glass-hover text-muted hover:text-primary-text transition cursor-pointer"
                title="Refresh Page"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Search command launcher */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center justify-between px-3 py-1.5 w-36 sm:w-44 md:w-48 rounded-xl bg-glass border border-glass-border text-muted hover:text-primary-text hover:bg-glass-hover hover:border-glass-border-hover transition text-xs select-none cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  <span className="font-sans text-[11px] hidden sm:inline">Search...</span>
                </div>
                <div className="hidden sm:flex items-center gap-0.5 px-1 py-0.5 rounded bg-space border border-glass-border font-mono text-[8px] text-muted">
                  <span>⌘K</span>
                </div>
              </button>

              {/* Notifications Toggle */}
              <button
                onClick={() => setNotifOpen(true)}
                className="p-2.5 rounded-xl border border-glass-border bg-glass hover:bg-glass-hover text-muted hover:text-primary-text transition relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-space animate-pulse" />
                )}
              </button>

              <div className="h-8 w-px bg-glass-border hidden md:block" />

              {/* Profile Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 outline-none cursor-pointer"
                >
                  <UserAvatar name={userName} role={role} size="sm" />
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-white/10 p-2 shadow-2xl backdrop-blur-md z-55 flex flex-col gap-1 text-xs"
                    >
                      <div className="px-3 py-2 border-b border-white/5 font-sans">
                        <span className="font-bold text-white block">{userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5 uppercase tracking-wide">{role} Context</span>
                      </div>
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition font-sans"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition font-sans"
                      >
                        Settings
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition font-sans"
                      >
                        Security & sessions
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition font-sans"
                      >
                        Change Password
                      </Link>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition text-left w-full font-sans cursor-pointer"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </header>

          {/* Scrollable Workspace Dashboard Body */}
          <main className="flex-1 overflow-y-auto bg-transparent p-6 md:p-8">
            {children}
          </main>

        </div>

      </div>

      {/* ─── NOTIFICATION DRAWER ────────────────────────────────────── */}
      <AnimatePresence>
        {notifOpen && (
          <>
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotifOpen(false)}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
            />
            {/* Drawer body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 md:w-96 bg-space-light border-l border-glass-border shadow-2xl z-55 flex flex-col p-6"
            >
              <div className="flex items-center justify-between border-b border-glass-border pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-primary" />
                  <h3 className="font-extrabold text-sm font-sans">Notification Center</h3>
                  {unreadCount > 0 && (
                    <span className="bg-primary/20 text-primary border border-primary/20 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] text-primary hover:underline font-mono uppercase font-bold cursor-pointer"
                    >
                      Mark All Read
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 text-muted hover:text-primary-text rounded hover:bg-glass-hover transition cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Feed items */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed transition ${
                      n.unread
                        ? 'bg-primary/5 border-primary/20 shadow-[0_0_10px_rgba(37,99,235,0.02)]'
                        : 'bg-space border-glass-border'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="font-bold text-primary-text font-sans flex items-center gap-1.5">
                        {n.type === 'security' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                        {n.title}
                      </span>
                      <span className="font-mono text-[8px] text-slate-500 uppercase shrink-0">{n.time}</span>
                    </div>
                    <p className="text-muted font-sans text-[11px]">{n.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── COMMAND PALETTE SPOTLIGHT ───────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 bg-black/80 z-50 pointer-events-auto backdrop-blur-sm"
            />
            {/* Dialog panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-xl bg-space-light border border-glass-border rounded-2xl shadow-2xl z-55 overflow-hidden flex flex-col p-4"
            >
              {/* Search input line */}
              <div className="flex items-center gap-3 px-3 py-2 border-b border-glass-border">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type a command, shortcut, or search dashboard..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-slate-100 placeholder:opacity-60 outline-none w-full font-sans"
                  autoFocus
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-muted hover:text-primary-text transition font-mono text-[9px] border border-glass-border px-1.5 py-0.5 rounded bg-space"
                >
                  ESC
                </button>
              </div>

              {/* Navigation / Shortcuts */}
              <div className="py-2.5 max-h-75 overflow-y-auto space-y-1">
                {commandResults.length > 0 ? (
                  commandResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        router.push(item.path);
                        setSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-glass-hover transition text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 text-muted group-hover:text-primary-text">
                        <item.icon className="w-4 h-4 text-slate-400" />
                        <span className="font-sans">{item.name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  ))
                ) : searchQuery ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-sans">
                    No results matching &quot;{searchQuery}&quot; found.
                  </div>
                ) : (
                  <>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest px-3 py-1 font-bold">
                      Common Shortcuts
                    </div>
                    {[
                      { name: 'Change Role Context to Student', action: () => handleRoleChange('student') },
                      { name: 'Change Role Context to Teacher', action: () => handleRoleChange('teacher') },
                      { name: 'Change Role Context to Admin', action: () => handleRoleChange('admin') },
                      { name: 'Configure Security & MFA', path: '/dashboard/settings' },
                      { name: 'Export Monthly Report', path: '/dashboard/reports' }
                    ].map((shortcut, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (shortcut.action) {
                            shortcut.action();
                          } else if (shortcut.path) {
                            router.push(shortcut.path);
                          }
                          setSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-glass-hover transition text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 text-muted group-hover:text-primary-text">
                          <Command className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-sans">{shortcut.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 tracking-wider font-bold">Enter</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Persistent Global AI Assistant */}
      <GlobalChatbot />

    </div>
  );
}

