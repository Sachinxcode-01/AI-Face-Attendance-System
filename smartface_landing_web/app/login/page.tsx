'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, ArrowRight, ShieldAlert, Sparkles, Chrome } from 'lucide-react';
import { api } from '../../lib/api';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  // Authentication state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      // First verify credentials
      await api.loginPassword(email, password);
      // Trigger OTP dispatch to student email
      await api.sendOtp(email);
      setIsLoading(false);
      setStep('otp');
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.';
      setErrorMsg(message);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const data = await api.verifyOtp(email, otpCode);
      setIsLoading(false);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', email);
      router.push('/dashboard');
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Verification failed. Invalid or expired OTP.';
      setErrorMsg(message);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      let resolvedRole = 'student';
      if (email.includes('teacher')) {
        resolvedRole = 'teacher';
      } else if (email.includes('admin')) {
        resolvedRole = 'admin';
      } else if (email.includes('parent')) {
        resolvedRole = 'parent';
      }
      
      const loginEmail = email || 'google_student@smartface.pro';
      const loginName = loginEmail.split('@')[0];
      
      const data = await api.googleLogin(loginEmail, loginName, resolvedRole);
      setIsLoading(false);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', loginEmail);
      router.push('/dashboard');
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Google Authentication failed.';
      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden font-sans px-4 select-none">
      
      {/* Background glow animations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Auth Card container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-950/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md relative z-10"
      >
        {/* Brand logo header */}
        <Link href="/" className="flex flex-col items-center text-center mb-8 group cursor-pointer select-none">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all duration-300">
            <Sparkles className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white font-sans uppercase group-hover:text-primary transition-colors">
            SmartFace <span className="text-primary font-mono font-black text-sm">AI</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-2">
            Secure Biometric Attendance & Identity Gateway
          </p>
        </Link>

        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            <motion.div
              key="credentials-panel"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {/* Email address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="student@smartface.pro (or teacher, parent)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900 transition outline-none font-sans"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
                      Password
                    </label>
                    <button type="button" className="text-[10px] text-slate-400 hover:text-white transition font-sans">
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900 transition outline-none font-sans"
                    />
                  </div>
                </div>

                {/* Feedback warning alerts */}
                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-[10px] text-rose-400 font-sans leading-relaxed">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-primary hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)]"
                >
                  {isLoading ? 'Authorizing Identity...' : 'Next Step'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5" />
                </div>
                <span className="relative bg-[#0b101c] px-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Or continue with
                </span>
              </div>

              {/* OAuth Provider */}
              <button
                onClick={handleGoogleLogin}
                className="w-full py-3 border border-white/5 hover:border-white/10 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl text-xs text-slate-300 hover:text-white transition flex items-center justify-center gap-2"
              >
                <Chrome className="w-4 h-4" />
                <span>Sign in with Google Workspace</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp-panel"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2 text-center mb-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white font-sans">Verification Required</h4>
                  <p className="text-[11px] text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                    We sent a 6-digit confirmation code to your institutional inbox. Enter it below to complete authorization.
                  </p>
                </div>

                {/* Code verification input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold text-center">
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full py-3 text-center tracking-[0.75em] text-lg font-mono font-bold rounded-xl bg-slate-900/50 border border-white/5 text-white placeholder-slate-650 focus:border-emerald-500 focus:bg-slate-900 transition outline-none"
                  />
                </div>

                {/* Alerts */}
                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-[10px] text-rose-400 font-sans leading-relaxed">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submits */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition border border-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                >
                  {isLoading ? 'Verifying OTP...' : 'Authorize Context Session'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 font-mono uppercase tracking-wider"
                >
                  Back to login credentials
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
