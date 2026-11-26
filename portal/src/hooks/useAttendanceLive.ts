'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken, getStoredUser } from '@/lib/auth';
import { queryClient } from '@/core/query/queryClient';
import { studentKeys } from '@/core/query/queryKeys';

export interface AttendanceEvent {
  id?: string;
  type: string;
  student_email?: string;
  student_name?: string;
  roll_number?: string;
  session_id?: string;
  status?: string;
  timestamp?: string;
  verified_by?: 'face' | 'qr' | 'manual';
  confidence?: number;
}

interface UseAttendanceLiveOptions {
  channel?: 'notifications' | 'live-logs';
  onEvent?: (event: AttendanceEvent) => void;
  invalidateStudentCache?: boolean;
  mockIntervalMs?: number;
}

export function useAttendanceLive(options: UseAttendanceLiveOptions = {}) {
  const { channel = 'notifications', onEvent, invalidateStudentCache = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<AttendanceEvent | null>(null);
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seenKeysRef = useRef<Set<string>>(new Set());
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const handleIncoming = useCallback((evt: AttendanceEvent) => {
    const dedupKey = `${evt.id || ''}:${evt.type}:${evt.session_id || ''}:${evt.timestamp || ''}`;
    if (dedupKey !== ':::' && seenKeysRef.current.has(dedupKey)) {
      return;
    }
    if (dedupKey !== ':::') {
      seenKeysRef.current.add(dedupKey);
      if (seenKeysRef.current.size > 100) {
        const first = seenKeysRef.current.values().next().value;
        if (first) seenKeysRef.current.delete(first);
      }
    }

    setLastEvent(evt);
    setEvents((prev) => [evt, ...prev].slice(0, 50));

    if (invalidateStudentCache) {
      const email = getStoredUser()?.email;
      if (email) {
        queryClient.invalidateQueries({ queryKey: studentKeys.dashboard(email) });
        queryClient.invalidateQueries({ queryKey: [...studentKeys.all(email), 'attendance'] });
        queryClient.invalidateQueries({ queryKey: [...studentKeys.all(email), 'notifications'] });
        queryClient.invalidateQueries({ queryKey: [...studentKeys.all(email), 'heatmap'] });
      }
    }

    if (onEventRef.current) {
      onEventRef.current(evt);
    }
  }, [invalidateStudentCache]);

  useEffect(() => {
    let unmounted = false;
    let attempt = 0;
    const token = getToken();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsProto = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
    const wsHost = apiUrl.replace(/^https?:\/\//, '');
    const wsPath = channel === 'live-logs' ? '/ws/live-logs' : '/ws/notifications';

    function connect() {
      if (unmounted) return;
      if (!token) {
        setIsConnected(false);
        return;
      }

      try {
        const wsUrl = `${wsProto}//${wsHost}${wsPath}?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        let pingInterval: NodeJS.Timeout | null = null;

        ws.onopen = () => {
          if (!unmounted) {
            attempt = 0;
            setIsConnected(true);
            pingInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
              }
            }, 30000);
          }
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (
              data?.type === 'attendance_update' ||
              data?.type === 'security_alert' ||
              data?.type === 'leave_status' ||
              data?.type === 'announcement' ||
              data?.type === 'attendance'
            ) {
              handleIncoming(data);
            }
          } catch {
            // Ignore non-json keepalives
          }
        };

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
          if (!unmounted) {
            setIsConnected(false);
            attempt += 1;
            const backoffMs = Math.min(30000, 3000 * Math.pow(1.5, Math.min(attempt, 5)));
            reconnectTimeoutRef.current = setTimeout(connect, backoffMs);
          }
        };

        ws.onerror = () => {
          if (pingInterval) clearInterval(pingInterval);
          if (!unmounted) {
            setIsConnected(false);
            ws.close();
          }
        };
      } catch {
        if (!unmounted) {
          setIsConnected(false);
        }
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [channel, handleIncoming]);

  return {
    isConnected,
    lastEvent,
    events,
  };
}
