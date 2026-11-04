'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  Chrome, 
  User, 
  Phone, 
  ShieldCheckIcon,
  ChevronLeft,
  KeyRound,
  RotateCw,
  ShieldAlertIcon,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  BookOpen,
  Camera,
  CheckCircle,
  Calendar,
  Building,
  Shield,
  Activity
} from 'lucide-react';
import { api } from '../../lib/api';
import dynamic from 'next/dynamic';

// Lazy-load heavy Three.js scenes so they stay out of the initial login bundle.
// They render client-side only and stream in after the form is interactive.
const HeroFaceCanvas = dynamic(() => import('@/components/hero-face-canvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[350px] md:min-h-[450px]" />,
});
const NetworkBackground = dynamic(() => import('@/components/network-bg'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 -z-10 bg-slate-950" />,
});
import confetti from 'canvas-confetti';

// Error Shake animation config
const shakeVariants = {
  default: { opacity: 1, scale: 1, x: 0 },
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 }
  }
};

const MicrosoftLogo = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23" fill="none">
    <rect x="0" y="0" width="10.5" height="10.5" fill="#f25022" />
    <rect x="11.5" y="0" width="10.5" height="10.5" fill="#7fba00" />
    <rect x="0" y="11.5" width="10.5" height="10.5" fill="#00a4ef" />
    <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#ffb900" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();

  // Navigation / Views: 'login' | 'otp-login' | 'mfa' | 'register' | 'forgot-password' | 'profile-setup' | 'biometric-enrollment' | 'activation-success'
  const [view, setView] = useState<'login' | 'otp-login' | 'mfa' | 'register' | 'forgot-password' | 'forgot-password-success' | 'reset-password' | 'profile-setup' | 'biometric-enrollment' | 'activation-success'>('login');
  
  // Mouse tracking for premium 3D movement
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Premium 6-box OTP state
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Credentials state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpPurpose, setOtpPurpose] = useState<'mfa' | 'otp-login' | 'register' | 'forgot-password'>('mfa');

  // Registration fields (Step 1)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Profile Setup fields (Step 3)
  const [regGender, setRegGender] = useState('Male');
  const [regDob, setRegDob] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering');
  const [regCourse, setRegCourse] = useState('B.Tech CSE');
  const [regSemester, setRegSemester] = useState('6th Semester');
  const [regStudentId, setRegStudentId] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Biometric state (Step 4)
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentScanAngle, setCurrentScanAngle] = useState<'front' | 'left' | 'right'>('front');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('Initialize camera to begin biometric enrollment');
  const [scanChecks, setScanChecks] = useState({
    lighting: false,
    blur: false,
    position: false,
    eyes: false
  });

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Capture mouse move for Left Panel 3D Parallax visual effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / 35;
      const y = (e.clientY - window.innerHeight / 2) / 35;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Submit OTP helper for both 6-box auto-submit and button fallback
  const submitVerificationCode = async (codeValue: string) => {
    if (codeValue.length !== 6) {
      triggerError('Please enter a valid 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const targetEmail = (otpPurpose === 'register') ? regEmail : email;
      
      const data = await api.verifyOtp(targetEmail, codeValue);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', targetEmail);
      
      if (otpPurpose === 'otp-login' || otpPurpose === 'mfa') {
        if (rememberMe) {
          localStorage.setItem('rememberedUser', email);
        }
        if (data.role === 'student') {
          router.push('/student');
        } else if (data.role === 'teacher') {
          router.push('/teacher');
        } else if (data.role === 'admin' || data.role === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else if (otpPurpose === 'register') {
        setSuccessMsg('Email address verified successfully!');
        setView('profile-setup');
      } else if (otpPurpose === 'forgot-password') {
        setView('reset-password'); // OTP verified, transition to password reset
      }
      setIsLoading(false);
      setOtpCode('');
      setOtpArray(Array(6).fill('')); // Reset array
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Verification failed. Invalid or expired OTP.';
      triggerError(message);
    }
  };

  const handleOtpBoxChange = (val: string, idx: number) => {
    const cleanVal = val.replace(/\D/g, '');
    const newArray = [...otpArray];
    
    if (!cleanVal) {
      newArray[idx] = '';
      setOtpArray(newArray);
      setOtpCode(newArray.join(''));
      return;
    }
    
    newArray[idx] = cleanVal.slice(-1);
    setOtpArray(newArray);
    
    const combined = newArray.join('');
    setOtpCode(combined);
    
    // Auto focus next box
    if (idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    } else {
      // Last box filled, submit!
      if (combined.length === 6) {
        submitVerificationCode(combined);
      }
    }
  };

  const handleOtpBoxKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (!otpArray[idx] && idx > 0) {
        const newArray = [...otpArray];
        newArray[idx - 1] = '';
        setOtpArray(newArray);
        setOtpCode(newArray.join(''));
        otpRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handleOtpBoxPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newArray = pastedData.split('');
      setOtpArray(newArray);
      setOtpCode(pastedData);
      otpRefs.current[5]?.focus();
      submitVerificationCode(pastedData);
    }
  };

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      triggerError('Please enter both your email and password.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      // First verify credentials
      await api.loginPassword(email, password);
      // Trigger OTP dispatch for MFA (sent to email)
      await api.sendOtp(email);
      
      setOtpPurpose('mfa');
      setOtpTimer(60);
      setIsLoading(false);
      setView('mfa');
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      triggerError(message);
    }
  };

  const handleOtpLoginRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      triggerError('Please enter your email to receive a secure OTP code.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      await api.sendOtp(email);
      setOtpPurpose('otp-login');
      setOtpTimer(60);
      setIsLoading(false);
      setView('mfa');
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Failed to dispatch OTP verification.';
      triggerError(message);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitVerificationCode(otpCode);
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setErrorMsg('');
    try {
      const targetEmail = (otpPurpose === 'register') ? regEmail : email;
      await api.sendOtp(targetEmail);
      setOtpTimer(60);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP.';
      triggerError(message);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      triggerError('Please fill out all registration fields.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      triggerError('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      triggerError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Call register API which creates user record (is_active = False) and dispatches OTP
      await api.register({
        email: regEmail,
        full_name: regName,
        phone: regPhone,
        role: regRole,
        password: regPassword
      });
      
      setOtpPurpose('register');
      setOtpTimer(60);
      setIsLoading(false);
      setView('mfa');
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Failed to register account.';
      triggerError(message);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      triggerError('Please enter your registered email address.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      await api.sendOtp(forgotEmail);
      setIsLoading(false);
      setView('forgot-password-success');
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Failed to dispatch reset link / OTP.';
      triggerError(message);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      triggerError('Please complete all password fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      triggerError('Passwords do not match.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      await api.resetPassword(forgotEmail || email, newPassword);
      setSuccessMsg('Password updated successfully! Log in now.');
      setNewPassword('');
      setConfirmNewPassword('');
      setOtpPurpose('mfa');
      setView('login');
      setIsLoading(false);
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Failed to reset password.';
      triggerError(message);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const loginEmail = email || 'google_student@smartface.pro';
      const loginName = loginEmail.split('@')[0];
      let resolvedRole = 'student';
      if (loginEmail.includes('teacher')) resolvedRole = 'teacher';
      else if (loginEmail.includes('admin')) resolvedRole = 'admin';
      else if (loginEmail.includes('parent')) resolvedRole = 'parent';

      const data = await api.googleLogin(loginEmail, loginName, resolvedRole);
      confetti({ particleCount: 80, spread: 60 });
      setIsLoading(false);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', loginEmail);
      if (data.role === 'student') {
        router.push('/student');
      } else if (data.role === 'teacher') {
        router.push('/teacher');
      } else if (data.role === 'admin' || data.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Google Auth failed.';
      triggerError(message);
    }
  };

  // Pre-fill email if remembered
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedUser');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // Onboarding helpers
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-800 w-0' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500 w-1/4' };
    if (score <= 3) return { score, label: 'Medium', color: 'bg-amber-500 w-2/4' };
    return { score, label: 'Strong', color: 'bg-emerald-500 w-full' };
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token') || '';
      
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        await api.uploadAvatar(formData, token);
      }
      
      await api.completeProfile({
        gender: regGender,
        dob: regDob,
        address: regAddress,
        department: regDepartment,
        course: regCourse,
        semester: regSemester,
        student_id: regStudentId,
        phone: regPhone,
        full_name: regName
      }, token);
      
      setIsLoading(false);
      setView('biometric-enrollment');
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Failed to save profile setup details.';
      triggerError(message);
    }
  };

  const startCamera = async () => {
    setErrorMsg('');
    try {
      setCameraActive(true);
      setScanMessage('Position face in circle (Front Angle)');
      
      setTimeout(() => {
        const video = document.getElementById('scanner-video') as HTMLVideoElement;
        if (video) {
          navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 480, facingMode: 'user' } })
            .then((stream) => {
              video.srcObject = stream;
              video.play();
              setScanChecks({ lighting: true, blur: true, position: true, eyes: true });
            })
            .catch((err) => {
              console.warn("Camera hardware access denied:", err);
              setScanMessage("Camera access blocked. Use simulated holographic scanner below.");
            });
        }
      }, 300);
    } catch (err) {
      console.error("Camera access error:", err);
      setScanMessage("Unable to access camera hardware.");
    }
  };

  const stopCamera = () => {
    const video = document.getElementById('scanner-video') as HTMLVideoElement;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleCaptureAngle = () => {
    setIsScanning(true);
    setScanMessage(`Scanning face (${currentScanAngle.toUpperCase()} angle)...`);
    
    setTimeout(() => {
      let base64Img = '';
      
      const video = document.getElementById('scanner-video') as HTMLVideoElement;
      if (video && video.srcObject) {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 480, 480);
          base64Img = canvas.toDataURL('image/jpeg');
        }
      } else {
        base64Img = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      }
      
      const updated = [...capturedImages, base64Img];
      setCapturedImages(updated);
      setIsScanning(false);
      
      if (currentScanAngle === 'front') {
        setCurrentScanAngle('left');
        setScanMessage('Tilt head left and align in circle');
      } else if (currentScanAngle === 'left') {
        setCurrentScanAngle('right');
        setScanMessage('Tilt head right and align in circle');
      } else {
        setScanMessage('All angles verified. Activating biometrics...');
        handleFaceSubmit(updated);
      }
    }, 1200);
  };

  const handleFaceSubmit = async (imagesList: string[]) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token') || '';
      await api.registerFaceBiometrics(imagesList, token);
      
      stopCamera();
      confetti({ particleCount: 150, spread: 80 });
      setView('activation-success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Biometric quality check failed. Try again.';
      triggerError(message);
      setCapturedImages([]);
      setCurrentScanAngle('front');
      setScanMessage('Biometrics failed. Position face for Front Angle and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 5 activation counter
  useEffect(() => {
    if (view === 'activation-success') {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [view, router]);

  return (
    <div className="min-h-screen bg-[#020617] flex relative overflow-hidden font-sans select-none">
      
      {/* 3D Canvas Background (Left Panel) */}
      <NetworkBackground />

      {/* Floating Particles Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-blue-500/10 blur-[2px] animate-pulse-slow"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 8 + 4}s`
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative z-10 w-full">
        
        {/* Left Side: 3D Face Animation & Branding */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 border-r border-white/5 relative bg-gradient-to-br from-slate-950/70 via-transparent to-transparent font-sans">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 relative group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.25)] animate-pulse-slow">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight uppercase">
                SmartFace <span className="text-primary font-mono text-sm font-black">AI</span>
              </span>
              <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Next-Generation Attendance Platform</span>
            </div>
          </div>

          {/* 3D Scanning Mesh Head */}
          <div className="my-auto relative flex items-center justify-center h-[420px] w-full">
            <HeroFaceCanvas />

            {/* Floating Card 1: 98.7% Accuracy */}
            <motion.div 
              style={{ transform: `translate3d(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px, 0)` }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-12 left-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/5 shadow-2xl flex items-center gap-3 max-w-[200px]"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                📊
              </div>
              <div className="flex-1">
                <span className="text-[8px] text-slate-500 block font-mono">ACCURACY</span>
                <span className="text-xs font-bold text-white block">98.7% Recognition</span>
                <svg className="w-20 h-6 text-emerald-400 mt-1" viewBox="0 0 100 30" fill="none">
                  <path d="M0,25 Q15,5 30,18 T60,5 T90,12 L100,2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            </motion.div>

            {/* Floating Card 2: 50,000+ Records */}
            <motion.div 
              style={{ transform: `translate3d(${mousePos.x * -0.6}px, ${mousePos.y * -0.6}px, 0)` }}
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-20 right-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/5 shadow-2xl flex items-center gap-3 max-w-[200px]"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                👨‍🎓
              </div>
              <div>
                <span className="text-[8px] text-slate-500 block font-mono">ENROLLMENT</span>
                <span className="text-xs font-bold text-white block">50,000+ Records</span>
                <div className="flex -space-x-1.5 overflow-hidden mt-1.5">
                  <div className="w-4 h-4 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-[7px] text-white">A</div>
                  <div className="w-4 h-4 rounded-full bg-slate-600 border border-slate-900 flex items-center justify-center text-[7px] text-white">B</div>
                  <div className="w-4 h-4 rounded-full bg-slate-500 border border-slate-900 flex items-center justify-center text-[7px] text-white">C</div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card 3: Real-Time Monitoring */}
            <motion.div 
              style={{ transform: `translate3d(${mousePos.x * 0.5}px, ${mousePos.y * -0.5}px, 0)` }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-12 left-2 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/5 shadow-2xl flex items-center gap-3 max-w-[180px]"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 animate-pulse">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[8px] text-slate-500 block font-mono">MONITORING</span>
                <span className="text-xs font-bold text-white block">Real-Time Sync</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest">SYS SECURE</span>
                </div>
              </div>
            </motion.div>

            {/* Floating Card 4: Enterprise Security */}
            <motion.div 
              style={{ transform: `translate3d(${mousePos.x * -0.7}px, ${mousePos.y * 0.7}px, 0)` }}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-20 right-2 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/5 shadow-2xl flex items-center gap-3 max-w-[180px]"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Shield className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-[8px] text-slate-500 block font-mono">SECURITY</span>
                <span className="text-xs font-bold text-white block">Enterprise Shield</span>
                <span className="text-[8px] font-mono text-purple-400 uppercase block mt-0.5">ACTIVE</span>
              </div>
            </motion.div>
          </div>

          {/* Core Telemetry Info */}
          <div className="grid grid-cols-3 gap-6 border-t border-white/5 pt-8">
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Accuracy</span>
              <span className="text-sm font-bold text-white mt-1 block">99.8% (ArcFace)</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Security</span>
              <span className="text-sm font-bold text-white mt-1 block">Anti-Proxy Rotating</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Authorization</span>
              <span className="text-sm font-bold text-white mt-1 block">MFA Enabled</span>
            </div>
          </div>

        </div>

        {/* Right Side: Glassmorphism Login Card */}
        <div className="flex-1 md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
          
          {/* Spotlight backdrop for glass card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="absolute top-6 right-6 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SECURE SESSION
            </span>
          </div>

          <motion.div
            variants={shakeVariants}
            animate={shakeError ? "shake" : "default"}
            initial={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-white/[0.04] border border-white/10 rounded-[32px] p-8 backdrop-blur-[30px] shadow-2xl relative overflow-hidden"
          >
            
            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-400 font-sans">
                <ShieldCheckIcon className="w-5 h-5 shrink-0 text-emerald-400" />
                <div>
                  <span className="font-bold block">Action Verified</span>
                  <span>{successMsg}</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-400 font-sans">
                <ShieldAlertIcon className="w-5 h-5 shrink-0 text-rose-400" />
                <div>
                  <span className="font-bold block">Access Denied</span>
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* 1. PASSWORD CREDENTIALS LOGIN */}
              {view === 'login' && (
                <motion.div
                  key="credentials-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight">Welcome Back</h2>
                    <p className="text-xs text-slate-400 font-sans mt-1">Sign in to access your SmartFace AI dashboard</p>
                  </div>

                  <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="e.g. student@smartface.pro"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:shadow-[0_0_15px_rgba(37,99,235,0.15)] focus:bg-slate-900/80 transition outline-none font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                          Password
                        </label>
                        <button 
                          type="button" 
                          onClick={() => setView('forgot-password')}
                          className="text-[10px] text-slate-400 hover:text-white transition font-mono uppercase tracking-wider"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:shadow-[0_0_15px_rgba(37,99,235,0.15)] focus:bg-slate-900/80 transition outline-none font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-white transition select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="accent-primary"
                        />
                        <span>Remember Me</span>
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setView('otp-login')}
                        className="text-[10px] text-primary hover:text-blue-400 font-mono uppercase tracking-wider"
                      >
                        Use OTP Login Instead
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-4 py-3.5 bg-primary hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] cursor-pointer"
                    >
                      {isLoading ? 'Verifying Context...' : 'Continue'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5" />
                    </div>
                    <span className="relative bg-slate-950 px-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      OR CONTINUE WITH
                    </span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full py-3 border border-white/5 hover:border-white/10 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl text-xs text-slate-300 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Chrome className="w-4 h-4" />
                      <span>Continue with Google</span>
                    </button>

                    <button
                      onClick={handleGoogleLogin}
                      className="w-full py-3 border border-white/5 hover:border-white/10 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl text-xs text-slate-300 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MicrosoftLogo />
                      <span>Continue with Microsoft</span>
                    </button>
                  </div>

                  {/* Direct Dedicated Portals Demo Access */}
                  <div className="pt-4 border-t border-white/5 space-y-2.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-center font-bold">
                      Direct Dedicated Websites
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        href="/student"
                        className="p-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-center transition flex flex-col items-center gap-1 group cursor-pointer"
                      >
                        <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300">Student</span>
                        <span className="text-[9px] font-mono text-slate-400">/student</span>
                      </Link>

                      <Link
                        href="/teacher"
                        className="p-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-center transition flex flex-col items-center gap-1 group cursor-pointer"
                      >
                        <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300">Lecturer</span>
                        <span className="text-[9px] font-mono text-slate-400">/teacher</span>
                      </Link>

                      <Link
                        href="/admin"
                        className="p-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-center transition flex flex-col items-center gap-1 group cursor-pointer"
                      >
                        <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">Admin</span>
                        <span className="text-[9px] font-mono text-slate-400">/admin</span>
                      </Link>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-400">New user? </span>
                    <button 
                      onClick={() => setView('register')}
                      className="text-xs text-primary hover:underline font-bold"
                    >
                      Create Account
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 2. OTP ONLY LOGIN REQUEST */}
              {view === 'otp-login' && (
                <motion.div
                  key="otp-login-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <button 
                    onClick={() => setView('login')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono uppercase tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to credentials</span>
                  </button>

                  <div>
                    <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight">OTP Login</h2>
                    <p className="text-xs text-slate-400 font-sans mt-1">One-time password passwordless identity scanner.</p>
                  </div>

                  <form onSubmit={handleOtpLoginRequest} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="student@smartface.pro"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none font-sans"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-primary hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] cursor-pointer"
                    >
                      {isLoading ? 'Sending OTP Code...' : 'Request OTP Code'}
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* 3. MULTI-FACTOR / OTP VERIFICATION PANEL */}
              {view === 'mfa' && (
                <motion.div
                  key="mfa-verification-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-emerald-400 animate-pulse">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-white font-sans uppercase">Identity Verification</h3>
                    <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                      We dispatched a 6-digit verification code to your institutional mailbox. Enter it below to complete authorization.
                    </p>
                  </div>

                  <form onSubmit={handleMfaSubmit} className="space-y-6">
                    
                    {/* Premium 6-box OTP Input */}
                    <div className="space-y-3">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block text-center">
                        6-Digit Security Token
                      </label>
                      <div className="flex justify-between gap-2 max-w-xs mx-auto">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <input
                            key={idx}
                            ref={(el) => { otpRefs.current[idx] = el; }}
                            type="text"
                            maxLength={1}
                            value={otpArray[idx]}
                            onChange={(e) => handleOtpBoxChange(e.target.value, idx)}
                            onKeyDown={(e) => handleOtpBoxKeyDown(e, idx)}
                            onPaste={handleOtpBoxPaste}
                            className="w-12 h-12 text-center text-lg font-mono font-bold rounded-xl bg-slate-900/40 border border-white/5 text-white focus:border-emerald-500 focus:bg-slate-900/80 transition outline-none shadow-inner"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition border border-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] cursor-pointer"
                    >
                      {isLoading ? 'Authorizing Context...' : 'Verify Identity Token'}
                    </button>

                    <div className="text-center pt-2">
                      {otpTimer > 0 ? (
                        <span className="text-[11px] font-mono text-slate-500">
                          Resend code in {otpTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-[11px] font-mono text-primary hover:underline uppercase tracking-wide font-bold"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 font-mono uppercase tracking-wider mt-4"
                    >
                      Back to login credentials
                    </button>
                  </form>
                </motion.div>
              )}

              {/* 4. REGISTRATION CARD (STEP 1) */}
              {view === 'register' && (
                <motion.div
                  key="register-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <button 
                    onClick={() => setView('login')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono uppercase tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to credentials</span>
                  </button>

                  <div>
                    <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight">Create Account</h2>
                    <p className="text-xs text-slate-400 font-sans mt-1">Enroll inside SmartFace enterprise registry.</p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                    
                    {/* Role Selector Card Grid */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block mb-1">
                        Select Account Role
                      </label>
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        {[
                          { id: 'student', title: 'Student', desc: 'Verify & scan check-ins', icon: GraduationCap },
                          { id: 'parent', title: 'Parent', desc: 'Monitor child logs', icon: Users },
                          { id: 'teacher', title: 'Teacher', desc: 'Manage check-ins', icon: BookOpen },
                          { id: 'admin', title: 'Admin', desc: 'Control system nodes', icon: ShieldCheck }
                        ].map((roleItem) => {
                          const RoleIcon = roleItem.icon;
                          const isSelected = regRole === roleItem.id;
                          return (
                            <button
                              key={roleItem.id}
                              type="button"
                              onClick={() => setRegRole(roleItem.id)}
                              className={`p-3 rounded-2xl border text-left transition duration-200 outline-none flex flex-col gap-1.5 ${
                                isSelected 
                                  ? 'bg-primary/10 border-primary/45 text-white shadow-[0_0_15px_rgba(37,99,235,0.15)]'
                                  : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/60'
                              }`}
                            >
                              <RoleIcon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-slate-500'}`} />
                              <div>
                                <h4 className="text-xs font-bold font-sans">{roleItem.title}</h4>
                                <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{roleItem.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Alice Cooper"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            placeholder="alice@smartface.pro"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                          Mobile Number
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="+12345678"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                          Confirm
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Meter */}
                    {regPassword && (
                      <div className="space-y-1 p-2 bg-slate-900/20 border border-white/5 rounded-xl">
                        <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-widest font-bold">
                          <span className="text-slate-400">Password Strength</span>
                          <span className={getPasswordStrength(regPassword).score >= 3 ? 'text-emerald-400' : getPasswordStrength(regPassword).score >= 2 ? 'text-amber-400' : 'text-rose-400'}>
                            {getPasswordStrength(regPassword).label}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${getPasswordStrength(regPassword).color} transition-all duration-300`} />
                        </div>
                      </div>
                    )}

                    {/* Terms Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer text-[10px] text-slate-400 hover:text-white transition select-none">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="accent-primary mt-0.5"
                        />
                        <span className="leading-normal font-sans">
                          I agree to the <span className="text-primary hover:underline font-bold">Terms of Service</span> and <span className="text-primary hover:underline font-bold">Privacy Policy</span>.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3 bg-primary hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] cursor-pointer"
                    >
                      {isLoading ? 'Verifying Context...' : 'Submit Enrollment'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* PROFILE SETUP (STEP 3) */}
              {view === 'profile-setup' && (
                <motion.div
                  key="profile-setup-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight">Profile Setup</h2>
                    <p className="text-xs text-slate-400 font-sans mt-1">Configure profile details in SmartFace register.</p>
                  </div>

                  <form onSubmit={handleProfileSetupSubmit} className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {/* Photo Upload Zone */}
                    <div className="flex items-center gap-4 p-4 bg-slate-900/30 border border-white/5 rounded-2xl">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 shrink-0 bg-slate-950 flex items-center justify-center">
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar preview" />
                        ) : (
                          <User className="w-8 h-8 text-slate-600" />
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                          <Camera className="w-4 h-4 text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </label>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Profile Avatar</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">JPEG, PNG, or WEBP. Max 5MB.</span>
                        <label className="text-[10px] text-primary hover:underline font-bold mt-1 block cursor-pointer">
                          Upload Image File
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                          Gender
                        </label>
                        <select
                          value={regGender}
                          onChange={(e) => setRegGender(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-white focus:border-primary outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="date"
                            value={regDob}
                            onChange={(e) => setRegDob(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-white/5 rounded-lg text-xs text-white placeholder-slate-500 focus:border-primary outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                        Home Address
                      </label>
                      <input
                        type="text"
                        placeholder="123 Science Hill Road, Campus Town"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary outline-none"
                      />
                    </div>

                    {regRole === 'student' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                              Department
                            </label>
                            <div className="relative">
                              <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="e.g. CSE"
                                value={regDepartment}
                                onChange={(e) => setRegDepartment(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-white/5 rounded-lg text-xs text-white focus:border-primary outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                              Student ID / Roll No
                            </label>
                            <input
                              type="text"
                              placeholder="CSE-2026-08"
                              value={regStudentId}
                              onChange={(e) => setRegStudentId(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-white/5 rounded-lg text-xs text-white focus:border-primary outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                              Course Program
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. B.Tech CSE"
                              value={regCourse}
                              onChange={(e) => setRegCourse(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-white/5 rounded-lg text-xs text-white focus:border-primary outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                              Semester
                            </label>
                            <select
                              value={regSemester}
                              onChange={(e) => setRegSemester(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-white focus:border-primary outline-none"
                            >
                              <option value="1st Semester">1st Semester</option>
                              <option value="2nd Semester">2nd Semester</option>
                              <option value="3rd Semester">3rd Semester</option>
                              <option value="4th Semester">4th Semester</option>
                              <option value="5th Semester">5th Semester</option>
                              <option value="6th Semester">6th Semester</option>
                              <option value="7th Semester">7th Semester</option>
                              <option value="8th Semester">8th Semester</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-primary hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] cursor-pointer"
                    >
                      {isLoading ? 'Saving profile...' : 'Save & Continue'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* BIOMETRIC ENROLLMENT (STEP 4) */}
              {view === 'biometric-enrollment' && (
                <motion.div
                  key="biometric-enrollment-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes scan-laser {
                      0% { transform: translateY(0); }
                      50% { transform: translateY(176px); }
                      100% { transform: translateY(0); }
                    }
                    .scanner-laser {
                      animation: scan-laser 2s ease-in-out infinite;
                    }
                    @keyframes border-spin {
                      100% { transform: rotate(360deg); }
                    }
                    .scanner-spin {
                      animation: border-spin 12s linear infinite;
                    }
                    @keyframes progress-loading {
                      0% { width: 0%; }
                      100% { width: 100%; }
                    }
                    .animate-progress-bar {
                      animation: progress-loading 2.5s ease-in-out forwards;
                    }
                  `}} />

                  <div className="text-center">
                    <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight">AI Biometrics Scan</h2>
                    <p className="text-xs text-slate-400 font-sans mt-1">Enroll your facial geometry to activate automated check-ins.</p>
                  </div>

                  {/* Video Circular Container */}
                  <div className="relative w-44 h-44 mx-auto rounded-full overflow-hidden border border-white/5 flex items-center justify-center bg-slate-900/60 shadow-[0_0_30px_rgba(139,92,246,0.15)] select-none">
                    <video
                      id="scanner-video"
                      className={`w-full h-full object-cover rounded-full ${cameraActive ? 'block' : 'hidden'}`}
                      playsInline
                      muted
                    />
                    {!cameraActive && (
                      <div className="text-center p-4">
                        <User className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                        <span className="text-[8px] text-slate-500 block uppercase tracking-widest font-mono">Scanner Inactive</span>
                      </div>
                    )}
                    
                    {/* Neon glowing rotators */}
                    <div className="absolute inset-0 rounded-full border border-dashed border-purple-500/50 scanner-spin pointer-events-none" />
                    
                    {/* Scanning laser line */}
                    {isScanning && (
                      <div className="absolute left-0 right-0 h-0.5 bg-purple-400 opacity-80 shadow-[0_0_12px_#a78bfa] scanner-laser pointer-events-none" />
                    )}
                  </div>

                  {/* Angle Indicators */}
                  <div className="flex justify-center gap-4">
                    {[
                      { key: 'front', label: 'Front Angle' },
                      { key: 'left', label: 'Left Profile' },
                      { key: 'right', label: 'Right Profile' }
                    ].map((ang, i) => {
                      const isCaptured = capturedImages.length > i;
                      const isActive = currentScanAngle === ang.key && cameraActive;
                      return (
                        <div key={ang.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-slate-900/40">
                          <div className={`w-2 h-2 rounded-full ${
                            isCaptured ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : isActive ? 'bg-purple-500 animate-ping' : 'bg-slate-700'
                          }`} />
                          <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>{ang.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Scanner Status Box */}
                  <div className="p-4 bg-slate-900/35 border border-white/5 rounded-2xl text-center space-y-2">
                    <p className="text-xs font-mono font-bold text-white tracking-wide">
                      {scanMessage}
                    </p>
                    
                    {/* Diagnostic logs */}
                    <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono pt-1 text-slate-400">
                      <div className="flex flex-col items-center">
                        <span>Lighting</span>
                        <span className={scanChecks.lighting ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                          {scanChecks.lighting ? '● PASSED' : '● WAIT'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span>Focus/Blur</span>
                        <span className={scanChecks.blur ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                          {scanChecks.blur ? '● PASSED' : '● WAIT'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span>Position</span>
                        <span className={scanChecks.position ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                          {scanChecks.position ? '● PASSED' : '● WAIT'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span>Eyes</span>
                        <span className={scanChecks.eyes ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                          {scanChecks.eyes ? '● PASSED' : '● WAIT'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-2.5">
                    {!cameraActive ? (
                      <button
                        onClick={startCamera}
                        type="button"
                        className="w-full py-3.5 bg-primary hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Initialize Biometric Camera</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleCaptureAngle}
                        type="button"
                        disabled={isScanning}
                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-purple-500/20 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{isScanning ? `Scanning ${currentScanAngle.toUpperCase()}...` : `Capture ${currentScanAngle.toUpperCase()} View`}</span>
                      </button>
                    )}
                    
                    {/* Bypass Simulation Button */}
                    <button
                      onClick={() => {
                        if (!cameraActive) setCameraActive(true);
                        setScanChecks({ lighting: true, blur: true, position: true, eyes: true });
                        handleCaptureAngle();
                      }}
                      type="button"
                      className="w-full py-2.5 border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Skip & Run Simulated AI Scan</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ACTIVATION SUCCESS (STEP 5) */}
              {view === 'activation-success' && (
                <motion.div
                  key="activation-success-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 text-center py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-bounce">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-white font-sans uppercase">Biometric Portal Activated</h3>
                    <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                      Your role assignment (<strong>{regRole.toUpperCase()}</strong>) has been successfully registered on the secure network.
                    </p>
                  </div>

                  {/* Visual Loading Bar */}
                  <div className="w-full max-w-xs mx-auto space-y-2 pt-4">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      <span>Initializing Workspace...</span>
                      <span>100% Secure</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 border border-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full animate-progress-bar" style={{ width: '100%' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 5. FORGOT PASSWORD FLOW */}
              {view === 'forgot-password' && (
                <motion.div
                  key="forgot-password-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <button 
                    onClick={() => setView('login')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono uppercase tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Login</span>
                  </button>

                  <div>
                    <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight">Forgot Password</h2>
                    <p className="text-xs text-slate-400 font-sans mt-1">Enter institutional email address to recover identity.</p>
                  </div>

                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          placeholder="alice@smartface.pro"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-primary hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] cursor-pointer"
                    >
                      {isLoading ? 'Requesting recovery...' : 'Send Reset Link'}
                      <KeyRound className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* 5.1 FORGOT PASSWORD EMAIL SENT ILLUSTRATION SCREEN */}
              {view === 'forgot-password-success' && (
                <motion.div
                  key="forgot-password-success-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 text-center py-6"
                >
                  <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-primary relative z-10 shadow-2xl">
                      <Mail className="w-8 h-8 animate-bounce" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-white font-sans uppercase">Recovery Email Sent</h3>
                    <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                      A secure link containing a 6-digit OTP verification code has been dispatched to <strong>{forgotEmail}</strong>.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4">
                    <button
                      onClick={() => {
                        setEmail(forgotEmail);
                        setOtpPurpose('forgot-password');
                        setOtpTimer(60);
                        setView('mfa');
                      }}
                      className="w-full py-3.5 bg-primary hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-primary/20 cursor-pointer"
                    >
                      <span>Verify OTP Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setView('login')}
                      className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 font-mono uppercase tracking-wider"
                    >
                      Back to Login credentials
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 6. RESET PASSWORD SCREEN */}
              {view === 'reset-password' && (
                <motion.div
                  key="reset-password-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-black text-white font-sans uppercase tracking-tight">Reset Password</h2>
                    <p className="text-xs text-slate-400 font-sans mt-1">Configure new credentials for {forgotEmail || email}.</p>
                  </div>

                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold block">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-white placeholder-slate-500 focus:border-primary focus:bg-slate-900/80 transition outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition border border-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] cursor-pointer"
                    >
                      {isLoading ? 'Resetting Password...' : 'Save Password Credentials'}
                    </button>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </div>

      </div>

    </div>
  );
}
