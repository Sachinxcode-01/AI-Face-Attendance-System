'use client';

import React, { useRef } from 'react';

interface OtpInputProps {
  value: string[];
  onChange: (digits: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, onComplete, disabled = false }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean && raw !== '') return;

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const next = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
      onChange(next);
      const focusIdx = Math.min(5, pasted.length - 1);
      inputRefs.current[focusIdx]?.focus();
      if (next.every((d) => d) && onComplete) onComplete(next.join(''));
      return;
    }

    const next = [...value];
    next[index] = clean;
    onChange(next);
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d) && onComplete) {
      onComplete(next.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
    onChange(next);
    const focusIdx = Math.min(5, pasted.length - 1);
    inputRefs.current[focusIdx]?.focus();
    if (next.every((d) => d) && onComplete) {
      onComplete(next.join(''));
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5 py-2" role="group" aria-label="One-time verification code">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of 6`}
          onPaste={handlePaste}
          onChange={(e) => handleDigitChange(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digit && i > 0) {
              inputRefs.current[i - 1]?.focus();
            } else if (e.key === 'ArrowLeft' && i > 0) {
              inputRefs.current[i - 1]?.focus();
            } else if (e.key === 'ArrowRight' && i < 5) {
              inputRefs.current[i + 1]?.focus();
            }
          }}
          className="h-12 w-10 sm:w-11 rounded-[14px] border border-[var(--hairline)] bg-surface text-center font-mono text-base font-bold text-hi transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        />
      ))}
    </div>
  );
}
