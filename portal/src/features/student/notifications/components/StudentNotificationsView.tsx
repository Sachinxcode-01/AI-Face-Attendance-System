'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { BellRing, Megaphone, CheckCheck, RefreshCw, AlertCircle, Pin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { useAttendanceLive } from '@/hooks/useAttendanceLive';
import {
  useStudentNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../notifications.queries';

export function StudentNotificationsView() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'notifications' | 'announcements'>('notifications');
  const [typeFilter, setTypeFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading: loading, error: queryError, refetch } = useStudentNotificationsQuery(user?.email, {
    type: typeFilter,
    unread: unreadOnly,
    search,
  });
  const markRead = useMarkNotificationReadMutation(user?.email);
  const markAllRead = useMarkAllNotificationsReadMutation(user?.email);

  useAttendanceLive({
    channel: 'notifications',
    invalidateStudentCache: true,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const announcements = data?.announcements ?? [];
  const error = queryError ? (queryError instanceof ApiError ? queryError.message : 'Unable to load notifications.') : '';

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Communication"
        title="Notifications & Announcements"
        subtitle="Real-time attendance confirmations, shortage warnings, leave decisions, and institutional notices."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              tabs={[
                { value: 'notifications', label: `Notifications (${unreadCount})` },
                { value: 'announcements', label: `Announcements (${announcements.length})` },
              ]}
              active={tab}
              onChange={setTab}
            />
            {tab === 'notifications' && unreadCount > 0 && (
              <Button variant="secondary" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending} className="h-8 px-3 text-xs">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <Card className="mb-6 border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center justify-between text-xs text-red-200">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-400" /> {error}</span>
            <Button variant="secondary" onClick={() => refetch()} className="h-8 px-3 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        </Card>
      )}

      {tab === 'notifications' ? (
        <Card className="page-enter p-6">
          <CardHeader
            icon={<BellRing className="h-5 w-5 text-accent" />}
            title="Notification Feed"
            right={
              <button
                onClick={() => setUnreadOnly((u) => !u)}
                className={`chip-bytune h-7 px-3 text-[11px] ${unreadOnly ? 'chip-bytune-active' : ''}`}
              >
                Unread only
              </button>
            }
          />
          <div className="mb-4 flex flex-wrap gap-2">
            {['all', 'attendance', 'leave_status', 'announcement', 'session_alert', 'security'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`chip-bytune h-7 px-3 text-[11px] ${typeFilter === t ? 'chip-bytune-active' : ''}`}
              >
                {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-8 text-center font-mono text-xs text-faint">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <p className="py-8 text-center font-mono text-xs text-faint">No notifications match your current filter.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`rounded-[16px] border p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
                    n.is_read ? 'border-white/[0.06] bg-white/[0.01]' : 'border-accent/30 bg-accent/5'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-hi">{n.title}</span>
                      <Badge tone={statusTone(String(n.priority || 'info').toLowerCase())}>{n.priority || 'Info'}</Badge>
                      {!n.is_read && <Badge tone="purple">Unread</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-mid">{n.message}</p>
                    <p className="mt-1 font-mono text-[10px] text-faint">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                  {!n.is_read && (
                    <Button variant="ghost" onClick={() => markRead.mutate(n.id)} className="h-7 px-3 text-[11px] shrink-0">
                      Mark read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card className="page-enter p-6">
          <CardHeader icon={<Megaphone className="h-5 w-5 text-accent" />} title="Institutional Announcements" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="mb-4 w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-xs text-hi placeholder:text-faint focus:border-accent focus:outline-none"
          />
          {loading ? (
            <p className="py-8 text-center font-mono text-xs text-faint">Loading announcements…</p>
          ) : announcements.length === 0 ? (
            <p className="py-8 text-center font-mono text-xs text-faint">No institutional announcements posted yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a: any) => (
                <div key={a.id} className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-accent" />}
                      <span className="text-sm font-semibold text-hi">{a.title}</span>
                      <Badge tone={statusTone(String(a.priority || 'info').toLowerCase())}>{a.priority}</Badge>
                    </div>
                    <span className="font-mono text-[10.5px] text-faint">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-mid">{a.message}</p>
                  <p className="mt-1.5 font-mono text-[10px] text-faint">From: {a.sender}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </DashboardLayout>
  );
}
