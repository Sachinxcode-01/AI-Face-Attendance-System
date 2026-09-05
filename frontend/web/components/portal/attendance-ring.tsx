'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AttendanceRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

export default function AttendanceRing({
  percentage,
  size = 140,
  strokeWidth = 12,
  className = '',
  showText = true,
}: AttendanceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color theme based on attendance rate
  let strokeColor = 'stroke-emerald-500';
  let glowColor = 'rgba(16, 185, 129, 0.25)';
  let textColor = 'text-emerald-400';

  if (percentage < 65) {
    strokeColor = 'stroke-rose-500';
    glowColor = 'rgba(239, 68, 68, 0.25)';
    textColor = 'text-rose-400';
  } else if (percentage < 75) {
    strokeColor = 'stroke-amber-500';
    glowColor = 'rgba(245, 158, 11, 0.25)';
    textColor = 'text-amber-400';
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-800 fill-none"
          strokeWidth={strokeWidth}
        />
        
        {/* Animated Fill Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${strokeColor} fill-none`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />
      </svg>

      {/* Internal Value Readout */}
      {showText && (
        <div className="absolute flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-2xl font-black tracking-tight font-sans ${textColor}`}
          >
            {percentage}%
          </motion.span>
          <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">
            ATTENDANCE
          </span>
        </div>
      )}
    </div>
  );
}
