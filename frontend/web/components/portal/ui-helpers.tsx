'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle, User } from 'lucide-react';

// Upgraded Premium Dashboard Card
interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  floating?: boolean;
  delay?: number; // stagger delay in ms
}

export function DashboardCard({ 
  children, 
  className = '', 
  glow = false,
  floating = false,
  delay = 0
}: DashboardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for tilt tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for rotating angles (-8deg to +8deg)
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 25 });

  // Magnetic hover offset springs (-10px to +10px)
  const translateX = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 22 });
  const translateY = useSpring(useTransform(y, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 22 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize coordinates between -0.5 and 0.5 relative to card center
    const mouseX = (event.clientX - rect.left) / width - 0.5;
    const mouseY = (event.clientY - rect.top) / height - 0.5;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes premiumBorderGlow {
          0%, 100% {
            border-color: rgba(255, 255, 255, 0.12);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 0 10px rgba(37, 99, 235, 0.02);
          }
          50% {
            border-color: rgba(139, 92, 246, 0.3);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35), 0 0 25px rgba(139, 92, 246, 0.12);
          }
        }
        @keyframes premiumFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes premiumLightSweep {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .premium-card-glow {
          animation: premiumBorderGlow 6s infinite ease-in-out;
        }
        .premium-card-float {
          animation: premiumFloat 4s infinite ease-in-out;
        }
        .premium-glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          transform-style: preserve-3d;
          perspective: 1500px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .premium-glass-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
        }
        /* Icon scaling & rotation on hover */
        .premium-glass-card:hover .lucide {
          transform: scale(1.2) rotate(8deg);
          filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.4));
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease;
        }
        .premium-glass-card .lucide {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
        }
        /* Reveal animation for content */
        .premium-glass-card .reveal-title {
          transition: transform 0.3s ease;
        }
        .premium-glass-card:hover .reveal-title {
          transform: translateY(-3px);
        }
        .premium-glass-card .reveal-desc {
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }
        .premium-glass-card:hover .reveal-desc {
          opacity: 1;
        }
      `}} />

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ 
          duration: 0.8, 
          ease: [0.16, 1, 0.3, 1], // easeOutExpo
          delay: delay / 1000 
        }}
        style={{
          rotateX,
          rotateY,
          x: translateX,
          y: translateY,
          transformStyle: 'preserve-3d',
        }}
        className={`premium-glass-card rounded-3xl p-6 relative overflow-hidden ${
          glow ? 'premium-card-glow' : ''
        } ${
          floating ? 'premium-card-float' : ''
        } ${className}`}
      >
        {/* Light Sweep Glow overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-3xl">
          <div 
            className="absolute top-0 bottom-0 w-[45%] bg-linear-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
            style={{
              left: '-100%',
              animation: 'premiumLightSweep 3.5s infinite linear',
            }}
          />
        </div>

        {/* Inner Card Content */}
        <div style={{ transform: 'translateZ(10px)' }}>
          {children}
        </div>
      </motion.div>
    </>
  );
}

// Reusable Status Badge
interface StatusBadgeProps {
  status: 'Present' | 'Absent' | 'Late' | 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Expired';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let Icon = CheckCircle;

  if (status === 'Absent' || status === 'Rejected' || status === 'Expired') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    Icon = ShieldAlert;
  } else if (status === 'Late' || status === 'Pending') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    Icon = AlertTriangle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${styles}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{status}</span>
    </span>
  );
}

// User Avatar component
interface UserAvatarProps {
  name: string;
  role?: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ name, role, avatarUrl, size = 'md', className = '' }: UserAvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const formattedUrl = React.useMemo(() => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')) {
      return avatarUrl;
    }
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const cleanPath = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
    return `${base}${cleanPath}`;
  }, [avatarUrl]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizes[size]} rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center font-bold font-sans text-white border border-white/10 shadow-inner relative overflow-hidden shrink-0`}>
        {formattedUrl && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={formattedUrl}
            alt={name}
            className="w-full h-full object-cover rounded-full"
            onError={() => setImgError(true)}
          />
        ) : (
          initials || <User className="w-4 h-4" />
        )}
      </div>
      {role && (
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-white font-sans truncate">{name}</span>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase truncate">{role}</span>
        </div>
      )}
    </div>
  );
}

// Skeleton Loader
export function SkeletonLoader({ className = '', count = 1 }) {
  return (
    <div className="space-y-2 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-slate-800/40 rounded animate-pulse w-full border border-white/5 ${className}`}
        />
      ))}
    </div>
  );
}

// Empty State View
export function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900/10 border border-white/5 rounded-2xl backdrop-blur-sm min-h-50">
      {Icon && <Icon className="w-10 h-10 text-slate-500 mb-3" />}
      <h4 className="text-sm font-bold text-white mb-1 font-sans">{title}</h4>
      <p className="text-xs text-slate-400 max-w-xs font-sans leading-relaxed">{description}</p>
    </div>
  );
}
