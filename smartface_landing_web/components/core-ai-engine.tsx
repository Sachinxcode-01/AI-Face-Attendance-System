'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Brain, Cpu, Zap, MessageSquare, ArrowRight } from 'lucide-react';

function BrainParticles({ count = 350 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Generate brain-shaped coordinates procedurally
  const { positions, originalPositions } = useMemo(() => {
    const posArr = new Float32Array(count * 3);
    const origArr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Lobe configuration (left vs right hemisphere)
      const isLeft = Math.random() > 0.5;
      const hemisphereOffset = isLeft ? -0.4 : 0.4;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Radius with natural brain-lobe surface wrinkles using trigonometric distortions
      const r = 1.0 + Math.random() * 0.3 + Math.sin(theta * 5) * Math.cos(phi * 4) * 0.12;
      
      const x = hemisphereOffset + r * Math.sin(phi) * Math.cos(theta) * 0.75;
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.65;
      const z = r * Math.cos(phi) * 0.85;

      posArr[i * 3] = x;
      posArr[i * 3 + 1] = y;
      posArr[i * 3 + 2] = z;

      origArr[i * 3] = x;
      origArr[i * 3 + 1] = y;
      origArr[i * 3 + 2] = z;
    }
    return { positions: posArr, originalPositions: origArr };
  }, [count]);

  const linePositions = useMemo(() => new Float32Array(count * 6 * 3), [count]);
  const maxLines = count * 6;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Pulse the brain particles using sine waves to simulate electrical synaptic triggers
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const px = originalPositions[idx];
      const py = originalPositions[idx + 1];
      const pz = originalPositions[idx + 2];

      // Oscillating breath effect
      const breath = 1.0 + Math.sin(time * 2.5 + px * 2) * 0.04;
      positions[idx] = px * breath + Math.sin(time * 8 + idx) * 0.006;
      positions[idx + 1] = py * breath + Math.cos(time * 8 + idx) * 0.006;
      positions[idx + 2] = pz * breath + Math.sin(time * 8 + idx) * 0.006;
    }

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Connect close synaptic points dynamically
    let lineIdx = 0;
    const maxConnectionDist = 0.65;

    for (let i = 0; i < count; i++) {
      const ix = positions[i * 3];
      const iy = positions[i * 3 + 1];
      const iz = positions[i * 3 + 2];

      for (let j = i + 1; j < count; j++) {
        if (lineIdx >= maxLines - 2) break;

        const jx = positions[j * 3];
        const jy = positions[j * 3 + 1];
        const jz = positions[j * 3 + 2];

        // Euclidean distance
        const dx = ix - jx;
        const dy = iy - jy;
        const dz = iz - jz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxConnectionDist) {
          linePositions[lineIdx * 3] = ix;
          linePositions[lineIdx * 3 + 1] = iy;
          linePositions[lineIdx * 3 + 2] = iz;

          linePositions[(lineIdx + 1) * 3] = jx;
          linePositions[(lineIdx + 1) * 3 + 1] = jy;
          linePositions[(lineIdx + 1) * 3 + 2] = jz;

          lineIdx += 2;
        }
      }
    }

    // Reset remaining buffer coordinates
    for (let i = lineIdx; i < maxLines; i++) {
      linePositions[i * 3] = 0;
      linePositions[i * 3 + 1] = 0;
      linePositions[i * 3 + 2] = 0;
    }

    if (linesRef.current) {
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Synaptic Connections (Neural network lines) */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#8B5CF6"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Synaptic nodes */}
      <Points ref={pointsRef} positions={positions} stride={3}>
        <PointMaterial
          transparent
          color="#a78bfa"
          size={0.065}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
        />
      </Points> group
    </group>
  );
}

function BrainScene() {
  const brainGroup = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (brainGroup.current) {
      brainGroup.current.rotation.y = time * 0.15;
      brainGroup.current.rotation.x = Math.sin(time * 0.3) * 0.1;
    }
  });

  return (
    <group ref={brainGroup}>
      <BrainParticles count={320} />
      
      {/* Core glowing nucleus */}
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.3} />
      </mesh>
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color="#3B82F6" wireframe transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

export default function CoreAiEngine() {
  const [activeNode, setActiveNode] = useState<string>('arcface');

  const nodesInfo = {
    arcface: {
      title: "ArcFace AI Engine",
      desc: "Deep-insight face recognition mapping 512-dimensional vector spaces. Implemented on high-accuracy ONNX model pipelines.",
      metric: "99.94% Recognition Accuracy"
    },
    onnx: {
      title: "ONNX Runtime Integration",
      desc: "Cross-platform model optimization providing sub-second inference speeds. Native execution leverages backend system hardware acceleration.",
      metric: "< 280ms Match Latency"
    },
    matching: {
      title: "Cosine Similarity Matching",
      desc: "Calculates similarity score ratios between face embeddings in MongoDB. Filters out low confidence or spoofing attempts automatically.",
      metric: "0.0% False Positive Rate"
    },
    voice: {
      title: "AI Voice Greeting Agent",
      desc: "Text-to-speech synthesis modules that greet authorized students by name during check-ins, adding premium interactive feedback loops.",
      metric: "TTS Instant Audio Feedback"
    }
  };

  return (
    <section className="w-full max-w-7xl px-6 md:px-8 py-24 mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      
      {/* Left side: Information panel */}
      <div className="lg:col-span-6 space-y-8">
        <div className="space-y-2">
          <span className="text-[10px] tracking-[0.3em] font-mono text-purple-400 uppercase block font-bold">
            NEURAL RECOGNITION CORE
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
            Core AI Engine
          </h2>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
            Our biometric architecture runs optimized deep learning pipelines directly on the server to authenticate identity, enforce anti-proxy rules, and secure classrooms.
          </p>
        </div>

        {/* Dynamic selector list */}
        <div className="space-y-4">
          {[
            { id: 'arcface', title: 'ArcFace AI', icon: Brain },
            { id: 'onnx', title: 'ONNX Runtime', icon: Cpu },
            { id: 'matching', title: 'Face Matching', icon: Zap },
            { id: 'voice', title: 'AI Voice Assistant', icon: MessageSquare }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeNode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNode(item.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-300 font-sans ${
                  isSelected 
                    ? 'bg-purple-500/10 border-purple-500/30 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    isSelected ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-slate-900 border-white/5 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{item.title}</h4>
                    <p className="text-[10px] text-slate-505 mt-0.5 max-w-sm truncate md:max-w-none">
                      {nodesInfo[item.id as keyof typeof nodesInfo].title} Overview
                    </p>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'translate-x-1 text-purple-400' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Right side: 3D Brain model visualization & details */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-6">
        
        {/* Holographic Brain Canvas container */}
        <div className="w-[300px] h-[300px] md:w-[420px] md:h-[420px] relative rounded-3xl bg-slate-950/60 border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl">
          {/* Neon Purple spotlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
          
          <Canvas
            camera={{ position: [0, 0, 2.5], fov: 50 }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[5, 5, 5]} intensity={1.5} color="#8B5CF6" />
            <pointLight position={[-5, -5, -5]} intensity={0.5} color="#3B82F6" />
            
            <BrainScene />
            
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>

        {/* Selected info card */}
        <div className="w-full max-w-[420px] p-5 bg-slate-900/50 border border-white/5 rounded-3xl space-y-3 font-sans text-xs">
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <span className="font-bold text-white font-mono uppercase tracking-wider text-[10px]">
              {nodesInfo[activeNode as keyof typeof nodesInfo].title}
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-mono">
              {nodesInfo[activeNode as keyof typeof nodesInfo].metric}
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed font-sans">
            {nodesInfo[activeNode as keyof typeof nodesInfo].desc}
          </p>
        </div>
      </div>

    </section>
  );
}
