'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle, User } from 'lucide-react';

// Reusable Dashboard Card
interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function DashboardCard({ children, className = '', glow = false }: DashboardCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`glass-panel rounded-2xl p-6 relative overflow-hidden backdrop-blur-md ${
        glow ? 'shadow-[0_0_20px_rgba(37,99,235,0.08)] border-primary/20' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Reusable Status Badge
interface StatusBadgeProps {
  status: 'Present' | 'Absent' | 'Late' | 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Expired';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let Icon = CheckCircle;

  if (status === 'Absent' || status === 'Rejected' || status === 'Expired') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    Icon = ShieldAlert;
  } else if (status === 'Late' || status === 'Pending') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    Icon = AlertTriangle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${styles}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{status}</span>
    </span>
  );
}

// Interactive Dev Role Switcher
interface DevSwitcherProps {
  currentRole: string;
  onRoleChange: (role: 'student' | 'parent' | 'teacher' | 'admin') => void;
}

export function DeveloperRoleSwitcher({ currentRole, onRoleChange }: DevSwitcherProps) {
  const roles: ('student' | 'parent' | 'teacher' | 'admin')[] = ['student', 'parent', 'teacher', 'admin'];

  return (
    <div className="bg-slate-950/90 border-b border-white/10 px-4 py-2 flex items-center justify-between gap-4 text-xs z-50">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="font-mono text-slate-400 uppercase tracking-widest font-bold text-[10px]">
          Developer Sandbox Context:
        </span>
      </div>
      <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-white/5">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
            className={`px-3 py-1 rounded-md font-mono transition uppercase text-[9px] font-bold ${
              currentRole === role
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
}

// User Avatar component
interface UserAvatarProps {
  name: string;
  role?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ name, role, size = 'md', className = '' }: UserAvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold font-sans text-white border border-white/10 shadow-inner relative overflow-hidden`}>
        {initials || <User className="w-4 h-4" />}
      </div>
      {role && (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white font-sans">{name}</span>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">{role}</span>
        </div>
      )}
    </div>
  );
}

// Skeleton Loader
export function SkeletonLoader({ className = '', count = 1 }) {
  return (
    <div className="space-y-2 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-slate-800/40 rounded animate-pulse w-full border border-white/5 ${className}`}
        />
      ))}
    </div>
  );
}

// Empty State View
export function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900/10 border border-white/5 rounded-2xl backdrop-blur-sm min-h-[200px]">
      {Icon && <Icon className="w-10 h-10 text-slate-500 mb-3" />}
      <h4 className="text-sm font-bold text-white mb-1 font-sans">{title}</h4>
      <p className="text-xs text-slate-400 max-w-xs font-sans leading-relaxed">{description}</p>
    </div>
  );
}
