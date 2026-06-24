'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { 
  QrCode, 
  User, 
  Flame, 
  Bell, 
  Check,
  Activity
} from 'lucide-react';
import CanvasContainer from './canvas-container';

function Smartphone({ scrollYPercent }: { scrollYPercent: number }) {
  const phoneRef = useRef<THREE.Group>(null);
  const scanLineRef = useRef<THREE.Mesh>(null);
  
  // Biometric scanner state loops
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');

  // Biometric scanner loop simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanState('scanning');
      
      // Scanning duration
      setTimeout(() => {
        setScanState('success');
        
        // Return to idle after confirmation
        setTimeout(() => {
          setScanState('idle');
        }, 1500);
      }, 2000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (phoneRef.current) {
      // Smoothly interpolate rotation based on scroll position
      // At scrollPercent = 0, rotation is 0
      // Rotate up to 1.5 rotations as page is scrolled
      const targetRotY = scrollYPercent * Math.PI * 1.5;
      phoneRef.current.rotation.y = THREE.MathUtils.lerp(phoneRef.current.rotation.y, targetRotY, 0.1);
      
      // Floating breath rotation & position
      phoneRef.current.rotation.x = THREE.MathUtils.lerp(phoneRef.current.rotation.x, Math.sin(time * 1.2) * 0.08, 0.1);
      phoneRef.current.position.y = Math.sin(time * 1.5) * 0.08;
    }

    // Laser sweep scanline mesh
    if (scanLineRef.current) {
      if (scanState === 'scanning') {
        scanLineRef.current.visible = true;
        scanLineRef.current.position.y = Math.sin(time * 4) * 0.8;
      } else {
        scanLineRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={phoneRef}>
      {/* 3D Phone Chassis Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.7, 3.4, 0.1]} />
        <meshStandardMaterial 
          color="#0b0f19" 
          metalness={0.9} 
          roughness={0.15} 
        />
      </mesh>

      {/* Screen Glass Bezel overlay */}
      <mesh position={[0, 0, 0.051]}>
        <boxGeometry args={[1.62, 3.32, 0.005]} />
        <meshStandardMaterial 
          color="#020617" 
          metalness={0.95} 
          roughness={0.05} 
        />
      </mesh>

      {/* Camera / Speaker Island Notch */}
      <mesh position={[0, 1.55, 0.055]}>
        <boxGeometry args={[0.42, 0.08, 0.005]} />
        <meshStandardMaterial color="#000000" roughness={0.8} />
      </mesh>

      {/* 3D Laser Scanning bar (physically placed in front of screen during scanning) */}
      <mesh ref={scanLineRef} position={[0, 0, 0.057]}>
        <planeGeometry args={[1.5, 0.03]} />
        <meshBasicMaterial 
          color="#10b981" 
          transparent 
          opacity={0.8} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Interactive Screen HTML Overlay via transform */}
      <Html
        transform
        distanceFactor={1.9}
        position={[0, 0, 0.056]}
        scale={0.48}
        occlude
      >
        <div className="w-[340px] h-[680px] bg-slate-950 text-white rounded-[45px] overflow-hidden flex flex-col p-5 space-y-4 font-sans select-none border-2 border-slate-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative">
          
          {/* Top Speaker/Notch Overlay placeholder */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110px] h-[22px] bg-black rounded-full z-50 flex items-center justify-center">
            {/* Camera Lens Dot */}
            <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800 ml-auto mr-4" />
          </div>

          {/* Status Bar */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1 z-40">
            <span className="font-bold pl-2">9:41 AM</span>
            <div className="flex items-center gap-2 pr-2">
              <Activity className="w-3 h-3 text-primary animate-pulse" />
              <span>5G</span>
              <div className="w-6 h-3 border border-slate-600 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-full bg-emerald-500 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* App Header */}
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-[10px] font-black text-white">SF</div>
              <span className="text-xs font-black tracking-widest uppercase text-white font-mono">SmartFace App</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          {/* Core UI Screen: Scan & Stats */}
          <div className="flex-1 flex flex-col justify-between space-y-3 overflow-hidden">
            
            {/* Dynamic Camera scanning section */}
            <div className="flex-1 rounded-[25px] bg-slate-900/60 border border-white/5 p-4 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none" />
              
              {/* Scan grid effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              {scanState === 'scanning' ? (
                <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
                  {/* Biometric reticle */}
                  <div className="relative w-36 h-36 border-2 border-dashed border-primary/45 rounded-full flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
                    <User className="w-16 h-16 text-primary" />
                    
                    {/* Rotating tracking ticks */}
                    <div className="absolute -inset-1.5 border border-primary/30 rounded-full border-t-transparent border-b-transparent animate-spin-slow" />
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-primary animate-pulse uppercase">BIOMETRIC LIVENESS TEST</span>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">ONNX model running inference...</p>
                  </div>
                </div>
              ) : scanState === 'success' ? (
                <div className="flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-scale-up">
                    <Check className="w-10 h-10 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-400 tracking-wider uppercase block font-mono">MATCH CONFIRMED</span>
                    <span className="text-[9px] font-mono text-slate-400 block mt-1">99.82% Confidence Ratio</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-mono uppercase font-bold tracking-widest mt-1">
                    Attendance Logged
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                  {/* QR scanning zone placeholder */}
                  <div className="w-32 h-32 border border-white/10 rounded-2xl flex items-center justify-center bg-slate-950/80 relative">
                    <QrCode className="w-16 h-16 text-slate-500" />
                    <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-primary/60" />
                    <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-primary/60" />
                    <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-primary/60" />
                    <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-primary/60" />
                  </div>
                  <div className="text-center space-y-0.5">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">AWAITING QR SIGNAL</span>
                    <p className="text-[8px] text-slate-500 max-w-[160px] leading-normal font-sans">Align the generated classroom QR with the scanner frame.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance metrics */}
            <div className="grid grid-cols-2 gap-2 text-center shrink-0">
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                <span className="text-[8px] text-slate-500 font-mono tracking-widest block uppercase font-bold">Attendance</span>
                <span className="text-sm font-black text-emerald-400 font-mono block mt-0.5">94.8%</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
                <div className="text-left">
                  <span className="text-[8px] text-slate-500 font-mono tracking-widest block uppercase font-bold">STREAK</span>
                  <span className="text-xs font-black text-white font-mono">14 Days</span>
                </div>
              </div>
            </div>

            {/* Streak Calendar mini widget */}
            <div className="p-3 bg-slate-900/40 border border-white/5 rounded-[22px] shrink-0">
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mb-2 font-bold">
                <span className="uppercase tracking-wider">Attendance Calendar</span>
                <span className="text-emerald-400">June 2026</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-mono">
                {['M','T','W','T','F','S','S'].map((day, i) => (
                  <span key={i} className="text-slate-600 font-bold">{day}</span>
                ))}
                {Array.from({ length: 14 }).map((_, i) => {
                  const isPresent = i < 12;
                  const isAbsent = i === 12;
                  const isPending = i === 13;
                  let bg = 'bg-white/5 text-slate-400';
                  if (isPresent) bg = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                  if (isAbsent) bg = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
                  if (isPending) bg = 'bg-yellow-500/20 text-yellow-450 border border-yellow-500/30';
                  
                  return (
                    <span 
                      key={i} 
                      className={`h-5 rounded-md flex items-center justify-center font-bold ${bg}`}
                    >
                      {10 + i}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Notification popup alert */}
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center gap-2 text-[8px] font-mono leading-relaxed shrink-0">
              <Bell className="w-3.5 h-3.5 shrink-0 text-primary animate-swing" />
              <div className="truncate">
                <strong>LEAVE APPROVED:</strong> CS-402 Algorithms (June 21) marked as Approved.
              </div>
            </div>

          </div>

          {/* Bottom Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-700 rounded-full" />
        </div>
      </Html>
    </group>
  );
}

export default function MobilePhoneCanvas() {
  const [scrollYPercent, setScrollYPercent] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      // Calculate scroll fraction relative to page height
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollYPercent(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run initial trigger
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full h-full min-h-[450px] md:min-h-[550px] cursor-grab relative">
      <CanvasContainer className="w-full h-full">
        <Canvas
          shadows
          camera={{ position: [0, 0, 4.2], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={0.7} />
          <pointLight position={[5, 10, 5]} intensity={1.5} color="#8B5CF6" />
          <pointLight position={[-5, -10, -5]} intensity={0.6} color="#2563EB" />
          <spotLight position={[0, 8, 2]} intensity={1.2} color="#ffffff" />
          
          <Smartphone scrollYPercent={scrollYPercent} />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 1.8} 
            minPolarAngle={Math.PI / 2.2} 
          />
        </Canvas>
      </CanvasContainer>
    </div>
  );
}
