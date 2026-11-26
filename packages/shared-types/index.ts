export type UserRole =
  | 'student'
  | 'teacher'
  | 'parent'
  | 'hod'
  | 'principal'
  | 'management'
  | 'admin'
  | 'super_admin';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused' | 'Cancelled';

export type StandingLevel = 'Excellent' | 'Good' | 'Warning' | 'Critical';

export type VerificationMethod = 'qr' | 'face' | 'manual' | 'biometric';

export interface AttendancePolicySummary {
  minPercentage: number;
  approvedLeaveCountsAsPresent: boolean;
  excusedCountsAsPresent: boolean;
  lateCountsAsPresent: boolean;
  disputeDeadlineDays: number;
  allowLeaveWithdrawal: boolean;
  timezone: string;
}
