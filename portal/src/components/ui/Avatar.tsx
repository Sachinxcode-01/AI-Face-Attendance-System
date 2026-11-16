'use client';

import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
}

const sizes = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

export function Avatar({ src, name, size = 'md', ring = true }: AvatarProps) {
  const initials = name
    .replace(/^(Prof\.|Dr\.)\s+/, '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent2 font-bold text-[#050507] ${sizes[size]} ${ring ? 'ring-2 ring-white/20' : ''
        }`}
    >
      {src ? (
        <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} loading="lazy" />
      ) : (
        initials
      )}
    </div>
  );
}
