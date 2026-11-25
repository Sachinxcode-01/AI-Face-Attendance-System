"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  scale?: number;
  blur?: boolean;
};

/**
 * Modern In-View Reveal Animation using Framer Motion.
 * Triggers smoothly as elements scroll into viewport.
 * Honors prefers-reduced-motion.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  duration = 0.65,
  direction = "up",
  distance = 28,
  scale = 1,
  blur = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [isFocused, setIsFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      case "none":
      default:
        return { x: 0, y: 0 };
    }
  };

  const initialPos = getInitialPosition();

  return (
    <motion.div
      ref={ref}
      onFocusCapture={() => setIsFocused(true)}
      initial={{
        opacity: 0,
        ...initialPos,
        scale: scale !== 1 ? scale : 0.98,
        filter: blur ? "blur(4px)" : "blur(0px)",
      }}
      animate={
        isInView || isFocused
      ? {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      }
      : {}
      }
transition = {{
    duration: isFocused && !isInView ? 0 : duration,
      delay: isFocused && !isInView ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
className = { className }
  >
  { children }
    </motion.div >
  );
}

/**
 * Stagger container for animating lists of items sequentially as they scroll into view.
 */
export function RevealStagger({
  children,
  className = "",
  stagger = 0.08,
  delayChildren = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [isFocused, setIsFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      onFocusCapture={() => setIsFocused(true)}
      variants={containerVariants}
      initial="hidden"
      animate={isInView || isFocused ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className = "",
  direction = "up",
  distance = 24,
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const getInitial = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      case "none":
      default:
        return { x: 0, y: 0 };
    }
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      ...getInitial(),
      scale: 0.98,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
