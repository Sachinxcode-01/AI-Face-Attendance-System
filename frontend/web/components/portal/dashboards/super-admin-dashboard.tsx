'use client';

import React, { useEffect, useState } from 'react';
import { 
  Server, 
  Activity, 
  Database, 
  Layers, 
  Trash2, 
  Monitor, 
  Smartphone, 
  RefreshCw,
  LogOut,
  Clock,
  Terminal,
  ServerCrash
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardCard, StatusBadge, SkeletonLoader, EmptyState } from '../ui-helpers';

interface Session {
  session_id: string;
  user_email: string;
  device_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_active: string;
  is_active: boolean;
}

interface DBStats {
  collections: Record<string, number>;
  database_name: string;
  timestamp: string;
}

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function SuperAdminDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dbStats, setDbStats] = useState<DBStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'sessions' | 'database' | 'audits'>('sessions');

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token') || '';
      
      // Fetch Active Sessions
      const sessionsData = await api.getSessions(token);
      setSessions(sessionsData);

      // Fetch DB stats
      const statsData = await api.getSystemDbStats(token);
      setDbStats(statsData);

      // Fetch Audit logs
      const auditsData = await api.getSystemAuditLogs(token);
      setAuditLogs(auditsData);
      
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to fetch control panel system telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      await api.revokeSession(sessionId, token);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke session');
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm('Are you sure you want to terminate all other active user sessions?')) return;
    try {
      const token = localStorage.getItem('token') || '';
      await api.logoutAll(token);
      // Re-fetch sessions list
      fetchData(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke all sessions');
    }
  };

  const parseUA = (uaString: string) => {
    const ua = uaString.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    const os = /windows/i.test(ua) ? 'Windows' :
               /macintosh|mac os/i.test(ua) ? 'macOS' :
               /linux/i.test(ua) ? 'Linux' :
               /android/i.test(ua) ? 'Android' :
               /iphone|ipad/i.test(ua) ? 'iOS' : 'Other OS';

    const browser = /chrome/i.test(ua) ? 'Chrome' :
                    /firefox/i.test(ua) ? 'Firefox' :
                    /safari/i.test(ua) ? 'Safari' :
                    /edge/i.test(ua) ? 'Edge' : 'Other Browser';

    return { isMobile, os, browser };
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="h-6 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SkeletonLoader count={1} className="h-28 rounded-2xl" />
          <SkeletonLoader count={1} className="h-28 rounded-2xl" />
          <SkeletonLoader count={1} className="h-28 rounded-2xl" />
          <SkeletonLoader count={1} className="h-28 rounded-2xl" />
        </div>
        <SkeletonLoader count={5} className="h-16 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-1 select-none">
      
      {/* Title & Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" />
            System Control Panel
          </h1>
          <p className="text-xs text-slate-400 font-sans">
            Real-time biometric enterprise node telemetry & session manager.
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="self-start sm:self-center px-4 py-2 border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 hover:border-white/10 rounded-xl text-xs text-slate-300 hover:text-white transition flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Polling System...' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-xs text-rose-400 font-sans">
          <ServerCrash className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold block">Telemetry Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* API Server Node Status */}
        <DashboardCard glow>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Node Uptime</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-xl font-black text-white tracking-tight">ONLINE</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1">API v2.0.0 ● 100% HEALTHY</div>
        </DashboardCard>

        {/* User Logins & Active Sessions */}
        <DashboardCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Active Sessions</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-black text-white tracking-tight">{sessions.length}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">Logged Devices Tracking</div>
        </DashboardCard>

        {/* Database Colections sizes */}
        <DashboardCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">DB Collections</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            {dbStats ? Object.keys(dbStats.collections).length : 0}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Total records: {dbStats ? Object.values(dbStats.collections).reduce((a, b) => a + b, 0) : 0}
          </div>
        </DashboardCard>

        {/* Audit Log occurrences */}
        <DashboardCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Audit History</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white tracking-tight">{auditLogs.length}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">Stored Security Logs</div>
        </DashboardCard>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/5 space-x-6">
        {[
          { id: 'sessions', name: 'Active Sessions', count: sessions.length },
          { id: 'database', name: 'Database Collections', count: dbStats ? Object.keys(dbStats.collections).length : 0 },
          { id: 'audits', name: 'Audit Logging', count: auditLogs.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'sessions' | 'database' | 'audits')}
            className={`pb-4 text-xs font-bold tracking-wide uppercase transition relative outline-none flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-primary'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{tab.name}</span>
            <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-slate-900/80 border border-white/5 text-slate-400">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-950/40 p-4 border border-white/5 rounded-2xl">
              <span className="text-xs text-slate-400 font-sans">
                Monitor and terminate active user login sessions from various IP addresses and devices.
              </span>
              <button
                onClick={handleRevokeAll}
                disabled={sessions.length <= 1}
                className="px-3 py-1.5 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Revoke All Other Devices</span>
              </button>
            </div>

            {sessions.length === 0 ? (
              <EmptyState title="No Active Sessions" description="No active sessions detected on the backend system." icon={Monitor} />
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const ua = parseUA(session.user_agent);
                  const UAIcon = ua.isMobile ? Smartphone : Monitor;
                  return (
                    <div 
                      key={session.session_id} 
                      className="p-4 bg-slate-950/20 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400">
                          <UAIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-sans">{session.user_email}</span>
                            <StatusBadge status="Active" />
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 space-x-2">
                            <span>OS: <strong className="text-slate-300">{ua.os}</strong></span>
                            <span>●</span>
                            <span>Browser: <strong className="text-slate-300">{ua.browser}</strong></span>
                            <span>●</span>
                            <span>IP: <strong className="text-slate-300">{session.ip_address}</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 justify-between md:justify-end">
                        <div className="text-right">
                          <span className="text-[9px] font-mono text-slate-500 block uppercase">Created At</span>
                          <span className="text-[10px] font-mono text-slate-300">{new Date(session.created_at).toLocaleString()}</span>
                        </div>
                        <button
                          onClick={() => handleRevokeSession(session.session_id)}
                          className="p-2 border border-white/5 hover:border-rose-500/20 bg-slate-900/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition"
                          title="Revoke session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'database' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dbStats ? (
              Object.entries(dbStats.collections).map(([colName, count]) => (
                <DashboardCard key={colName}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-4.5 h-4.5 text-primary shrink-0" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-sans">{colName}</span>
                    </div>
                    <Layers className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">{count}</div>
                  <p className="text-[10px] text-slate-400 font-sans mt-2">Total records within collection</p>
                </DashboardCard>
              ))
            ) : (
              <EmptyState title="No Stats Available" description="Failed to retrieve database metadata stats." icon={Database} />
            )}
          </div>
        )}

        {activeTab === 'audits' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-950/40 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-500" />
                  Security Audit Logging Stream
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase">showing last 100 entries</span>
              </div>
              
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-sans">
                  No security audit records logged.
                </div>
              ) : (
                <div className="divide-y divide-white/5 font-mono text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 hover:bg-white/[0.01] transition flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-purple-400 font-bold">[{log.action.toUpperCase()}]</span>
                          <span className="text-slate-300 font-sans font-bold">{log.user_email}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] font-sans">{log.details}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
