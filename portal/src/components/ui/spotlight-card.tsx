"use client";

import React, { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
  onClick?: () => void;
  actionLabel?: string;
  enableTilt?: boolean;
}

/**
 * Modern Spotlight Card.
 * Tracks mouse position to create a smooth, glowing radial light on borders and background.
 * Optionally adds subtle 3D parallax tilt for an ultra-premium feel.
 */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(143, 139, 255, 0.15)",
  borderColor = "rgba(143, 139, 255, 0.35)",
  onClick,
  actionLabel = "Select card",
  enableTilt = false,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, opacity: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y, opacity: 1 });

    if (enableTilt && !reduceMotion) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const tiltX = ((y - centerY) / centerY) * -4;
      const tiltY = ((x - centerX) / centerX) * 4;
      setTilt({ x: tiltX, y: tiltY });
    }
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, opacity: 0 }));
    if (enableTilt) {
      setTilt({ x: 0, y: 0 });
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={
        enableTilt && !reduceMotion
          ? {
            rotateX: tilt.x,
            rotateY: tilt.y,
            transformPerspective: 1000,
          }
          : undefined
      }
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`group relative overflow-hidden rounded-[22px] border border-[var(--hairline)] bg-surface p-6 sm:p-7 transition-all duration-300 hover:border-[var(--hairline-strong)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] ${className}`}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {/* Mouse Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          opacity: mousePos.opacity,
          background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 65%)`,
        }}
        aria-hidden="true"
      />

      {/* Mouse Spotlight Border Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          opacity: mousePos.opacity,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, ${borderColor}, transparent 60%)`,
          maskImage: "linear-gradient(black, black), linear-gradient(black, black)",
          WebkitMaskImage: "linear-gradient(black, black), linear-gradient(black, black)",
          maskClip: "content-box, border-box",
          WebkitMaskClip: "content-box, border-box",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
        aria-hidden="true"
      />

      {onClick && (
        <button
          type="button"
          onClick={onClick}
          aria-label={actionLabel}
          className="absolute inset-0 z-0 rounded-[22px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        />
      )}

      {/* Card Content */}
      <div
        className={`relative z-10 h-full ${onClick
            ? "pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto [&_textarea]:pointer-events-auto [&_[role=button]]:pointer-events-auto"
            : ""
          }`}
      >
        {children}
      </div>
    </motion.div>
  );
}
