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
  assigned_classes_count?: number;
  assigned_subjects?: string[];
  assigned_classes?: string[];
  total_assigned_students?: number;
  overall_attendance_rate?: number;
  subject_wise_attendance?: Array<{
    subject: string;
    sessions_count: number;
    present_count: number;
    conducted_marks: number;
    attendance_rate: number;
  }>;
  shortage_students_count?: number;
  critical_students_count?: number;
  pending_disputes?: number;
  unread_notifications?: number;
  today_schedule?: Array<{
    id: string;
    subject: string;
    subject_code?: string;
    class_key?: string;
    day: string;
    time: string;
    room: string;
    session_type?: string;
    substitute_faculty?: string;
    is_cancelled?: boolean;
    cancellation_reason?: string;
    status: 'live' | 'upcoming' | 'completed' | 'cancelled';
    minutes_until_start: number | null;
  }>;
  completed_lectures_today?: number;
  upcoming_lectures_today?: number;
  cancelled_lectures_today?: number;
  is_today_holiday?: boolean;
  weekly_schedule_count?: number;
  monthly_trends?: Array<{ month: string; label: string; present: number; conducted: number; rate: number }>;
  recent_activity?: Array<{
    id: string;
    student_email: string;
    student_name: string;
    roll_number: string | null;
    subject: string;
    status: string;
    verified_by: string;
    confidence: number | null;
    timestamp: string;
  }>;
  academic_info?: {
    college_name?: string | null;
    college_code?: string | null;
    department?: string | null;
    designation?: string | null;
    semester?: string;
    academic_year?: string;
    timezone?: string;
    min_percentage?: number;
  };
  last_synced_at?: string;
}

export type SessionLifecycleStatus =
  | 'scheduled'
  | 'ready'
  | 'active'
  | 'paused'
  | 'resumed'
  | 'closed'
  | 'cancelled'
  | 'under_review'
  | 'finalised';

export interface TeacherSession {
  id: string;
  subject: string;
  subject_code?: string | null;
  section?: string | null;
  semester?: string | null;
  department?: string | null;
  room: string | null;
  duration: string;
  duration_minutes?: number;
  extended_minutes?: number;
  start_time: string;
  expires_at?: string | null;
  remaining_seconds?: number;
  status?: SessionLifecycleStatus;
  is_active: boolean;
  qr_rotation_seconds?: number;
  qr_epoch?: number;
  verification_methods?: string[];
  geofence_enabled?: boolean;
  present_count?: number;
  absent_count?: number;
  late_count?: number;
  excused_count?: number;
  leave_count?: number;
  pending_count?: number;
  face_count?: number;
  qr_count?: number;
  manual_count?: number;
  duplicate_attempts?: number;
  failed_verifications?: number;
  students_checked_in: number;
  total_enrolled_seen: number;
  attendance_rate: number;
  finalised_at?: string | null;
  closed_at?: string | null;
  cancellation_reason?: string | null;
}

export interface TeacherStudent {
  id: string;
  email: string;
  full_name: string;
  student_id: string | null;
  roll_number?: string | null;
  department: string | null;
  semester: string | null;
  section?: string | null;
  avatar_url: string | null;
  present_count: number;
  total_count: number;
  absent_count?: number;
  late_count?: number;
  excused_count?: number;
  attendance_rate: number;
  exact_rate?: number;
  last_seen: string | null;
  risk_level?: string;
  consecutive_absences?: number;
  classes_needed?: number | null;
  allowable_absences?: number;
  approved_leaves_count?: number;
  has_active_leave?: boolean;
  pending_corrections?: number;
  biometric_enrolled?: boolean;
}

export interface TeacherAnalytics {
  total_sessions: number;
  present_marks: number;
  conducted_marks?: number;
  absent_marks?: number;
  late_marks?: number;
  face_scans: number;
  qr_scans: number;
  manual_scans: number;
  avg_confidence: number | null;
  attendance_rate: number;
  weekly_trends: {
    year: number;
    week: number;
    label?: string;
    present: number;
    total: number;
    rate: number;
  }[];
  daily_trends?: Array<{ date: string; present: number; total: number; rate: number }>;
  monthly_trends?: Array<{ month: string; label: string; present: number; total: number; rate: number }>;
  subject_breakdown?: Array<{
    subject: string;
    present: number;
    conducted: number;
    absent: number;
    late: number;
    rate: number;
  }>;
  distribution?: { excellent: number; safe: number; warning: number; critical: number };
  month_comparison?: { current_month: number; previous_month: number; delta: number };
  verification_failures?: number;
  leave_count?: number;
  dispute_count?: number;
  risk_students?: Array<{
    email: string;
    full_name: string;
    student_id: string | null;
    department: string | null;
    semester: string | null;
    attended: number;
    conducted: number;
    attendance_rate: number;
    risk_level: string;
    trend_direction: string;
    consecutive_absences: number;
    classes_needed: number | null;
    allowable_absences: number;
    possible: boolean;
    reasons: string[];
    recommendations: string[];
    below_threshold_subjects: string[];
    interventions: Array<{ id: string; action_taken: string; note: string; subject: string | null; created_at: string }>;
  }>;
  subjects?: string[];
  policy_min_percentage?: number;
}

export interface TeacherReportSummary {
  report_type?: string;
  generated_at?: string;
  disclaimer?: string;
  teacher?: { name: string; email: string; department: string | null; designation: string | null };
  institution?: { name: string; code: string | null; semester: string; academic_year: string; min_percentage: number };
  period: { start_date: string; end_date: string };
  summary: {
    total_sessions?: number;
    total_marks: number;
    conducted_marks?: number;
    attendance_rate: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count?: number;
    leave_count?: number;
    face_scans: number;
    qr_scans: number;
    manual_scans?: number;
  };
  rows?: Array<{
    date: string;
    time: string;
    student_email: string;
    student_name: string;
    student_id: string;
    subject: string;
    room: string;
    status: string;
    verified_by: string;
    confidence: string;
    reason: string;
  }>;
}

export interface TeacherLeaveRequest {
  id: string;
  user_id: string;
  student_name?: string;
  student_id?: string | null;
  department?: string | null;
  semester?: string | null;
  section?: string | null;
  category?: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: 'Pending' | 'Under Review' | 'Clarification' | 'Approved' | 'Rejected' | 'Withdrawn' | 'Cancelled';
  document_url?: string;
  document_name?: string;
  remarks?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  has_overlap?: boolean;
  status_history?: Array<{ status: string; actor?: string; note?: string; timestamp: string }>;
  created_at: string;
}

export interface TeacherDispute {
  id: string;
  student_email: string;
  student_name?: string;
  student_id?: string | null;
  session_id: string;
  subject?: string;
  original_status?: string;
  requested_status: 'Present' | 'Excused' | 'Late';
  reason_category?: string;
  reason: string;
  evidence_url?: string;
  evidence_name?: string;
  status: 'Pending' | 'Under Review' | 'Clarification' | 'Escalated' | 'Approved' | 'Rejected';
  resolved_by?: string;
  remarks?: string;
  audit_trail?: Array<{ status: string; actor: string; role: string; note: string; timestamp: string }>;
  created_at: string;
  resolved_at?: string;
}
