'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface MetricItem {
  value: number;
  decimals: number;
  suffix: string;
  prefix: string;
  label: string;
  desc: string;
}

function AnimatedCounter({ item }: { item: MetricItem }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    const start = 0;
    const end = item.value;
    const duration = 2000; // 2 seconds counting animation
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing out quadratic
      const easeProgress = progress * (2 - progress);
      const current = easeProgress * (end - start) + start;
      
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, item.value]);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl glass-panel glass-panel-hover text-center relative overflow-hidden group">
      {/* Background card highlight line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-right from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <span className="text-[10px] tracking-[0.25em] font-mono text-slate-500 uppercase mb-2">
        {item.label}
      </span>
      <div className="text-3xl md:text-5xl font-black font-mono text-white mb-2 flex items-center justify-center tracking-tight">
        <span className="text-primary font-light mr-0.5">{item.prefix}</span>
        <span>
          {count.toFixed(item.decimals)}
        </span>
        <span className="text-primary ml-0.5">{item.suffix}</span>
      </div>
      <p className="text-xs md:text-sm text-slate-400 font-sans max-w-[200px]">
        {item.desc}
      </p>
    </div>
  );
}

export default function Metrics() {
  const metricsData: MetricItem[] = [
    {
      value: 99.94,
      decimals: 2,
      prefix: '',
      suffix: '%',
      label: 'Recognition Rate',
      desc: 'Tested on Labeled Faces in the Wild (LFW) dataset.'
    },
    {
      value: 280,
      decimals: 0,
      prefix: '< ',
      suffix: 'ms',
      label: 'Match Speed',
      desc: 'Sub-second matching powered by ArcFace ONNX backend.'
    },
    {
      value: 250,
      decimals: 0,
      prefix: '',
      suffix: 'k+',
      label: 'Daily Check-ins',
      desc: 'Scalable data streams logging attendance seamlessly.'
    },
    {
      value: 0.0,
      decimals: 1,
      prefix: '',
      suffix: '%',
      label: 'Proxy Margin',
      desc: 'Active rotating QR and biometric check-ins prevent cheating.'
    }
  ];

  return (
    <section className="w-full max-w-7xl px-6 md:px-8 py-16 md:py-24 mx-auto relative z-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metricsData.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
          >
            <AnimatedCounter item={item} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
