'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

const ROLE_PATHS: Record<string, string> = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
  parent: '/parent',
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { authed, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!authed) {
      router.replace('/auth/login');
      return;
    }
    if (role && !pathname.startsWith(ROLE_PATHS[role])) {
      router.replace(ROLE_PATHS[role]);
    }
}, [authed, role, loading, pathname, router]);

// GSAP page transition on route change
useEffect(() => {
  if (!contentRef.current) return;
  const ctx = gsap.context(() => {
    gsap.fromTo(
      '.page-enter',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.05 }
    );
  }, contentRef);
  return () => ctx.revert();
}, [pathname]);

if (loading || !authed) return null;

return (
  <div className="min-h-screen bg-[#070A14] text-[#C8CCDF]">
    <Sidebar />
    <div className="lg:pl-60">
      <main ref={contentRef} className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div key={pathname}>{children}</div>
      </main>
    </div>
  </div>
);
}
