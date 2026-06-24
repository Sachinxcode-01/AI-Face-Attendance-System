'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Re-mounts on every dashboard route change, giving each page a
// smooth, consistent entrance transition.
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
