'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Code, 
  Zap, 
  Smartphone, 
  Database, 
  UserCheck, 
  Cpu, 
  Sparkles, 
  Network 
} from 'lucide-react';
import CanvasContainer from './canvas-container';

function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return pts;
  }, [radius]);

  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const material = useMemo(() => new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.06 }), []);
  const lineLoopObj = useMemo(() => new THREE.LineLoop(lineGeometry, material), [lineGeometry, material]);

  return <primitive object={lineLoopObj} />;
}

function OrbitingNode({
  radius,
  speed,
  angleOffset,
  name,
  icon: Icon,
  color,
  glowColor,
  hoveredNode,
  setHoveredNode
}: {
  radius: number;
  speed: number;
  angleOffset: number;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glowColor: string;
  hoveredNode: string | null;
  setHoveredNode: (name: string | null) => void;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Slow down all orbits if any node is hovered, stop this node entirely if hovered
    const isThisNodeHovered = hoveredNode === name;
    let actualSpeed = speed;
    if (hoveredNode) {
      actualSpeed = isThisNodeHovered ? 0 : speed * 0.15;
    }
    const angle = time * actualSpeed + angleOffset;
    
    if (ref.current) {
      ref.current.position.x = radius * Math.cos(angle);
      ref.current.position.z = radius * Math.sin(angle);
      // Subtle floating amplitude
      ref.current.position.y = Math.sin(time * 2 + angleOffset) * 0.1;
    }
  });

  const isHovered = hoveredNode === name;

  return (
    <group ref={ref}>
      <Html distanceFactor={6} center>
        <div
          onPointerOver={() => setHoveredNode(name)}
          onPointerOut={() => setHoveredNode(null)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-slate-950/90 backdrop-blur-md cursor-pointer select-none transition-all duration-300 font-sans text-[10px] ${
            isHovered 
              ? 'scale-115 text-white border-white/40' 
              : 'border-white/10 text-slate-300 hover:border-white/20'
          }`}
          style={{
            boxShadow: isHovered ? `0 0 15px ${glowColor}` : 'none',
          }}
        >
          <div 
            className="p-1 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}15`, color: color }}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-wide uppercase text-[9px]">{name}</span>
        </div>
      </Html>
    </group>
  );
}

function CentralCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.4;
      const scale = 1.0 + Math.sin(time * 2.5) * 0.04;
      coreRef.current.scale.set(scale, scale, scale);
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.x = time * 0.35;
      ringRef1.current.rotation.y = time * 0.15;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.y = -time * 0.4;
      ringRef2.current.rotation.z = time * 0.2;
    }
  });

  return (
    <group>
      {/* Outer neon shell */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.2} />
      </mesh>
      
      {/* Inner physical sphere */}
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#2563EB" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Orbiting wireframe ring 1 */}
      <mesh ref={ringRef1}>
        <torusGeometry args={[0.7, 0.015, 8, 48]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.35} />
      </mesh>

      {/* Orbiting wireframe ring 2 */}
      <mesh ref={ringRef2}>
        <torusGeometry args={[0.85, 0.01, 8, 48]} />
        <meshBasicMaterial color="#2563EB" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function Scene({ hoveredNode, setHoveredNode }: { hoveredNode: string | null, setHoveredNode: (name: string | null) => void }) {
  // Define tech stack items with orbits
  const techStack = [
    // Orbit 1: Inner (radius: 1.6)
    { name: 'Python', icon: Code, color: '#3b82f6', glowColor: 'rgba(59,130,246,0.3)', radius: 1.6, speed: 0.45, angleOffset: 0 },
    { name: 'FastAPI', icon: Zap, color: '#10b981', glowColor: 'rgba(16,185,129,0.3)', radius: 1.6, speed: 0.45, angleOffset: Math.PI },
    
    // Orbit 2: Middle (radius: 2.5)
    { name: 'Flutter', icon: Smartphone, color: '#06b6d4', glowColor: 'rgba(6,182,212,0.3)', radius: 2.5, speed: 0.3, angleOffset: 0 },
    { name: 'MongoDB', icon: Database, color: '#10b981', glowColor: 'rgba(16,185,129,0.3)', radius: 2.5, speed: 0.3, angleOffset: Math.PI * 0.67 },
    { name: 'ArcFace', icon: UserCheck, color: '#a855f7', glowColor: 'rgba(168,85,247,0.3)', radius: 2.5, speed: 0.3, angleOffset: Math.PI * 1.33 },
    
    // Orbit 3: Outer (radius: 3.4)
    { name: 'Groq AI', icon: Cpu, color: '#f97316', glowColor: 'rgba(249,115,22,0.3)', radius: 3.4, speed: 0.2, angleOffset: 0 },
    { name: 'Gemini AI', icon: Sparkles, color: '#ec4899', glowColor: 'rgba(236,72,153,0.3)', radius: 3.4, speed: 0.2, angleOffset: Math.PI * 0.67 },
    { name: 'WebSockets', icon: Network, color: '#6366f1', glowColor: 'rgba(99,102,241,0.3)', radius: 3.4, speed: 0.2, angleOffset: Math.PI * 1.33 }
  ];

  return (
    <group rotation={[Math.PI / 8, 0, 0]}>
      <CentralCore />
      
      {/* Concentric orbit tracks */}
      <OrbitRing radius={1.6} />
      <OrbitRing radius={2.5} />
      <OrbitRing radius={3.4} />

      {/* Orbiting nodes */}
      {techStack.map((node) => (
        <OrbitingNode 
          key={node.name}
          {...node}
          hoveredNode={hoveredNode}
          setHoveredNode={setHoveredNode}
        />
      ))}
    </group>
  );
}

export default function TechStackOrbit() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodeDescriptions: Record<string, { desc: string; tag: string }> = {
    Python: { desc: "Powering the core machine learning backend and ArcFace face matching libraries.", tag: "ML Base Engine" },
    FastAPI: { desc: "High-performance API server with type check routing and sub-millisecond route response cycles.", tag: "API Framework" },
    Flutter: { desc: "Cross-platform mobile application utilizing native QR scanners and local biometric keys.", tag: "Client Mobile" },
    MongoDB: { desc: "Dynamic document storage hosting user credentials, class schedules, and real-time attendance streams.", tag: "Primary Database" },
    ArcFace: { desc: "Biometric mapping model mapping faces into 512-dimensional vector embedding space.", tag: "Biometric Matching" },
    'Groq AI': { desc: "Ultra-low latency inference engine running local LLM assistants and automated notifications.", tag: "Fast Inference" },
    'Gemini AI': { desc: "Deep insight generator providing predictive analysis, attendance trends, and administrative summaries.", tag: "Intelligence Core" },
    WebSockets: { desc: "Full-duplex concurrent channels synchronizing terminal logs, checks, and client screens instantly.", tag: "Real-time Sync" }
  };

  return (
    <section className="w-full max-w-7xl px-6 md:px-8 py-20 mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      
      {/* 3D Orbiting scene panel */}
      <div className="lg:col-span-7 flex justify-center items-center h-[350px] md:h-[450px] relative rounded-3xl bg-slate-950/40 border border-white/5 overflow-hidden">
        {/* Glow behind canvas */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        
        <CanvasContainer className="w-full h-full">
          <Canvas
            camera={{ position: [0, 4, 6], fov: 45 }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.65} />
            <pointLight position={[5, 10, 5]} intensity={1.5} color="#8B5CF6" />
            <pointLight position={[-5, -10, -5]} intensity={0.5} color="#2563EB" />
            
            <Scene hoveredNode={hoveredNode} setHoveredNode={setHoveredNode} />
            
            <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.2} />
          </Canvas>
        </CanvasContainer>
      </div>

      {/* Information breakdown panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className="space-y-2">
          <span className="text-[10px] tracking-[0.3em] font-mono text-primary uppercase block font-bold">
            INTEGRATED STACK
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
            Unified Architecture
          </h2>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
            SmartFace AI is engineered on top of a highly optimized, modern technology stack. Hover over any node in the orbit mesh to audit its integration details.
          </p>
        </div>

        {/* Selected or Default tech detail card */}
        <div className="p-6 bg-slate-950/50 border border-white/5 rounded-3xl min-h-[140px] flex flex-col justify-between transition-all duration-300">
          {hoveredNode ? (
            <div className="space-y-3 font-sans animate-fade-in">
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                <span className="font-bold text-white font-mono uppercase text-xs tracking-wider">
                  {hoveredNode}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono uppercase font-bold">
                  {nodeDescriptions[hoveredNode]?.tag}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {nodeDescriptions[hoveredNode]?.desc}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full py-4 text-slate-500 font-sans text-xs">
              <Cpu className="w-8 h-8 mb-2 opacity-30 animate-pulse" />
              <span>Hover over any technology node in the 3D space to explore integration specifics.</span>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
