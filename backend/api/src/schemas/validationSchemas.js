const { z } = require('zod');

// ── Auth Schemas ─────────────────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(254).toLowerCase().trim(),
  full_name: z.string().min(1, 'Full name is required').max(120).trim(),
  role: z.enum(['student', 'teacher', 'parent', 'admin'], {
    errorMap: () => ({ message: 'Role must be student, teacher, parent, or admin' })
  }),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal(''))
}).passthrough();

const loginPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
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
  attendanceMarkSchema,
  sessionCreateSchema,
  leaveApplySchema,
  leaveActionSchema
};
