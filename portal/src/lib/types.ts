export type UserRole = 'student' | 'teacher' | 'admin' | 'parent' | 'super_admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department?: string;
  rollNo?: string;
  student_id?: string;
  roll_number?: string;
  usn?: string;
  course?: string;
  semester?: string;
  section?: string;
  college?: string;
  college_id?: string;
  academic_year?: string;
  email_verified?: boolean;
  biometric_registered?: boolean;
  streakDays?: number;
  streakTier?: 'Bronze Flame' | 'Silver Spark' | 'Golden Blaze' | 'Diamond Inferno';
  childName?: string;
  childRollNo?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  language_preference?: string;
  theme_preference?: string;
  joinedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  receipt_id?: string;
  session_id?: string;
  date: string;
  time: string;
  scheduled_time?: string | null;
  registration_time?: string;
  subject: string;
  subject_code?: string;
  faculty_name?: string;
  status:
  | 'present'
  | 'absent'
  | 'late'
  | 'excused'
  | 'medical_leave'
  | 'approved_leave'
  | 'pending_verification'
  | 'manually_recorded'
  | 'cancelled_session'
  | 'not_recorded'
  | 'verified_face'
  | 'verified_qr';
  raw_status?: string;
  verified_by?: string;
  confidence?: number | null;
  room: string;
  correction_status?: string | null;
  correction_id?: string | null;
  remarks?: string | null;
  semester?: string;
  updated_at?: string;
}

export interface TimetableSlot {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  day_full?: string;
  time: string;
  subject: string;
  subject_code?: string;
  professor: string;
  substitute_faculty?: string;
  room: string;
  session_type?: 'lecture' | 'lab' | 'practical' | 'special' | 'exam';
  semester?: string;
  is_cancelled?: boolean;
  cancellation_reason?: string;
  rescheduled_to?: string;
  minutes_until_start?: number | null;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
}

export interface LeaveRequest {
  id: string;
  studentName: string;
  rollNo: string;
  reason: string;
  category: 'Medical' | 'Personal' | 'Emergency' | 'Academic' | 'Sports' | 'Institutional Activity' | 'Other';
  startDate: string;
  endDate: string;
  status: 'draft' | 'pending' | 'under_review' | 'clarification' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
  rawStatus?: string;
  remarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  documentUrl?: string;
  documentName?: string;
  statusHistory?: Array<{ status: string; actor?: string; note?: string; timestamp: string }>;
  createdAt?: string;
}

export interface IntruderAlert {
  id: string;
  timestamp: string;
  cameraLocation: string;
  confidence: number;
  imageUrl: string;
  status: 'investigating' | 'dismissed' | 'resolved';
}

export interface SessionRecord {
  id: string;
  subject: string;
  room: string;
  startTime: string;
  endTime: string;
  status: 'live' | 'completed' | 'scheduled';
  present: number;
  total: number;
  qrToken: string;
}

export interface RosterStudent {
  id: string;
  name: string;
  rollNo: string;
  time: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  method: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  severity: 'info' | 'warning' | 'critical';
  ip: string;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'staff';
  department: string;
  biometric: 'enrolled' | 'pending' | 'failed';
  lastSeen: string;
  status: 'active' | 'suspended';
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'checkin' | 'leave' | 'security' | 'system';
  read: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  avatar: string;
  overall: number;
  streak: number;
  status: 'on_campus' | 'at_home' | 'in_transit';
}

export interface DepartmentStat {
  department: string;
  present: number;
  total: number;
  rate: number;
  trend: number;
}

export interface HeatmapDay {
  day: string;
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface SystemService {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency: string;
  uptime: string;
}

export interface TeacherDashboard {
  teacher_name: string;
  department: string | null;
  active_sessions: number;
  total_sessions: number;
  attendance_today: number;
  students_monitored: number;
  pending_leaves: number;
}

export interface TeacherSession {
  id: string;
  subject: string;
  room: string | null;
  duration: string;
  start_time: string;
  is_active: boolean;
  students_checked_in: number;
  total_enrolled_seen: number;
  attendance_rate: number;
}

export interface TeacherStudent {
  id: string;
  email: string;
  full_name: string;
  student_id: string | null;
  department: string | null;
  semester: string | null;
  avatar_url: string | null;
  present_count: number;
  total_count: number;
  attendance_rate: number;
  last_seen: string | null;
}

export interface TeacherAnalytics {
  total_sessions: number;
  present_marks: number;
  face_scans: number;
  qr_scans: number;
  manual_scans: number;
  avg_confidence: number | null;
  attendance_rate: number;
  weekly_trends: {
    year: number;
    week: number;
    present: number;
    total: number;
    rate: number;
  }[];
}

export interface TeacherReportSummary {
  period: { start_date: string; end_date: string };
  summary: {
    total_marks: number;
    attendance_rate: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    face_scans: number;
    qr_scans: number;
  };
}

export interface TeacherLeaveRequest {
  id: string;
  user_id: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  document_url?: string;
  remarks?: string;
  created_at: string;
}
