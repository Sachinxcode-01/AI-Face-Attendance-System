'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SkeletonLoader } from '@/components/portal/ui-helpers';

// Dynamically import portal screens to optimize bundle sizes
import StudentDashboard from '@/components/portal/dashboards/student-dashboard';
import ParentDashboard from '@/components/portal/dashboards/parent-dashboard';
import TeacherDashboard from '@/components/portal/dashboards/teacher-dashboard';
import AdminDashboard from '@/components/portal/dashboards/admin-dashboard';
import SuperAdminDashboard from '@/components/portal/dashboards/super-admin-dashboard';

function DashboardHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const [role, setRole] = useState<'student' | 'parent' | 'teacher' | 'admin' | 'super_admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check user credentials session from local storage
    const storedRole = localStorage.getItem('userRole');
    if (!storedRole) {
      router.push('/login');
    } else {
      setRole(storedRole as 'student' | 'parent' | 'teacher' | 'admin' | 'super_admin' | null);
      setLoading(false);
    }
  }, [router, searchParams]); // Reload when query params or roles change

  if (loading || !role) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12">
        <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
        <SkeletonLoader count={4} className="h-32 rounded-2xl" />
      </div>
    );
  }

  // Route layout tabs
  if (tab === 'attendance') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-black text-white font-sans uppercase">Attendance Records</h2>
        {role === 'student' && <StudentDashboard forceTab="attendance" />}
        {role === 'parent' && <ParentDashboard forceTab="attendance" />}
        {role === 'teacher' && <TeacherDashboard forceTab="attendance" />}
        {role === 'admin' && <AdminDashboard forceTab="attendance" />}
      </div>
    );
  }

  if (tab === 'analytics') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-black text-white font-sans uppercase">Performance Analytics</h2>
        {role === 'student' && <StudentDashboard forceTab="analytics" />}
        {role === 'teacher' && <TeacherDashboard forceTab="analytics" />}
        {role === 'admin' && <AdminDashboard forceTab="analytics" />}
      </div>
    );
  }

  if (tab === 'users' && role === 'admin') {
    return <AdminDashboard forceTab="users" />;
  }

  if (tab === 'control_panel' && role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  // Fallback to default dashboard home views
  switch (role) {
    case 'student':
      return <StudentDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'admin':
    default:
      return <AdminDashboard />;
  }
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 max-w-4xl mx-auto py-12">
        <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
        <SkeletonLoader count={4} className="h-32 rounded-2xl" />
      </div>
    }>
      <DashboardHub />
    </Suspense>
  );
}
