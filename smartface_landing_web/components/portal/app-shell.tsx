'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  LogOut,
  X,
  ShieldAlert,
  Command,
  Sparkles
} from 'lucide-react';
import { UserAvatar, DeveloperRoleSwitcher } from './ui-helpers';
import { api } from '@/lib/api';

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['student', 'parent', 'teacher', 'admin'] },
  { name: 'Attendance', icon: CalendarCheck, path: '/dashboard?tab=attendance', roles: ['student', 'parent', 'teacher', 'admin'] },
  { name: 'Analytics', icon: BarChart3, path: '/dashboard?tab=analytics', roles: ['student', 'teacher', 'admin'] },
  { name: 'Reports', icon: FileSpreadsheet, path: '/dashboard/reports', roles: ['student', 'parent', 'teacher', 'admin'] },
  { name: 'Users', icon: Users, path: '/dashboard?tab=users', roles: ['admin'] },
  { name: 'Profile', icon: User, path: '/dashboard/profile', roles: ['student', 'parent', 'teacher', 'admin'] },
  { name: 'Settings', icon: Settings, path: '/dashboard/settings', roles: ['student', 'parent', 'teacher', 'admin'] }
];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // App states
  const [role, setRole] = useState<'student' | 'parent' | 'teacher' | 'admin'>('admin');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications Mock Feed
  const [notifications] = useState([
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
    const filtered = navItems
      .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((item) => ({ name: `Navigate to ${item.name}`, path: item.path, icon: item.icon }));
    setCommandResults(filtered);
  }, [searchQuery]);

  const handleRoleChange = (newRole: 'student' | 'parent' | 'teacher' | 'admin') => {
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
      setRole(resolvedRole as 'student' | 'parent' | 'teacher' | 'admin');
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
        
        {/* Collapsible Sidebar */}
        <motion.aside
          animate={{ width: sidebarOpen ? 260 : 76 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="border-r border-glass-border bg-glass backdrop-blur-xl flex flex-col z-45 shrink-0"
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

            {/* Sidebar toggle button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white transition p-1 hover:bg-white/5 rounded-lg hidden md:block"
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items List */}
          <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            {navItems
              .filter(item => item.roles.includes(role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || (item.path.includes('tab') && pathname.includes('tab'));

                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all group relative ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(37,99,235,0.06)]'
                        : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-white'}`} />
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
                <UserAvatar name={role === 'admin' ? 'John Doe' : role === 'teacher' ? 'Prof. Miller' : role === 'parent' ? 'Mr. Cooper' : 'Alice Cooper'} role={role} size="sm" />
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white/5 transition"
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
            
            {/* Search command launcher */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-between px-3 py-2 w-48 md:w-64 rounded-xl bg-glass border border-glass-border text-muted hover:text-primary-text hover:bg-glass-hover hover:border-glass-border-hover transition text-xs select-none"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span className="font-sans text-[11px]">Search everywhere...</span>
              </div>
              <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-space border border-glass-border font-mono text-[9px] text-muted">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            </button>

            {/* Right actions context */}
            <div className="flex items-center gap-3">
              {/* Notifications Toggle */}
              <button
                onClick={() => setNotifOpen(true)}
                className="p-2.5 rounded-xl border border-glass-border bg-glass hover:bg-glass-hover text-muted hover:text-primary-text transition relative"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-space animate-pulse" />
                )}
              </button>

              <div className="h-8 w-[1px] bg-glass-border hidden md:block" />

              {/* Identity details */}
              <div className="hidden md:flex items-center gap-2">
                <UserAvatar name={role === 'admin' ? 'John Doe' : role === 'teacher' ? 'Prof. Miller' : role === 'parent' ? 'Mr. Cooper' : 'Alice Cooper'} role={role} size="sm" />
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
              className="absolute inset-0 bg-black z-50 pointer-events-auto"
            />
            {/* Drawer body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 md:w-96 bg-space-light border-l border-glass-border shadow-2xl z-55 flex flex-col p-6"
            >
              <div className="flex items-center justify-between border-b border-glass-border pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-primary" />
                  <h3 className="font-extrabold text-sm font-sans">Notification Center</h3>
                  {unreadCount > 0 && (
                    <span className="bg-primary/20 text-primary border border-primary/20 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1 text-muted hover:text-primary-text rounded hover:bg-glass-hover transition"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Feed items */}
              <div className="flex-1 overflow-y-auto space-y-3">
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
              className="absolute inset-0 bg-black/80 z-50 pointer-events-auto backdrop-blur-sm"
            />
            {/* Dialog panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-xl bg-space-light border border-glass-border rounded-2xl shadow-2xl z-55 overflow-hidden flex flex-col p-4"
            >
              {/* Search input line */}
              <div className="flex items-center gap-3 px-3 py-2 border-b border-glass-border">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type a command, shortcut, or search dashboard..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-primary-text placeholder-slate-500 outline-none w-full font-sans"
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
              <div className="py-2.5 max-h-[300px] overflow-y-auto space-y-1">
                {commandResults.length > 0 ? (
                  commandResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        router.push(item.path);
                        setSearchOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-glass-hover transition text-left group"
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
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-glass-hover transition text-left group"
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

    </div>
  );
}
