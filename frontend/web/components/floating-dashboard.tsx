'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Glass panel widget component
function DashboardPanel({
  position,
  rotation,
  type = 'chart',
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  type?: 'chart' | 'logs' | 'face';
}) {
  const panelRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Animate elements inside the panel
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.5;
    }
  });

  return (
    <group ref={panelRef} position={position} rotation={rotation}>
      {/* Glass Backplate */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.6, 0.05]} />
        <meshPhysicalMaterial
          color="#0f172a"
          roughness={0.15}
          metalness={0.1}
          transmission={0.6}
          opacity={0.8}
          transparent
          clearcoat={1}
          clearcoatRoughness={0.1}
          thickness={0.5}
        />
      </mesh>

      {/* Panel Border / Frame */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[2.52, 1.62, 0.06]} />
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Holographic components based on type */}
      {type === 'chart' && (
        <group position={[0, -0.2, 0.04]}>
          {/* Mock 3D bar graph */}
          {[-0.8, -0.4, 0, 0.4, 0.8].map((x, idx) => {
            const h = [0.4, 0.8, 0.6, 1.1, 0.7][idx];
            return (
              <mesh key={idx} position={[x, h / 2 - 0.2, 0]}>
                <boxGeometry args={[0.22, h, 0.1]} />
                <meshStandardMaterial
                  color={idx === 3 ? '#10B981' : '#3B82F6'}
                  emissive={idx === 3 ? '#10B981' : '#2563EB'}
                  emissiveIntensity={0.6}
                  roughness={0.2}
                />
              </mesh>
            );
          })}
        </group>
      )}

      {type === 'face' && (
        <group position={[0, 0, 0.04]}>
          {/* Scanning face lock indicator */}
          <mesh ref={ringRef}>
            <ringGeometry args={[0.42, 0.48, 32]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.3, 0.02, 8, 24]} />
            <meshBasicMaterial color="#10B981" transparent opacity={0.8} wireframe />
          </mesh>
          <points>
            <sphereGeometry args={[0.15, 8, 8]} />
            <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.8} />
          </points>
        </group>
      )}

      {type === 'logs' && (
        <group position={[0, 0, 0.04]}>
          {/* Attendance metric indicators */}
          {[-0.7, 0, 0.7].map((x, idx) => {
            const progress = [0.92, 0.75, 0.88][idx];
            return (
              <group key={idx} position={[x, 0, 0]}>
                <mesh>
                  <ringGeometry args={[0.18, 0.23, 24]} />
                  <meshBasicMaterial color="#1e293b" side={THREE.DoubleSide} />
                </mesh>
                <mesh rotation={[0, 0, -Math.PI / 2]}>
                  <ringGeometry args={[0.18, 0.23, 24, 1, 0, Math.PI * 2 * progress]} />
                  <meshBasicMaterial
                    color={idx === 0 ? '#10b981' : '#3b82f6'}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
}

// Background space particles
function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = 120;
  const positions = React.useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      arr[i] = (Math.random() - 0.5) * 15;
    }
    return arr;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.02;
      pointsRef.current.rotation.x = time * 0.01;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#3b82f6"
        size={0.06}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.3}
      />
    </Points>
  );
}

// Scene assembly
function DashboardScene() {
  const groupRef = useRef<THREE.Group>(null);

  // Parallax animation
  useFrame((state) => {
    const { pointer } = state;
    const time = state.clock.getElapsedTime();
    
    if (groupRef.current) {
      // Mouse move tilt
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, pointer.x * 0.15, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -pointer.y * 0.15, 0.05);
      
      // Gentle breathing float
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Star dust */}
      <DustParticles />

      {/* Floating widgets */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        {/* Main central dashboard */}
        <DashboardPanel
          position={[0, 0.4, 0]}
          rotation={[0.05, -0.1, 0]}
          type="face"
        />
        
        {/* Chart Panel Left */}
        <DashboardPanel
          position={[-2.8, -0.6, 0.5]}
          rotation={[0.1, 0.2, -0.05]}
          type="chart"
        />

        {/* Status Panel Right */}
        <DashboardPanel
          position={[2.8, -0.6, 0.5]}
          rotation={[0.1, -0.2, 0.05]}
          type="logs"
        />
      </Float>

      {/* Holographic light lines behind */}
      <gridHelper args={[20, 20, '#1e293b', '#0f172a']} position={[0, -2, 0]} />
    </group>
  );
}

export default function FloatingDashboard() {
  return (
    <div className="w-full h-[500px] md:h-[650px] relative">
      {/* Glowing background spotlight ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] bg-primary/10 rounded-full blur-[80px] -z-10 animate-pulse-slow pointer-events-none" />

      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.4} />
        
        {/* Blue cybersecurity light sweep */}
        <directionalLight
          position={[5, 5, 4]}
          intensity={1.2}
          color="#3B82F6"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Accent spotlight */}
        <spotLight
          position={[-5, 5, 2]}
          intensity={0.8}
          color="#10B981"
          angle={0.6}
          penumbra={1}
        />

        <DashboardScene />
      </Canvas>
    </div>
  );
}
