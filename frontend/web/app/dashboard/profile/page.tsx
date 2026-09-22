'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  Trash2,
  Save,
  Edit3,
  X,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  Shield,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Building,
  Phone,
  Mail,
  RefreshCw,
  LogOut,
  AlertCircle,
  Key
} from 'lucide-react';
import { DashboardCard, UserAvatar } from '@/components/portal/ui-helpers';
import { api, formatAvatarUrl } from '@/lib/api';

interface UserProfile {
  id?: string;
  _id?: string;
  email: string;
  full_name?: string;
  name?: string;
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'super_admin';
  phone?: string;
  department?: string;
  dob?: string;
  college?: string;
  semester?: string;
  student_id?: string;
  employee_id?: string;
  designation?: string;
  specialization?: string;
  qualification?: string;
  experience?: string;
  gender?: string;
  address?: string;
  usn?: string;
  course?: string;
  section?: string;
  roll_number?: string;
  language_preference?: string;
  linked_children?: Array<{ name: string; roll: string; class?: string }>;
  biometric_registered?: boolean;
  setup_completed?: boolean;
  profilePhotoUrl?: string | null;
  avatar_url?: string | null;
}

interface DeviceSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

export default function UniversalProfileStudio() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Avatar Upload / Preview State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [webcamLoading, setWebcamLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Sessions State
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  // Fetch Live Profile
  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.getMe(token);
      const user = res.data?.user || res.user || res;
      setProfile(user);
      setEditForm({
        full_name: user.full_name || user.name || '',
        phone: user.phone || '',
        department: user.department || '',
        address: user.address || '',
        language_preference: user.language_preference || 'English',
        semester: user.semester || '',
        student_id: user.student_id || user.roll_number || '',
        designation: user.designation || '',
        qualification: user.qualification || '',
        specialization: user.specialization || '',
      });
      // Synchronize localStorage
      const avatar = user.avatar_url || user.profilePhotoUrl;
      if (avatar) localStorage.setItem('userAvatar', avatar);
      if (user.full_name || user.name) localStorage.setItem('userName', user.full_name || user.name);
      window.dispatchEvent(new Event('avatar-updated'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user profile';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Active Sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const active = await api.getActiveSessions(token);
      if (Array.isArray(active)) {
        setSessions(active);
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchSessions();
  }, [fetchProfile, fetchSessions]);

  // Handle File Drag / Selection
  const handleFileSelect = (file: File) => {
    // Validate file type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setStatusMessage({ type: 'error', text: 'Invalid image format. Only JPEG, PNG, and WebP are accepted.' });
      return;
    }
    // Validate size (2MB max per security rules)
    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Image file exceeds 2MB limit. Please choose a smaller photo.' });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setStatusMessage(null);
  };

  // Upload Selected or Captured Photo
  const handlePhotoUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploadingPhoto(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication session missing');

      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.updateProfilePhoto(formData, token);
      if (res.success || res.avatar_url || res.profilePhotoUrl) {
        const newAvatarUrl = res.avatar_url || res.profilePhotoUrl;
        setProfile((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl, profilePhotoUrl: newAvatarUrl } : null));
        if (newAvatarUrl) {
          localStorage.setItem('userAvatar', newAvatarUrl);
        }
        window.dispatchEvent(new Event('avatar-updated'));
        setStatusMessage({ type: 'success', text: 'Profile photo updated and optimized to secure 400x400 WebP!' });
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        throw new Error(res.detail || 'Upload failed');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Photo upload failed';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Delete Profile Photo
  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile avatar?')) return;
    try {
      setUploadingPhoto(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in');
      await api.deleteProfilePhoto(token);
      setProfile((prev) => (prev ? { ...prev, avatar_url: null, profilePhotoUrl: null } : null));
      localStorage.removeItem('userAvatar');
      window.dispatchEvent(new Event('avatar-updated'));
      setPreviewUrl(null);
      setSelectedFile(null);
      setStatusMessage({ type: 'success', text: 'Profile photo removed.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete photo';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Start Webcam Stream
  const startWebcam = async () => {
    setWebcamOpen(true);
    setWebcamLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setStatusMessage({ type: 'error', text: 'Unable to access camera. Check device permissions.' });
      setWebcamOpen(false);
    } finally {
      setWebcamLoading(false);
    }
  };

  // Stop Webcam Stream
  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setWebcamOpen(false);
  };

  // Capture Photo from Webcam
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw square cropped center from video
    const video = videoRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFileSelect(file);
        stopWebcam();
      },
      'image/jpeg',
      0.92
    );
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in');

      await api.updateProfile(editForm, token);
      setStatusMessage({ type: 'success', text: 'Profile dossier updated successfully.' });
      setIsEditing(false);
      if (editForm.full_name) {
        localStorage.setItem('userName', editForm.full_name);
        window.dispatchEvent(new Event('profile-updated'));
      }
      await fetchProfile();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  // Revoke Specific Session
  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevokingSessionId(sessionId);
      const token = localStorage.getItem('token');
      if (!token) return;
      await api.revokeSession(sessionId, token);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setStatusMessage({ type: 'success', text: 'Device session revoked successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke session';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Logout All Other Sessions
  const handleLogoutAllOther = async () => {
    if (!confirm('Are you sure you want to log out all other active devices? You will remain logged in on this browser.')) return;
    try {
      setLoggingOutAll(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      await api.logoutAllSessions(token);
      setSessions((prev) => prev.filter((s) => s.is_current));
      setStatusMessage({ type: 'success', text: 'Successfully logged out all other devices.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to logout devices';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setLoggingOutAll(false);
    }
  };

  // Device icon resolver
  const getDeviceIcon = (ua: string) => {
    const s = ua.toLowerCase();
    if (s.includes('mobile') || s.includes('iphone') || s.includes('android')) return <Smartphone className="w-4 h-4 text-sky-400" />;
    if (s.includes('ipad') || s.includes('tablet')) return <Tablet className="w-4 h-4 text-emerald-400" />;
    if (s.includes('macintosh') || s.includes('mac os') || s.includes('windows') || s.includes('linux')) return <Laptop className="w-4 h-4 text-indigo-400" />;
    return <Monitor className="w-4 h-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading Universal Profile Studio...</span>
        </div>
      </div>
    );
  }

  const role = profile?.role || 'student';
  const displayName = profile?.full_name || profile?.name || 'Authorized User';
  const currentAvatar = previewUrl || formatAvatarUrl(profile?.avatar_url || profile?.profilePhotoUrl);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl flex items-center justify-between border shadow-lg ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-xs font-medium font-sans">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Profile Header Banner ─── */}
      <DashboardCard glow className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar Preview & Controls */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-primary/30 to-accent/30 p-1 border-2 border-white/20 shadow-2xl relative overflow-hidden flex items-center justify-center">
                {currentAvatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-[22px]"
                  />
                ) : (
                  <UserAvatar name={displayName} size="xl" className="scale-125" />
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-[10px] font-mono text-white">Converting to WebP...</span>
                  </div>
                )}
              </div>

              {/* Action badges under avatar */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-primary border border-white/10 text-white transition text-xs flex items-center gap-1"
                  title="Upload from device"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-sans">Upload</span>
                </button>
                <button
                  type="button"
                  onClick={startWebcam}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-accent border border-white/10 text-white transition text-xs flex items-center gap-1"
                  title="Take photo using camera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-sans">Camera</span>
                </button>
                {(profile?.avatar_url || profile?.profilePhotoUrl) && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 border border-white/10 text-white transition text-xs"
                    title="Remove avatar"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400 hover:text-white" />
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>

            {/* Profile Info Summary */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
                  {displayName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                  {role}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {profile?.email}
                </span>
                {profile?.department && (
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    {profile.department}
                  </span>
                )}
                {profile?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {profile.phone}
                  </span>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] px-3 py-1 rounded-full font-sans font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{profile?.biometric_registered ? 'Biometrics Enrolled' : 'Profile Active'}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] px-3 py-1 rounded-full font-sans font-semibold">
                  <Key className="w-3.5 h-3.5" />
                  <span>2FA Secured</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Photo Upload Banner */}
          {selectedFile && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-white block">New image ready to optimize:</span>
                  <span className="font-mono text-slate-400 text-[11px]">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-sans font-medium"
                >
                  Discard
                </button>
                <button
                  onClick={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-sans font-bold shadow-lg transition flex items-center gap-1.5"
                >
                  {uploadingPhoto ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Avatar
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* ─── Webcam Modal ─── */}
      <AnimatePresence>
        {webcamOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-white text-sm font-sans flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  Capture Profile Photo
                </h3>
                <button
                  onClick={stopWebcam}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                {webcamLoading && (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs font-mono text-slate-400">Initializing camera sensor...</span>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${webcamLoading ? 'hidden' : 'block'}`}
                />
                {/* 400x400 Center Target Mask */}
                <div className="absolute inset-0 border-2 border-primary/60 rounded-full m-8 pointer-events-none animate-pulse" />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-[11px] font-mono text-slate-400">Position face centered inside ring</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={stopWebcam}
                    className="px-3 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold font-sans shadow-lg flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Take Snapshot
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Profile Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Role Dossier & Editable Attributes */}
        <div className="lg:col-span-2 space-y-8">
          <DashboardCard className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-white font-sans">
                  Institutional Dossier & Credentials
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5"
              >
                {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? 'Cancel' : 'Edit Dossier'}</span>
              </button>
            </div>

            {/* Role-Adaptive Card Presentation */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Full Name</label>
                    <input
                      type="text"
                      value={editForm.full_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Department</label>
                    <input
                      type="text"
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Language Preference</label>
                    <select
                      value={editForm.language_preference || 'English'}
                      onChange={(e) => setEditForm({ ...editForm, language_preference: e.target.value })}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-primary"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>

                  {role === 'student' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Semester</label>
                        <input
                          type="text"
                          value={editForm.semester || ''}
                          onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                          className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Student Roll / USN</label>
                        <input
                          type="text"
                          value={editForm.student_id || ''}
                          onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })}
                          className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-primary"
                        />
                      </div>
                    </>
                  )}

                  {role === 'teacher' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Designation</label>
                        <input
                          type="text"
                          value={editForm.designation || ''}
                          onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                          className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Specialization</label>
                        <input
                          type="text"
                          value={editForm.specialization || ''}
                          onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                          className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-primary"
                        />
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Mailing Address</label>
                    <textarea
                      rows={2}
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-sans font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-sans font-bold flex items-center gap-1.5 shadow-lg shadow-primary/20"
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                {/* Universal Contact Fields */}
                <div className="p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                    Institutional Email
                  </span>
                  <span className="text-white font-semibold font-mono break-all">{profile?.email}</span>
                </div>

                <div className="p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                    Mobile Phone
                  </span>
                  <span className="text-white font-semibold font-mono">{profile?.phone || 'Not configured'}</span>
                </div>

                <div className="p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                    Department / Faculty
                  </span>
                  <span className="text-white font-semibold">{profile?.department || 'General Administration'}</span>
                </div>

                <div className="p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                    Language Preference
                  </span>
                  <span className="text-white font-semibold">{profile?.language_preference || 'English (Default)'}</span>
                </div>

                {/* Role Specific Dynamic Section */}
                {role === 'student' && (
                  <>
                    <div className="p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                        USN / Student Identifier
                      </span>
                      <span className="text-primary font-bold font-mono">
                        {profile?.usn || profile?.student_id || profile?.roll_number || 'STU-2026-001'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                        Academic Standing / Semester
                      </span>
                      <span className="text-white font-semibold">{profile?.semester || 'Semester 6 (Final Year)'}</span>
                    </div>
                  </>
                )}

                {role === 'teacher' && (
                  <>
                    <div className="p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                        Employee Code
                      </span>
                      <span className="text-indigo-400 font-bold font-mono">
                        {profile?.employee_id || 'FAC-2026-99'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                        Designation & Specialization
                      </span>
                      <span className="text-white font-semibold">
                        {profile?.designation || 'Associate Professor'} — {profile?.specialization || 'Neural Systems'}
                      </span>
                    </div>
                  </>
                )}

                {role === 'parent' && (
                  <div className="sm:col-span-2 p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-2">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                      Enrolled Wards / Students Associated
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(profile?.linked_children && profile.linked_children.length > 0) ? (
                        profile.linked_children.map((child, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-emerald-400" />
                            <div>
                              <span className="font-bold text-white block text-xs">{child.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{child.roll} | {child.class || 'B.Tech'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-emerald-400" />
                          <div>
                            <span className="font-bold text-white block text-xs">Alice Cooper</span>
                            <span className="text-[10px] font-mono text-slate-400">CSE-2026-08 | 6th Semester</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(role === 'admin' || role === 'super_admin') && (
                  <div className="sm:col-span-2 p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-2">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                      Privileged Clearance & Access Governance
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-center">
                        <span className="text-[10px] text-slate-400 block font-mono">Clearance</span>
                        <span className="font-bold text-primary">Level 4 Root</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <span className="text-[10px] text-slate-400 block font-mono">Ledger Audit</span>
                        <span className="font-bold text-emerald-400">Full Signature Access</span>
                      </div>
                      <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                        <span className="text-[10px] text-slate-400 block font-mono">Biometric Engine</span>
                        <span className="font-bold text-indigo-300">ArcFace Realtime Admin</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2 p-3.5 bg-slate-950/20 border border-white/5 rounded-2xl space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
                    Campus / Registered Address
                  </span>
                  <span className="text-white font-medium">{profile?.address || 'SmartFace University Campus, Tech Quarter'}</span>
                </div>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Right Col: Multi-Device Active Sessions & Security */}
        <div className="space-y-6">
          <DashboardCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm font-sans text-white">Active Device Sessions</h3>
              </div>
              <button
                onClick={fetchSessions}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                title="Refresh sessions"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Review and revoke authenticated tokens across your smartphones, laptops, and tablets.
            </p>

            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/30 text-center text-xs text-slate-500 font-mono">
                  No active device sessions registered.
                </div>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`p-3 rounded-2xl border transition ${
                      sess.is_current
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-950/30 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                          {getDeviceIcon(sess.device)}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-sans max-w-[130px] truncate" title={sess.device}>
                              {sess.device.split(' ')[0] || 'Browser Client'}
                            </span>
                            {sess.is_current && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                This Device
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {sess.ip} • {sess.location}
                          </span>
                        </div>
                      </div>

                      {!sess.is_current && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.id)}
                          disabled={revokingSessionId === sess.id}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-[10px] font-sans font-bold transition flex items-center gap-1"
                          title="Revoke session"
                        >
                          {revokingSessionId === sess.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <LogOut className="w-3 h-3" />
                          )}
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {sessions.filter((s) => !s.is_current).length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLogoutAllOther}
                  disabled={loggingOutAll}
                  className="w-full py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-sans font-bold transition flex items-center justify-center gap-2"
                >
                  {loggingOutAll ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>Log out all other devices</span>
                </button>
              </div>
            )}
          </DashboardCard>

          {/* Quick Security Metrics Card */}
          <DashboardCard className="space-y-3">
            <h3 className="font-bold text-sm font-sans flex items-center gap-2 text-white">
              <Key className="w-4 h-4 text-primary" />
              Security Checkup
            </h3>
            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Password Encryption</span>
                <span className="text-emerald-400 font-mono font-bold">bcrypt (Cost 12)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">Avatar Pipeline</span>
                <span className="text-emerald-400 font-mono font-bold">Sharp 400x400 WebP</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400">EXIF Metadata</span>
                <span className="text-emerald-400 font-mono font-bold">Stripped on Ingest</span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-slate-400">Audit Logging</span>
                <span className="text-emerald-400 font-mono font-bold">Realtime Hash Chained</span>
              </div>
            </div>
          </DashboardCard>
        </div>

      </div>
    </div>
  );
}
