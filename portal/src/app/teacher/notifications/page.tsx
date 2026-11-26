'use client';

import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTeacherNotificationsQuery,
  useTeacherAnnouncementsQuery,
  useTeacherDashboardQuery,
} from '@/features/teacher/teacher.queries';
import { teacherApi } from '@/features/teacher/teacher.api';
import { queryClient } from '@/core/query/queryClient';
import { teacherKeys } from '@/core/query/queryKeys';
import {
  Send, Megaphone, Bell, CheckCheck, Pin, Trash2, AlertTriangle, Plus,
} from 'lucide-react';

interface ReceivedNotification {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  is_read?: boolean;
  created_at?: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  target_scope: string;
  target_subject?: string;
  target_section?: string;
  target_semester?: string;
  status: string;
  pinned?: boolean;
  scheduled_for?: string;
  expires_at?: string;
  delivery_stats?: { recipients?: number; delivered?: number; failed?: number };
  created_at: string;
}

export default function TeacherNotificationsPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const [tab, setTab] = useState<'inbox' | 'broadcast' | 'announcements'>('inbox');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: dash } = useTeacherDashboardQuery(user?.email);
  const {
    data: notifData,
    isLoading: notifLoading,
    refetch: refetchNotifs,
  } = useTeacherNotificationsQuery(user?.email, { limit: 50 });

  const {
    data: annData,
    isLoading: annLoading,
    refetch: refetchAnns,
  } = useTeacherAnnouncementsQuery(user?.email);

  const notifications: ReceivedNotification[] = useMemo(() => {
    const items = (notifData?.notifications ?? []) as ReceivedNotification[];
    return unreadOnly ? items.filter((n) => !n.is_read) : items;
  }, [notifData, unreadOnly]);
  const unreadCount: number = notifData?.unread_count ?? 0;
  const announcements: AnnouncementItem[] = (annData?.announcements ?? []) as AnnouncementItem[];

  // Broadcast form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Normal' | 'High' | 'Critical'>('Normal');
  const [targetSubject, setTargetSubject] = useState('');
  const [targetSection, setTargetSection] = useState('');
  const [targetSemester, setTargetSemester] = useState('');
  const [confirmBroadcastOpen, setConfirmBroadcastOpen] = useState(false);
  const [sending, setSending] = useState(false);

      // Announcement composer
      const [annModalOpen, setAnnModalOpen] = useState(false);
      const [annForm, setAnnForm] = useState({
        title: '',
        message: '',
        category: 'class',
        priority: 'Normal',
        target_scope: 'department',
        target_subject: '',
        target_section: '',
        target_semester: '',
        status: 'published',
        scheduled_for: '',
        expires_at: '',
        pinned: false,
      });
      const [creatingAnn, setCreatingAnn] = useState(false);

      const handleMarkRead = async (id: string) => {
        try {
          await teacherApi.markNotificationRead(id);
          await queryClient.invalidateQueries({ queryKey: [...teacherKeys.all(user?.email), 'notifications'] });
          await queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard(user?.email) });
        } catch (err) {
          push(err instanceof Error ? err.message : 'Failed to mark read', 'error');
        }
      };

      const handleMarkAllRead = async () => {
        try {
          await teacherApi.markAllNotificationsRead();
          push('All notifications marked read', 'success');
          await queryClient.invalidateQueries({ queryKey: [...teacherKeys.all(user?.email), 'notifications'] });
          await queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard(user?.email) });
        } catch (err) {
          push(err instanceof Error ? err.message : 'Failed to mark all read', 'error');
        }
      };

      const handleConfirmBroadcast = async () => {
        setSending(true);
        try {
          const res = await teacherApi.broadcast(title.trim(), message.trim(), priority, {
            subject: targetSubject.trim() || undefined,
            section: targetSection.trim() || undefined,
            semester: targetSemester.trim() || undefined,
          }) as { delivered?: number; message?: string };
          push(res?.message || `Broadcast sent to ${res?.delivered ?? 0} authorised student(s)`, 'success');
          setConfirmBroadcastOpen(false);
          setTitle('');
          setMessage('');
        } catch (err) {
          push(err instanceof Error ? err.message : 'Broadcast failed', 'error');
        } finally {
          setSending(false);
        }
      };

      const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingAnn(true);
        try {
          await teacherApi.createAnnouncement({
            ...annForm,
            title: annForm.title.trim(),
            message: annForm.message.trim(),
            scheduled_for: annForm.scheduled_for || undefined,
            expires_at: annForm.expires_at || undefined,
          });
          push(annForm.status === 'published' ? 'Announcement published to authorised students' : `Announcement saved as ${annForm.status}`, 'success');
          setAnnModalOpen(false);
          setAnnForm({
            title: '',
            message: '',
            category: 'class',
            priority: 'Normal',
            target_scope: 'department',
            target_subject: '',
            target_section: '',
            target_semester: '',
            status: 'published',
            scheduled_for: '',
            expires_at: '',
            pinned: false,
          });
          await refetchAnns();
        } catch (err) {
          push(err instanceof Error ? err.message : 'Failed to publish announcement', 'error');
        } finally {
          setCreatingAnn(false);
        }
      };

      const handleDeleteAnnouncement = async (id: string) => {
        try {
          await teacherApi.deleteAnnouncement(id);
          push('Announcement removed', 'info');
          await refetchAnns();
        } catch (err) {
          push(err instanceof Error ? err.message : 'Failed to delete announcement', 'error');
        }
      };

      return (
        <DashboardLayout>
          <Toasts toasts={toasts} dismiss={dismiss} />
          <PageHeader
            kicker="Institutional Comms"
            title="Notifications & Announcements"
            subtitle="Review institutional alerts, broadcast scoped notices, and publish pinned academic announcements."
            actions={
              <div className="flex flex-wrap gap-2">
                {unreadCount > 0 && (
                  <Button variant="secondary" onClick={handleMarkAllRead}>
                    <CheckCheck className="h-3.5 w-3.5" /> Mark All Read ({unreadCount})
                  </Button>
                )}
                <Button onClick={() => setAnnModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> New Announcement
                </Button>
              </div>
            }
          />

                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <Tabs
                    active={tab}
                    onChange={(k) => setTab(k)}
                    tabs={[
                      { value: 'inbox', label: `My Inbox (${unreadCount})` },
                      { value: 'announcements', label: `Published Announcements (${announcements.length})` },
                      { value: 'broadcast', label: 'Quick Broadcast' },
                    ]}
                  />
                  {tab === 'inbox' && (
                    <label className="flex items-center gap-2 text-xs text-mid">
                      <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
                      Unread only
                    </label>
                  )}
                </div>

                {tab === 'inbox' && (
                  <Card>
                    <CardHeader
                      icon={<Bell className="h-4 w-4" />}
                      title="Faculty Notification Inbox"
                      subtitle="Leave submissions, dispute escalations, session events, and admin notices."
                      right={
                        <Button variant="ghost" onClick={() => refetchNotifs()}>
                          Refresh
                        </Button>
                      }
                    />
                    {notifLoading ? (
                      <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
                    ) : notifications.length === 0 ? (
                      <EmptyState icon={<Bell className="h-6 w-6" />} title="No notifications" body={unreadOnly ? 'All notifications are read.' : 'Your notification inbox is empty.'} />
                    ) : (
                      <div className="space-y-2.5">
                        {notifications.map((n) => {
                          const nid = n.id || n._id || '';
                          return (
                            <div
                              key={nid}
                              className={`flex flex-wrap items-start justify-between gap-3 rounded-2xl border p-4 ${n.is_read ? 'border-white/5 bg-white/[0.015]' : 'border-accent/30 bg-accent/[0.04]'
                                }`}
                            >
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-display text-sm font-semibold text-hi">{n.title}</span>
                                  {n.priority && <Badge tone={statusTone(n.priority)}>{n.priority}</Badge>}
                                  {!n.is_read && <Badge tone="info">Unread</Badge>}
                                </div>
                                <p className="text-xs text-mid">{n.message}</p>
                                {n.created_at && (
                                  <p className="text-[10px] text-faint">{new Date(n.created_at).toLocaleString()}</p>
                                )}
                              </div>
                              {!n.is_read && nid && (
                                <Button variant="ghost" onClick={() => handleMarkRead(nid)}>
                                  Mark Read
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                )}

                {tab === 'announcements' && (
                  <Card>
                    <CardHeader
                      icon={<Megaphone className="h-4 w-4" />}
                      title="Faculty Announcements Ledger"
                      subtitle="Draft, scheduled, and published notices scoped to your classes and department."
                    />
                    {annLoading ? (
                      <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
                    ) : announcements.length === 0 ? (
                      <EmptyState
                        icon={<Megaphone className="h-6 w-6" />}
                        title="No announcements created yet"
                        body="Create an announcement for schedule changes, deadlines, or attendance policies."
                        action={<Button onClick={() => setAnnModalOpen(true)}><Plus className="h-3.5 w-3.5" /> Create Announcement</Button>}
                      />
                    ) : (
                      <div className="space-y-3">
                        {announcements.map((a) => (
                          <div key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  {a.pinned && <Pin className="h-3.5 w-3.5 text-accent" />}
                                  <span className="font-display text-sm font-bold text-hi">{a.title}</span>
                                  <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                                  <Badge tone={statusTone(a.priority)}>{a.priority}</Badge>
                                  <Badge tone="neutral">{a.category}</Badge>
                                </div>
                                <p className="text-xs text-mid">{a.message}</p>
                                <p className="text-[11px] text-faint">
                                  Scope: {a.target_scope}
                                  {a.target_subject ? ` • Subject: ${a.target_subject}` : ''}
                                  {a.target_semester ? ` • Sem ${a.target_semester}` : ''}
                                  {a.target_section ? ` • Sec ${a.target_section}` : ''}
                                  {a.delivery_stats?.recipients !== undefined ? ` • Delivered ${a.delivery_stats.delivered ?? 0}/${a.delivery_stats.recipients}` : ''}
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteAnnouncement(a.id)}
                                className="rounded-full p-2 text-faint hover:bg-red-500/10 hover:text-red-400"
                                title="Delete announcement"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {tab === 'broadcast' && (
                  <div className="max-w-2xl">
                    <Card>
                      <CardHeader
                        icon={<Megaphone className="h-4 w-4" />}
                        title="Scoped Classroom Broadcast"
                        subtitle="Send an instant alert to students in your authorised institution, optionally narrowed by subject, semester, or section."
                      />
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!title.trim() || !message.trim()) return;
                          setConfirmBroadcastOpen(true);
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-mid">Subject / Title</label>
                          <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            maxLength={120}
                            placeholder="e.g., CS301 Lab Rescheduled to 3 PM"
                            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-hi placeholder-faint focus:border-accent focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-mid">Subject (Optional)</label>
                            <select
                              value={targetSubject}
                              onChange={(e) => setTargetSubject(e.target.value)}
                              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                            >
                              <option value="">All Department Students</option>
                              {(dash?.assigned_subjects ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-mid">Semester (Optional)</label>
                            <input
                              value={targetSemester}
                              onChange={(e) => setTargetSemester(e.target.value)}
                              placeholder="e.g., 5"
                              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-mid">Section (Optional)</label>
                            <input
                              value={targetSection}
                              onChange={(e) => setTargetSection(e.target.value)}
                              placeholder="e.g., A"
                              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-mid">Message</label>
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            maxLength={1000}
                            rows={4}
                            placeholder="Write your announcement clearly for students..."
                            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-hi placeholder-faint focus:border-accent focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-mid">Priority</label>
                          <div className="flex flex-wrap gap-2">
                            {(['Low', 'Normal', 'High', 'Critical'] as const).map((p) => (
                              <button
                                type="button"
                                key={p}
                                onClick={() => setPriority(p)}
                                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${priority === p
                                    ? p === 'Critical'
                                      ? 'bg-red-500 text-white'
                                      : p === 'High'
                                        ? 'bg-amber-500 text-black'
                                        : 'bg-accent text-black'
                                    : 'border border-white/10 bg-white/5 text-mid hover:text-hi'
                                  }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button type="submit">
                            <Send className="h-3.5 w-3.5" /> Review &amp; Send Broadcast
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </div>
                )}

                {/* Broadcast Confirmation Modal */}
                <Modal
                  open={confirmBroadcastOpen}
                  onClose={() => setConfirmBroadcastOpen(false)}
                  title="Confirm Bulk Broadcast"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">This alert will be sent immediately via WebSocket &amp; Inbox.</p>
                        <p className="mt-1">
                          Scope: {targetSubject || 'Department-wide'}
                          {targetSemester ? ` • Sem ${targetSemester}` : ''}
                          {targetSection ? ` • Sec ${targetSection}` : ''} • Priority: {priority}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                      <p className="font-semibold text-hi">{title}</p>
                      <p className="mt-1 text-mid">{message}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setConfirmBroadcastOpen(false)}>Cancel</Button>
                      <Button onClick={handleConfirmBroadcast} loading={sending}>
                        <Send className="h-3.5 w-3.5" /> Confirm &amp; Deliver
                      </Button>
                    </div>
                  </div>
                </Modal>

                {/* New Announcement Modal */}
                <Modal
                  open={annModalOpen}
                  onClose={() => setAnnModalOpen(false)}
                  title="Create Academic Announcement"
                  wide
                >
                  <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold text-mid">Title</label>
                        <input
                          required
                          maxLength={160}
                          value={annForm.title}
                          onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                          placeholder="Mid-semester attendance shortage warning"
                          className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                        />
                      </div>
                      <div>
              <label className="mb-1.5 block text-xs font-semibold text-mid">Category</label>
                        <select
                          value={annForm.category}
                          onChange={(e) => setAnnForm({ ...annForm, category: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                        >
                          <option value="class">Class</option>
                          <option value="subject">Subject</option>
                          <option value="attendance_reminder">Attendance Reminder</option>
                          <option value="schedule_update">Schedule Update</option>
                          <option value="deadline">Deadline</option>
                          <option value="exam">Exam</option>
                          <option value="instruction">Instruction</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-mid">Announcement Body</label>
                      <textarea
                        required
                        rows={3}
                        maxLength={2000}
                        value={annForm.message}
                        onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-mid">Target Scope</label>
                        <select
                          value={annForm.target_scope}
                          onChange={(e) => setAnnForm({ ...annForm, target_scope: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                        >
                          <option value="department">Department</option>
                          <option value="subject">Subject</option>
                          <option value="class">Specific Class</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-mid">Subject</label>
                        <input
                          value={annForm.target_subject}
                          onChange={(e) => setAnnForm({ ...annForm, target_subject: e.target.value })}
                          placeholder="CS301"
                          className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-mid">Semester</label>
                        <input
                          value={annForm.target_semester}
                          onChange={(e) => setAnnForm({ ...annForm, target_semester: e.target.value })}
                          placeholder="5"
                          className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                        />
                      </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-mid">Section</label>
                  <input
                    value={annForm.target_section}
                    onChange={(e) => setAnnForm({ ...annForm, target_section: e.target.value })}
                    placeholder="A"
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                  />
                </div>
              </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-mid">Publish Mode</label>
                        <select
                          value={annForm.status}
                          onChange={(e) => setAnnForm({ ...annForm, status: e.target.value })}
                          className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                        >
                          <option value="published">Publish Immediately</option>
                          <option value="scheduled">Schedule for Later</option>
                          <option value="draft">Save as Draft</option>
                        </select>
                      </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-mid">Priority</label>
                          <select
                            value={annForm.priority}
                            onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}
                            className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                          >
                            <option value="Low">Low</option>
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-mid">Expires At (Optional)</label>
                            <input
                              type="date"
                              value={annForm.expires_at}
                              onChange={(e) => setAnnForm({ ...annForm, expires_at: e.target.value })}
                              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi"
                            />
                          </div>
                        </div>

                          <label className="flex items-center gap-2 text-xs text-mid">
                            <input
                              type="checkbox"
                              checked={annForm.pinned}
                              onChange={(e) => setAnnForm({ ...annForm, pinned: e.target.checked })}
                            />
                            Pin announcement to top of class feed
                          </label>

                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setAnnModalOpen(false)}>Cancel</Button>
                            <Button type="submit" loading={creatingAnn}>Save Announcement</Button>
                          </div>
                    </form>
                  </Modal>
                </DashboardLayout>
                );
}