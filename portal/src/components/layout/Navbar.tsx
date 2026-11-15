'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanFace, Shield, Sparkles, LogOut, ChevronDown } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#070A14]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/25 transition-transform duration-200 group-hover:scale-105">
              <ScanFace className="h-5 w-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-white">SmartFace</span>
              <span className="block text-[10px] font-medium tracking-wider uppercase text-indigo-400">Portal Suite</span>
            </div>
          </Link>

          {/* Role Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/5">
            {roleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  item.active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
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
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-medium">ArcFace 512d Online</span>
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
              <p className="text-[10px] text-gray-400 capitalize">{profile.role}</p>
            </div>
            <Link
              href="/"
              title="Switch Role or Exit to Landing"
              className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>

        </div>

      </div>

      {/* Mobile Role Switcher Bar */}
      <div className="flex md:hidden border-t border-white/5 bg-[#070A14] px-4 py-2 overflow-x-auto gap-2">
        {roleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap px-3 py-1 text-xs font-medium rounded-md ${
              item.active ? 'bg-indigo-600 text-white' : 'text-gray-400 bg-white/5'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
