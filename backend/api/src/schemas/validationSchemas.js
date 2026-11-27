const { z } = require('zod');

// ── Auth Schemas ─────────────────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(254).toLowerCase().trim(),
  full_name: z.string().min(1, 'Full name is required').max(120).trim(),
  role: z.enum(['student', 'teacher', 'parent', 'admin', 'hod', 'principal', 'management', 'super_admin'], {
    errorMap: () => ({ message: 'Invalid role specified' })
  }),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal(''))
}).passthrough();

const loginPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional().default(false)
}).passthrough();

const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'Google idToken is required').max(8192).trim()
}).passthrough();

const githubLoginSchema = z.object({
  code: z.string().min(1, 'GitHub authorization code is required').max(1024).trim()
}).passthrough();

const otpSendSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim()
}).passthrough();

const otpVerifySchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  otp: z.string().min(4, 'OTP must be at least 4 digits').max(10).trim()
}).passthrough();

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  otp: z.string().min(4, 'OTP is required').trim(),
  new_password: z.string().min(6, 'New password must be at least 6 characters')
}).passthrough();

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters').max(128)
}).passthrough();

const mfaCodeSchema = z.object({
  code: z.string().min(6, 'Verification code is required').max(16).trim()
}).passthrough();

const mfaDisableSchema = z.object({
  current_password: z.string().optional(),
  code: z.string().optional()
}).passthrough();

const invitationCreateSchema = z.object({
  email: z.string().email('Invalid email address').max(254).toLowerCase().trim(),
  role: z.enum(['student', 'teacher', 'parent', 'admin', 'hod', 'principal', 'management']),
  department: z.string().max(120).trim().optional(),
  expires_hours: z.number().int().min(1).max(336).optional().default(72)
}).passthrough();

const invitationAcceptSchema = z.object({
  token: z.string().min(16, 'Invalid invitation token').max(256).trim(),
  full_name: z.string().min(1, 'Full name is required').max(120).trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128)
}).passthrough();

const switchInstitutionSchema = z.object({
  college_id: z.string().min(1, 'Institution ID is required').max(120).trim()
}).passthrough();

const demoRequestSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(120).trim(),
  email: z.string().email('Invalid email address').max(254).toLowerCase().trim(),
  institution: z.string().min(1, 'Institution / Organization name is required').max(200).trim(),
  campusSize: z.string().min(1, 'Campus size is required').max(100).trim(),
  phone: z.string().max(30).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal(''))
}).passthrough();

// ── Attendance Schemas ────────────────────────────────────────────────────────
const attendanceMarkSchema = z.object({
  session_id: z.string().optional(),
  qr_code: z.string().optional(),
  student_email: z.string().email().optional(),
  code: z.string().optional()
}).passthrough();

const sessionCreateSchema = z.object({
  subject: z.string().min(1, 'Subject is required').trim(),
  room: z.string().optional().default('Main Hall'),
  duration_minutes: z.number().int().positive().optional().default(60)
}).passthrough();

// ── Leave Schemas ─────────────────────────────────────────────────────────────
const leaveApplySchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  leave_type: z.string().optional().default('Medical')
}).passthrough();

const leaveActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'Action must be approve or reject' })
  }),
  comments: z.string().optional()
}).passthrough();

module.exports = {
  registerSchema,
  loginPasswordSchema,
  googleLoginSchema,
  githubLoginSchema,
  otpSendSchema,
  otpVerifySchema,
  resetPasswordSchema,
  changePasswordSchema,
  mfaCodeSchema,
  mfaDisableSchema,
  invitationCreateSchema,
  invitationAcceptSchema,
  switchInstitutionSchema,
  attendanceMarkSchema,
  sessionCreateSchema,
  leaveApplySchema,
  leaveActionSchema,
  demoRequestSchema
};
