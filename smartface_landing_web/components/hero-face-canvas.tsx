'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import CanvasContainer from './canvas-container';

function FaceMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const scanLineRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const [scanStatus, setScanStatus] = useState('ANALYZING...');
  const [matchPercent, setMatchPercent] = useState(0);

  // Simulation loop for scanner feedback text
  useEffect(() => {
    const statusPool = ['COMPILING MESH...', 'ISOLATING FEATURE VECTORS...', 'IRIS LOCK OK', 'ANTI-PROXY CHECK...', 'MATCH CONFIRMED'];
    let idx = 0;
    const interval = setInterval(() => {
      setScanStatus(statusPool[idx]);
      idx = (idx + 1) % statusPool.length;
      if (idx === 4) {
        setMatchPercent(99.0 + Math.random() * 0.9);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const { positions, indices } = useMemo(() => {
    const pos = [];
    const ind = [];
    const rows = 28;
    const cols = 28;

    for (let r = 0; r < rows; r++) {
      const theta = (r / (rows - 1)) * Math.PI - Math.PI / 2; // -pi/2 to pi/2 (vertical angle)
      for (let c = 0; c < cols; c++) {
        const phi = (c / (cols - 1)) * Math.PI - Math.PI / 2; // -pi/2 to pi/2 (horizontal angle, front hemisphere)
        
        let radius = 1.1;
        
        // Displace sphere to shape a human face contour
        // Nose bridge
        const noseDist = Math.sqrt(phi * phi + (theta - 0.1) * (theta - 0.1));
        if (noseDist < 0.35) {
          radius += (0.35 - noseDist) * 0.45;
        }
        
        // Eye sockets
        const leftEyeDist = Math.sqrt((phi + 0.3) * (phi + 0.3) + (theta - 0.22) * (theta - 0.22));
        const rightEyeDist = Math.sqrt((phi - 0.3) * (phi - 0.3) + (theta - 0.22) * (theta - 0.22));
        if (leftEyeDist < 0.2) radius -= (0.2 - leftEyeDist) * 0.22;
        if (rightEyeDist < 0.2) radius -= (0.2 - rightEyeDist) * 0.22;
        
        // Cheeks
        const leftCheek = Math.sqrt((phi + 0.45) * (phi + 0.45) + (theta + 0.05) * (theta + 0.05));
        const rightCheek = Math.sqrt((phi - 0.45) * (phi - 0.45) + (theta + 0.05) * (theta + 0.05));
        if (leftCheek < 0.3) radius += (0.3 - leftCheek) * 0.12;
        if (rightCheek < 0.3) radius += (0.3 - rightCheek) * 0.12;
        
        // Mouth opening
        const mouthDist = Math.sqrt(phi * phi + (theta + 0.3) * (theta + 0.3));
        if (mouthDist < 0.15) radius -= (0.15 - mouthDist) * 0.1;
        
        // Chin bump
        const chinDist = Math.sqrt(phi * phi + (theta + 0.6) * (theta + 0.6));
        if (chinDist < 0.25) radius += (0.25 - chinDist) * 0.18;

        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta);
        const z = radius * Math.cos(theta) * Math.cos(phi);
        
        pos.push(x, y, z);
      }
    }

    // Build indices for wireframe grid mesh
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const i0 = r * cols + c;
        const i1 = r * cols + (c + 1);
        const i2 = (r + 1) * cols + c;
        const i3 = (r + 1) * cols + (c + 1);

        // Triangle 1
        ind.push(i0, i1, i2);
        // Triangle 2
        ind.push(i1, i3, i2);
      }
    }

    return { 
      positions: new Float32Array(pos), 
      indices: ind 
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Slow breathing yaw rotation
      groupRef.current.rotation.y = Math.sin(time * 0.45) * 0.25;
      groupRef.current.rotation.x = Math.cos(time * 0.3) * 0.08;
    }

    // Sweeping laser scanning beam
    if (scanLineRef.current) {
      scanLineRef.current.position.y = Math.sin(time * 1.8) * 1.35;
    }

    // Biometric Target Ring
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.4;
      // Slight scale pulse
      const ringScale = 1.8 + Math.sin(time * 3) * 0.05;
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D Wireframe Face Geometry */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="index"
            args={[new Uint16Array(indices), 1]}
          />
        </bufferGeometry>
        <meshBasicMaterial
          color="#2563eb"
          wireframe
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3D Dot Particles on the face vertices */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#3b82f6"
          size={0.035}
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>

      {/* Sweeping Laser Plane */}
      <mesh ref={scanLineRef} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshBasicMaterial
          color="#10b981"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Sweeping Laser Edge Indicator */}
      <mesh ref={scanLineRef}>
        <boxGeometry args={[2.5, 0.02, 2.5]} />
        <meshBasicMaterial
          color="#10b981"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Biometric Target Tracker Ring */}
      <mesh ref={ringRef} position={[0, 0.1, 0]}>
        <torusGeometry args={[0.9, 0.015, 6, 64]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Target points of recognition (Eyes, Nose, Chin) */}
      {[
        { pos: [-0.3, 0.22, 0.95], label: 'Left Iris' },
        { pos: [0.3, 0.22, 0.95], label: 'Right Iris' },
        { pos: [0, 0.1, 1.25], label: 'Nose Tip' },
        { pos: [0, -0.6, 1.05], label: 'Mentalis' },
        { pos: [-0.48, -0.1, 0.95], label: 'Left Cheek' },
        { pos: [0.48, -0.1, 0.95], label: 'Right Cheek' }
      ].map((pt, idx) => (
        <group key={idx} position={pt.pos as [number, number, number]}>
          <mesh>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh scale={[1.8, 1.8, 1.8]}>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.3} wireframe />
          </mesh>
        </group>
      ))}

      {/* Glowing HUD HTML Annotations */}
      <Html position={[0.7, 0.4, 0.8]} distanceFactor={4} center>
        <div className="px-2.5 py-1 rounded bg-slate-950/80 border border-purple-500/30 font-mono text-[8px] text-purple-400 whitespace-nowrap backdrop-blur-sm shadow-[0_0_10px_rgba(139,92,246,0.2)]">
          [IRIS SCAN: ACTIVE]
        </div>
      </Html>

      <Html position={[-0.8, -0.5, 0.8]} distanceFactor={4} center>
        <div className="px-2.5 py-1 rounded bg-slate-950/80 border border-emerald-500/30 font-mono text-[8px] text-emerald-400 whitespace-nowrap backdrop-blur-sm shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          [MESH: VERIFIED]
        </div>
      </Html>

      <Html position={[-0.9, 0.1, 0.8]} distanceFactor={4} center>
        <div className="p-3 rounded-2xl bg-slate-950/90 border border-white/5 font-mono text-[8px] space-y-1 text-slate-400 whitespace-nowrap backdrop-blur-sm min-w-[120px]">
          <div className="text-white font-bold border-b border-white/5 pb-1 flex justify-between">
            <span>SYS STATUS</span>
            <span className="text-emerald-400 animate-pulse">● LIVE</span>
          </div>
          <div>SCAN: <span className="text-purple-400 font-bold">{scanStatus}</span></div>
          {matchPercent > 0 && (
            <div className="text-emerald-400 font-bold">MATCH: {matchPercent.toFixed(2)}%</div>
          )}
        </div>
      </Html>
    </group>
  );
}

export default function HeroFaceCanvas() {
  return (
    <div className="w-full h-full min-h-[350px] md:min-h-[450px] relative">
      {/* Decorative neon ambient mesh behind head */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
      
      <CanvasContainer className="w-full h-full">
        <Canvas
          camera={{ position: [0, 0, 3.2], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={1.2} color="#3b82f6" />
          <pointLight position={[-5, -5, -5]} intensity={0.4} color="#8b5cf6" />
          
          <FaceMesh />
          
          <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 2.2} />
        </Canvas>
      </CanvasContainer>
    </div>
  );
}
