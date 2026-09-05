'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import confetti from 'canvas-confetti';

// Generate dynamic cyber QR code texture in memory
function useQrTexture() {
  return useMemo(() => {
    if (typeof window === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill backdrop
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Draw high-tech grid background
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512);
      ctx.moveTo(0, i); ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Helper to draw QR finder pattern
    const drawFinder = (x: number, y: number) => {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 14;
      ctx.strokeRect(x + 7, y + 7, 98, 98);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(x + 35, y + 35, 42, 42);
    };

    // Draw three finder patterns
    drawFinder(20, 20); // Top-left
    drawFinder(380, 20); // Top-right
    drawFinder(20, 380); // Bottom-left

    // Draw alignment pattern bottom-right
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 8;
    ctx.strokeRect(390, 390, 42, 42);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(406, 406, 10, 10);

    // Draw randomized fake cyber QR bits
    ctx.fillStyle = '#3b82f6';
    for (let x = 18; x < 500; x += 18) {
      for (let y = 18; y < 500; y += 18) {
        // Skip finder areas
        if (x < 150 && y < 150) continue;
        if (x > 340 && y < 150) continue;
        if (x < 150 && y > 340) continue;

        if (Math.random() > 0.45) {
          // Add cyan/electric bits
          ctx.fillStyle = Math.random() > 0.85 ? '#10b981' : '#3b82f6';
          ctx.fillRect(x, y, 14, 14);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

function InteractiveCube({ onCheckIn }: { onCheckIn: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const outlineRef = useRef<THREE.Mesh>(null);
  const scanLineRef = useRef<THREE.Mesh>(null);
  const qrMap = useQrTexture();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Constant slow rotation
    if (meshRef.current) {
      const rotY = hovered ? time * 0.6 : time * 0.25;
      const rotX = hovered ? time * 0.3 : time * 0.15;
      meshRef.current.rotation.y = rotY;
      meshRef.current.rotation.x = rotX;
      if (outlineRef.current) {
        outlineRef.current.rotation.y = rotY;
        outlineRef.current.rotation.x = rotX;
      }
    }

    // Sweeping laser scanplane
    if (scanLineRef.current) {
      scanLineRef.current.position.y = Math.sin(time * 2.2) * 1.3;
    }
  });

  return (
    <group>
      {/* Laser Scanning Plane */}
      <mesh ref={scanLineRef} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial
          color="#10b981"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Main QR Cube */}
      <mesh
        ref={meshRef}
        onClick={onCheckIn}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2, 2, 2]} />
        {qrMap ? (
          <meshStandardMaterial
            map={qrMap}
            roughness={0.1}
            metalness={0.9}
            bumpScale={0.05}
          />
        ) : (
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        )}
      </mesh>

      {/* Holographic Cube Outer Frame */}
      <mesh ref={outlineRef} scale={[1.05, 1.05, 1.05]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial
          color={hovered ? '#10b981' : '#3b82f6'}
          wireframe
          transparent
          opacity={hovered ? 0.35 : 0.15}
        />
      </mesh>
    </group>
  );
}

export default function QrCube() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [statusText, setStatusText] = useState('TAP CUBE TO SCAN & REGISTER');

  const handleCheckIn = () => {
    if (checkedIn) return;
    setCheckedIn(true);
    setStatusText('VERIFYING BIOMETRICS...');

    // Simulate database update OTP & WebSocket event
    setTimeout(() => {
      setStatusText('ACCESS GRANTED • DEAN NOTIFIED');
      
      // Fire confetti from bottom left/right
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#10B981', '#3B82F6'],
      });
    }, 1200);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 glass-panel rounded-2xl glow-border">
      {/* Verification status header */}
      <div className="text-center mb-6">
        <span className="text-[10px] tracking-[0.3em] font-mono text-slate-500 uppercase block mb-1">
          SmartFace Anti-Proxy Verification
        </span>
        <h4 className="text-lg font-bold font-mono tracking-wider text-white">
          {statusText}
        </h4>
        {checkedIn && (
          <span className="text-xs text-emerald-400 font-mono block mt-2 animate-pulse">
            ● Live Check-in Logged (Google Sheets Synced)
          </span>
        )}
      </div>

      {/* Cube Canvas */}
      <div className="w-[280px] h-[280px] md:w-[350px] md:h-[350px] cursor-pointer relative">
        {checkedIn && (
          <div className="absolute inset-0 border border-emerald-500/20 bg-emerald-500/5 rounded-xl pointer-events-none z-10 animate-pulse" />
        )}
        <Canvas
          shadows
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#3b82f6" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#10b981" />
          <spotLight position={[0, 5, 0]} intensity={1.5} color="#ffffff" />
          
          <InteractiveCube onCheckIn={handleCheckIn} />
          
          <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.8} />
        </Canvas>
      </div>

      <div className="mt-4 text-center text-xs text-slate-400 font-mono max-w-md">
        {!checkedIn ? (
          <span>Drag the cube to rotate the 3D rotating QR code. Clicking matches token with server clock drift (+/- 30s).</span>
        ) : (
          <button
            onClick={() => {
              setCheckedIn(false);
              setStatusText('TAP CUBE TO SCAN & REGISTER');
            }}
            className="px-4 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono transition"
          >
            Reset Scanner Demo
          </button>
        )}
      </div>
    </div>
  );
}
