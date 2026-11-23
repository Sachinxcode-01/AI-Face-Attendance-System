'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken } from '@/lib/auth';

export interface AttendanceEvent {
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
  mockIntervalMs?: number; // Optional fallback simulator for demo mode
}

export function useAttendanceLive(options: UseAttendanceLiveOptions = {}) {
  const { channel = 'notifications', onEvent, mockIntervalMs = 0 } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<AttendanceEvent | null>(null);
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const handleIncoming = useCallback((evt: AttendanceEvent) => {
    setLastEvent(evt);
    setEvents((prev) => [evt, ...prev].slice(0, 50));
    if (onEventRef.current) {
      onEventRef.current(evt);
    }
  }, []);

  useEffect(() => {
    let unmounted = false;
    const token = getToken();

    // Determine WS protocol and URL
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

        ws.onopen = () => {
          if (!unmounted) {
            setIsConnected(true);
          }
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data?.type === 'attendance_update' || data?.type === 'security_alert') {
              handleIncoming(data);
            }
          } catch {
            // Ignore non-json keepalives
          }
        };

        ws.onclose = () => {
          if (!unmounted) {
            setIsConnected(false);
            // Reconnect after backoff
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
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

    // Demo / mock simulation if enabled and not connected to live backend WS
    let mockTimer: NodeJS.Timeout | null = null;
    if (mockIntervalMs > 0) {
      const demoNames = [
        { name: 'Alice Smith', email: 'alice@smartface.pro', roll: 'CS2026-042' },
        { name: 'Marcus Vance', email: 'marcus@smartface.pro', roll: 'CS2026-018' },
        { name: 'Devon Patel', email: 'devon.p@smartface.pro', roll: 'CS2026-089' },
        { name: 'Elena Rostova', email: 'elena.r@smartface.pro', roll: 'CS2026-031' },
        { name: 'Chen Wei', email: 'chen.wei@smartface.pro', roll: 'CS2026-112' },
      ];

      mockTimer = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return; // live stream active
        const student = demoNames[Math.floor(Math.random() * demoNames.length)];
        const method: 'face' | 'qr' = Math.random() > 0.35 ? 'face' : 'qr';
        const simulated: AttendanceEvent = {
          type: 'attendance_update',
          student_email: student.email,
          student_name: student.name,
          roll_number: student.roll,
          status: 'Present',
          timestamp: new Date().toISOString(),
          verified_by: method,
          confidence: method === 'face' ? Math.round((0.92 + Math.random() * 0.07) * 100) / 100 : undefined,
        };
        handleIncoming(simulated);
      }, mockIntervalMs);
    }

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (mockTimer) clearInterval(mockTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [channel, handleIncoming, mockIntervalMs]);

  return {
    isConnected,
    lastEvent,
    events,
  };
}
