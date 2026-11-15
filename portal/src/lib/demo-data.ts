import {
  UserProfile,
  AttendanceRecord,
  TimetableSlot,
  LeaveRequest,
  IntruderAlert,
  SessionRecord,
  RosterStudent,
  AuditLog,
  DirectoryUser,
  AppNotification,
  ChildProfile,
  DepartmentStat,
  HeatmapDay,
  SystemService,
} from './types';

export const DEMO_PROFILES: Record<string, UserProfile> = {
  student: {
    id: 'usr_std_01',
    name: 'Alice Smith',
    email: 'alice@smartface.pro',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    department: 'Computer Science & Engineering',
    rollNo: 'CS-2024-042',
    streakDays: 14,
    streakTier: 'Golden Blaze',
    phone: '+1 (555) 014-2242',
    joinedAt: 'Aug 2024',
  },
  teacher: {
    id: 'usr_tch_01',
    name: 'Prof. Marcus Vance',
    email: 'marcus.vance@smartface.pro',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Dept of Artificial Intelligence',
    phone: '+1 (555) 019-8831',
    joinedAt: 'Jan 2021',
  },
  admin: {
    id: 'usr_adm_01',
    name: 'Dr. Evelyn Cross',
    email: 'admin@smartface.pro',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Security & Campus Infrastructure',
    phone: '+1 (555) 010-7712',
    joinedAt: 'Mar 2019',
  },
  parent: {
    id: 'usr_prt_01',
    name: 'Sarah & David Smith',
    email: 'sarah.smith@parent.net',
    role: 'parent',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    childName: 'Alice Smith',
    childRollNo: 'CS-2024-042',
    phone: '+1 (555) 016-4490',
    joinedAt: 'Sep 2024',
  },
};

export const MOCK_STUDENT_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att_1', date: 'Today', time: '09:02 AM', subject: 'Neural Networks & Deep Learning', status: 'verified_face', confidence: 0.994, room: 'Lab 402' },
  { id: 'att_2', date: 'Today', time: '11:15 AM', subject: 'Operating Systems Architecture', status: 'verified_qr', room: 'Lecture Hall B' },
  { id: 'att_3', date: 'Yesterday', time: '10:00 AM', subject: 'Linear Algebra & Statistics', status: 'verified_face', confidence: 0.988, room: 'Room 204' },
  { id: 'att_4', date: 'Yesterday', time: '02:00 PM', subject: 'Database Systems & SQL', status: 'present', room: 'Lab 101' },
  { id: 'att_5', date: '13 Nov', time: '09:00 AM', subject: 'Neural Networks & Deep Learning', status: 'verified_face', confidence: 0.996, room: 'Lab 402' },
  { id: 'att_6', date: '13 Nov', time: '01:00 PM', subject: 'Compiler Design', status: 'verified_qr', room: 'LH-A' },
  { id: 'att_7', date: '12 Nov', time: '09:00 AM', subject: 'Operating Systems Architecture', status: 'late', room: 'Lecture Hall B' },
  { id: 'att_8', date: '12 Nov', time: '11:30 AM', subject: 'Linear Algebra & Statistics', status: 'verified_face', confidence: 0.991, room: 'Room 204' },
  { id: 'att_9', date: '11 Nov', time: '09:00 AM', subject: 'Neural Networks & Deep Learning', status: 'verified_face', confidence: 0.987, room: 'Lab 402' },
  { id: 'att_10', date: '11 Nov', time: '02:00 PM', subject: 'Database Systems & SQL', status: 'absent', room: 'Lab 101' },
  { id: 'att_11', date: '10 Nov', time: '10:00 AM', subject: 'Compiler Design', status: 'verified_face', confidence: 0.993, room: 'LH-A' },
  { id: 'att_12', date: '10 Nov', time: '03:00 PM', subject: 'Computer Vision Practicum', status: 'verified_qr', room: 'Vision Studio' },
];

export const MOCK_SUBJECT_STATS = [
  { subject: 'Neural Networks & Deep Learning', attended: 26, total: 28, percentage: 92.8, color: '#10B981' },
  { subject: 'Operating Systems Architecture', attended: 24, total: 27, percentage: 88.8, color: '#6366F1' },
  { subject: 'Linear Algebra & Statistics', attended: 20, total: 26, percentage: 76.9, color: '#F59E0B' },
  { subject: 'Database Systems & SQL', attended: 25, total: 26, percentage: 96.1, color: '#3B82F6' },
];

export const MOCK_TIMETABLE: TimetableSlot[] = [
  { id: 'tt_1', day: 'Mon', time: '09:00 - 10:30', subject: 'Neural Networks & Deep Learning', professor: 'Prof. Marcus Vance', room: 'Lab 402', status: 'live' },
  { id: 'tt_2', day: 'Mon', time: '11:00 - 12:30', subject: 'Operating Systems', professor: 'Dr. Robert Hall', room: 'LH-B', status: 'upcoming' },
  { id: 'tt_3', day: 'Mon', time: '02:00 - 03:30', subject: 'Computer Vision Practicum', professor: 'Prof. Miller', room: 'Vision Studio', status: 'upcoming' },
  { id: 'tt_4', day: 'Tue', time: '09:00 - 10:30', subject: 'Linear Algebra', professor: 'Dr. Sarah Connor', room: 'Room 204', status: 'upcoming' },
  { id: 'tt_5', day: 'Tue', time: '10:45 - 12:15', subject: 'Database Systems', professor: 'Prof. Alan Turing', room: 'Lab 101', status: 'upcoming' },
  { id: 'tt_6', day: 'Tue', time: '01:30 - 03:00', subject: 'Compiler Design', professor: 'Dr. Grace Hopper', room: 'LH-A', status: 'upcoming' },
  { id: 'tt_7', day: 'Wed', time: '09:00 - 10:30', subject: 'Neural Networks & Deep Learning', professor: 'Prof. Marcus Vance', room: 'Lab 402', status: 'upcoming' },
  { id: 'tt_8', day: 'Wed', time: '11:00 - 12:30', subject: 'Operating Systems', professor: 'Dr. Robert Hall', room: 'LH-B', status: 'upcoming' },
  { id: 'tt_9', day: 'Thu', time: '09:00 - 10:30', subject: 'Linear Algebra', professor: 'Dr. Sarah Connor', room: 'Room 204', status: 'upcoming' },
  { id: 'tt_10', day: 'Thu', time: '02:00 - 03:30', subject: 'Computer Vision Practicum', professor: 'Prof. Miller', room: 'Vision Studio', status: 'upcoming' },
  { id: 'tt_11', day: 'Fri', time: '10:00 - 11:30', subject: 'Database Systems', professor: 'Prof. Alan Turing', room: 'Lab 101', status: 'upcoming' },
  { id: 'tt_12', day: 'Fri', time: '01:30 - 03:00', subject: 'Compiler Design', professor: 'Dr. Grace Hopper', room: 'LH-A', status: 'upcoming' },
  { id: 'tt_13', day: 'Sat', time: '09:00 - 10:30', subject: 'Deep Learning Lab', professor: 'Prof. Marcus Vance', room: 'Lab 402', status: 'upcoming' },
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'lv_1', studentName: 'Alice Smith', rollNo: 'CS-2024-042', reason: 'ACM Regional Hackathon participation', category: 'Academic', startDate: '2026-11-20', endDate: '2026-11-22', status: 'approved' },
  { id: 'lv_2', studentName: 'Bob Martinez', rollNo: 'CS-2024-088', reason: 'Viral fever rest per physician note', category: 'Medical', startDate: '2026-11-18', endDate: '2026-11-19', status: 'pending' },
  { id: 'lv_3', studentName: 'David Chen', rollNo: 'CS-2024-105', reason: 'Family emergency out of province', category: 'Personal', startDate: '2026-11-16', endDate: '2026-11-17', status: 'pending' },
  { id: 'lv_4', studentName: 'Priya Nair', rollNo: 'CS-2024-031', reason: 'University sports tournament travel', category: 'Academic', startDate: '2026-11-21', endDate: '2026-11-23', status: 'pending' },
  { id: 'lv_5', studentName: 'James Okafor', rollNo: 'CS-2024-077', reason: 'Surgical appointment, hospital visit', category: 'Medical', startDate: '2026-11-17', endDate: '2026-11-17', status: 'rejected' },
];

export const MOCK_INTRUDERS: IntruderAlert[] = [
  { id: 'int_1', timestamp: '10:42:15 AM', cameraLocation: 'North Campus Gate B', confidence: 0.12, imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', status: 'investigating' },
  { id: 'int_2', timestamp: '08:15:30 AM', cameraLocation: 'Auditorium Corridor 2', confidence: 0.08, imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', status: 'dismissed' },
  { id: 'int_3', timestamp: 'Yesterday 06:12 PM', cameraLocation: 'Parking Structure Level 3', confidence: 0.15, imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', status: 'resolved' },
  { id: 'int_4', timestamp: 'Yesterday 01:48 PM', cameraLocation: 'Library West Entrance', confidence: 0.09, imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', status: 'resolved' },
];

export const MOCK_SESSIONS: SessionRecord[] = [
  { id: 'ses_1', subject: 'Neural Networks & Deep Learning', room: 'Lab 402', startTime: '09:00 AM', endTime: '10:30 AM', status: 'live', present: 41, total: 46, qrToken: 'SMARTFACE_SEC_99A4F2C' },
  { id: 'ses_2', subject: 'Operating Systems Architecture', room: 'LH-B', startTime: '11:00 AM', endTime: '12:30 PM', status: 'scheduled', present: 0, total: 52, qrToken: '—' },
  { id: 'ses_3', subject: 'Computer Vision Practicum', room: 'Vision Studio', startTime: '02:00 PM', endTime: '03:30 PM', status: 'scheduled', present: 0, total: 28, qrToken: '—' },
  { id: 'ses_4', subject: 'Neural Networks & Deep Learning', room: 'Lab 402', startTime: 'Yesterday', endTime: '10:30 AM', status: 'completed', present: 44, total: 46, qrToken: 'SMARTFACE_SEC_71BD3E9' },
  { id: 'ses_5', subject: 'Deep Learning Lab', room: 'Lab 402', startTime: '13 Nov', endTime: '12:00 PM', status: 'completed', present: 39, total: 46, qrToken: 'SMARTFACE_SEC_4C81A07' },
];

export const MOCK_ROSTER: RosterStudent[] = [
  { id: '1', name: 'Alice Smith', rollNo: 'CS-2024-042', time: '09:02 AM', status: 'present', method: 'ArcFace (99.4%)' },
  { id: '2', name: 'Bob Martinez', rollNo: 'CS-2024-088', time: '09:04 AM', status: 'present', method: 'Dynamic QR' },
  { id: '3', name: 'Catherine Wu', rollNo: 'CS-2024-019', time: '09:06 AM', status: 'present', method: 'ArcFace (98.9%)' },
  { id: '4', name: 'David Chen', rollNo: 'CS-2024-105', time: '--', status: 'absent', method: 'Pending' },
  { id: '5', name: 'Emma Watson', rollNo: 'CS-2024-055', time: '--', status: 'absent', method: 'Pending' },
  { id: '6', name: 'Farhan Ali', rollNo: 'CS-2024-063', time: '09:11 AM', status: 'present', method: 'ArcFace (99.1%)' },
  { id: '7', name: 'Grace Liu', rollNo: 'CS-2024-021', time: '09:14 AM', status: 'late', method: 'Dynamic QR' },
  { id: '8', name: 'Henry Osei', rollNo: 'CS-2024-090', time: '--', status: 'absent', method: 'Pending' },
  { id: '9', name: 'Isla Novak', rollNo: 'CS-2024-033', time: '09:18 AM', status: 'present', method: 'ArcFace (97.8%)' },
  { id: '10', name: 'Jake Torres', rollNo: 'CS-2024-074', time: '09:21 AM', status: 'present', method: 'Dynamic QR' },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud_1', timestamp: '09:02:14', actor: 'Alice Smith', action: 'ArcFace match verified (0.994)', target: 'Lab 402', severity: 'info', ip: '10.4.1.22' },
  { id: 'aud_2', timestamp: '09:04:32', actor: 'Bob Martinez', action: 'Dynamic QR validated', target: 'Lab 402', severity: 'info', ip: '10.4.1.31' },
  { id: 'aud_3', timestamp: '09:15:00', actor: 'System', action: 'Expired QR token rejected', target: '192.168.1.104', severity: 'warning', ip: '192.168.1.104' },
  { id: 'aud_4', timestamp: '09:18:22', actor: 'Sheets Sync', action: 'Batch sync completed (14 rows)', target: 'Google Sheets', severity: 'info', ip: 'internal' },
  { id: 'aud_5', timestamp: '09:31:07', actor: 'Unknown', action: 'Unregistered face flagged at Gate B', target: 'CAM-04', severity: 'critical', ip: '10.4.0.8' },
  { id: 'aud_6', timestamp: '09:44:51', actor: 'Prof. Marcus Vance', action: 'Manual override: David Chen → excused', target: 'CS-2024-105', severity: 'warning', ip: '10.4.2.10' },
  { id: 'aud_7', timestamp: '10:02:19', actor: 'Catherine Wu', action: 'ArcFace match verified (0.989)', target: 'Lab 402', severity: 'info', ip: '10.4.1.44' },
  { id: 'aud_8', timestamp: '10:11:38', actor: 'System', action: 'Anti-proxy replay attack blocked', target: 'Session ses_1', severity: 'critical', ip: '172.16.0.5' },
];

export const MOCK_DIRECTORY: DirectoryUser[] = [
  { id: 'usr_01', name: 'Alice Smith', email: 'alice@smartface.pro', role: 'student', department: 'Computer Science', biometric: 'enrolled', lastSeen: 'Today 09:02 AM', status: 'active' },
  { id: 'usr_02', name: 'Bob Martinez', email: 'bob@smartface.pro', role: 'student', department: 'Computer Science', biometric: 'enrolled', lastSeen: 'Today 09:04 AM', status: 'active' },
  { id: 'usr_03', name: 'Catherine Wu', email: 'catherine@smartface.pro', role: 'student', department: 'Computer Science', biometric: 'enrolled', lastSeen: 'Today 09:06 AM', status: 'active' },
  { id: 'usr_04', name: 'David Chen', email: 'david@smartface.pro', role: 'student', department: 'Computer Science', biometric: 'pending', lastSeen: 'Yesterday', status: 'active' },
  { id: 'usr_05', name: 'Emma Watson', email: 'emma@smartface.pro', role: 'student', department: 'Computer Science', biometric: 'enrolled', lastSeen: '13 Nov', status: 'active' },
  { id: 'usr_06', name: 'Prof. Marcus Vance', email: 'marcus.vance@smartface.pro', role: 'teacher', department: 'Artificial Intelligence', biometric: 'enrolled', lastSeen: 'Today 08:55 AM', status: 'active' },
  { id: 'usr_07', name: 'Dr. Robert Hall', email: 'robert.hall@smartface.pro', role: 'teacher', department: 'Mathematics', biometric: 'enrolled', lastSeen: 'Today 08:40 AM', status: 'active' },
  { id: 'usr_08', name: 'Dr. Sarah Connor', email: 'sarah.connor@smartface.pro', role: 'teacher', department: 'Applied Sciences', biometric: 'pending', lastSeen: '12 Nov', status: 'active' },
  { id: 'usr_09', name: 'James Okafor', email: 'james@smartface.pro', role: 'student', department: 'Computer Science', biometric: 'failed', lastSeen: '10 Nov', status: 'suspended' },
  { id: 'usr_10', name: 'Priya Nair', email: 'priya@smartface.pro', role: 'student', department: 'Computer Science', biometric: 'enrolled', lastSeen: 'Today 09:10 AM', status: 'active' },
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'ntf_1', title: 'Biometric Check-in at Campus Gate', body: 'Alice verified identity via Face Recognition camera at North Gate entrance.', time: '08:52 AM Today', type: 'checkin', read: false },
  { id: 'ntf_2', title: 'Class Attendance Logged', body: 'Marked present for Neural Networks & Deep Learning in Lab 402.', time: '09:02 AM Today', type: 'class', read: false },
  { id: 'ntf_3', title: 'Hackathon Leave Approved', body: 'Dean approved academic leave for 20 Nov - 22 Nov (ACM Regional Hackathon).', time: 'Yesterday 04:15 PM', type: 'leave', read: true },
  { id: 'ntf_4', title: 'Security Drill Scheduled', body: 'Campus-wide biometric failover drill on Saturday 07:00 AM.', time: 'Yesterday 09:00 AM', type: 'system', read: true },
  { id: 'ntf_5', title: 'Attendance Warning Cleared', body: 'Linear Algebra percentage recovered above 75% threshold.', time: '12 Nov 03:30 PM', type: 'system', read: true },
];

export const MOCK_CHILDREN: ChildProfile[] = [
  { id: 'ch_1', name: 'Alice Smith', rollNo: 'CS-2024-042', class: 'CSE • Sem 5', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', overall: 88.6, streak: 14, status: 'on_campus' },
  { id: 'ch_2', name: 'Ethan Smith', rollNo: 'ME-2026-018', class: 'Mech • Sem 1', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', overall: 91.2, streak: 6, status: 'in_transit' },
];

export const MOCK_DEPARTMENTS: DepartmentStat[] = [
  { department: 'Computer Science', present: 412, total: 460, rate: 89.6, trend: 2.4 },
  { department: 'Artificial Intelligence', present: 186, total: 210, rate: 88.6, trend: 1.1 },
  { department: 'Electronics', present: 224, total: 280, rate: 80.0, trend: -0.8 },
  { department: 'Mechanical', present: 198, total: 260, rate: 76.2, trend: -1.5 },
  { department: 'Business & Humanities', present: 240, total: 300, rate: 80.0, trend: 0.6 },
  { department: 'Applied Sciences', present: 150, total: 180, rate: 83.3, trend: 3.2 },
];

export const MOCK_HEATMAP: HeatmapDay[] = [
  { day: 'Mon', date: '10 Nov', count: 6, intensity: 4 },
  { day: 'Tue', date: '11 Nov', count: 5, intensity: 3 },
  { day: 'Wed', date: '12 Nov', count: 6, intensity: 4 },
  { day: 'Thu', date: '13 Nov', count: 4, intensity: 2 },
  { day: 'Fri', date: '14 Nov', count: 6, intensity: 4 },
  { day: 'Sat', date: '15 Nov', count: 3, intensity: 2 },
  { day: 'Sun', date: '16 Nov', count: 0, intensity: 0 },
  { day: 'Mon', date: '17 Nov', count: 6, intensity: 4 },
  { day: 'Tue', date: '18 Nov', count: 6, intensity: 4 },
  { day: 'Wed', date: '19 Nov', count: 5, intensity: 3 },
  { day: 'Thu', date: '20 Nov', count: 6, intensity: 4 },
  { day: 'Fri', date: '21 Nov', count: 2, intensity: 1 },
  { day: 'Sat', date: '22 Nov', count: 4, intensity: 2 },
  { day: 'Sun', date: '23 Nov', count: 0, intensity: 0 },
  { day: 'Mon', date: '24 Nov', count: 6, intensity: 4 },
  { day: 'Tue', date: '25 Nov', count: 6, intensity: 4 },
  { day: 'Wed', date: '26 Nov', count: 5, intensity: 3 },
  { day: 'Thu', date: '27 Nov', count: 6, intensity: 4 },
  { day: 'Fri', date: '28 Nov', count: 5, intensity: 3 },
  { day: 'Sat', date: '29 Nov', count: 3, intensity: 2 },
  { day: 'Sun', date: '30 Nov', count: 0, intensity: 0 },
  { day: 'Mon', date: '01 Dec', count: 6, intensity: 4 },
  { day: 'Tue', date: '02 Dec', count: 6, intensity: 4 },
  { day: 'Wed', date: '03 Dec', count: 4, intensity: 2 },
  { day: 'Thu', date: '04 Dec', count: 5, intensity: 3 },
  { day: 'Fri', date: '05 Dec', count: 6, intensity: 4 },
  { day: 'Sat', date: '06 Dec', count: 2, intensity: 1 },
  { day: 'Sun', date: '07 Dec', count: 0, intensity: 0 },
  { day: 'Mon', date: '08 Dec', count: 6, intensity: 4 },
  { day: 'Tue', date: '09 Dec', count: 5, intensity: 3 },
];

export const MOCK_SERVICES: SystemService[] = [
  { name: 'API Gateway (Express)', status: 'operational', latency: '12ms', uptime: '99.99%' },
  { name: 'ArcFace Inference Engine', status: 'operational', latency: '280ms', uptime: '99.95%' },
  { name: 'PostgreSQL Cluster', status: 'operational', latency: '4ms', uptime: '99.99%' },
  { name: 'WebSocket Realtime Bus', status: 'operational', latency: '8ms', uptime: '99.97%' },
  { name: 'Google Sheets Sync Worker', status: 'degraded', latency: '1.2s', uptime: '98.40%' },
  { name: 'SMTP Notification Relay', status: 'operational', latency: '210ms', uptime: '99.90%' },
  { name: 'QR Token Signer', status: 'operational', latency: '2ms', uptime: '100.00%' },
  { name: 'Intruder Detection Pipeline', status: 'operational', latency: '95ms', uptime: '99.98%' },
];

export const MOCK_ANALYTICS = {
  weekly: [
    { day: 'Mon', attended: 6, total: 6 },
    { day: 'Tue', attended: 6, total: 6 },
    { day: 'Wed', attended: 5, total: 6 },
    { day: 'Thu', attended: 4, total: 6 },
    { day: 'Fri', attended: 6, total: 6 },
    { day: 'Sat', attended: 3, total: 4 },
  ],
  monthlyTrend: [72, 76, 79, 81, 84, 83, 86, 88, 88.6],
};
