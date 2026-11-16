'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanFace, LogOut } from 'lucide-react';
import { DEMO_PROFILES } from '@/lib/demo-data';

interface NavbarProps {
  currentRole?: 'student' | 'teacher' | 'admin' | 'parent';
}

export function Navbar({ currentRole = 'student' }: NavbarProps) {
  const pathname = usePathname();
  const profile = DEMO_PROFILES[currentRole] || DEMO_PROFILES.student;

  const roleNavItems = [
    { label: 'Student', href: '/student', active: pathname.startsWith('/student') },
    { label: 'Teacher', href: '/teacher', active: pathname.startsWith('/teacher') },
    { label: 'Admin Sentinel', href: '/admin', active: pathname.startsWith('/admin') },
    { label: 'Parent', href: '/parent', active: pathname.startsWith('/parent') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.08)] bg-[#050507]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[#050507] shadow-lg shadow-accent/20 transition-transform duration-200 group-hover:scale-105">
              <ScanFace className="h-4 w-4" strokeWidth={2.4} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <span className="font-display text-base font-semibold tracking-tight text-white">SmartFace</span>
              <span className="block text-[9px] font-mono uppercase tracking-[0.2em] text-accent">Portal Suite</span>
            </div>
          </Link>

          {/* Role Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/[0.03] p-1 border border-white/5">
            {roleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  item.active
                    ? 'bg-white text-[#050507] font-bold shadow-sm'
                    : 'text-mid hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Status & User Profile */}
        <div className="flex items-center gap-3">
          
          {/* Live Telemetry Pill */}
          <div className="hidden sm:flex items-center gap-2 chip-bytune h-7 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10.5px]">ArcFace 512d Online</span>
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] pl-2 pr-3 py-1">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20"
            />
            <div className="hidden lg:block text-left text-xs leading-none">
              <p className="font-semibold text-white">{profile.name}</p>
              <p className="text-[10px] text-faint capitalize">{profile.role}</p>
            </div>
            <Link
              href="/"
              title="Switch Role or Exit to Landing"
              className="ml-1 text-faint hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>

        </div>

      </div>

      {/* Mobile Role Switcher Bar */}
      <div className="flex md:hidden border-t border-white/5 bg-[#050507] px-4 py-2 overflow-x-auto gap-2">
        {roleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap px-3 py-1 text-xs font-medium rounded-full ${
              item.active ? 'bg-white text-[#050507] font-bold' : 'text-mid bg-white/5'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
