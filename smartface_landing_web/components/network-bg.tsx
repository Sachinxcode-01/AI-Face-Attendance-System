'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Particle node structure
interface Node {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  originalPos: THREE.Vector3;
}

function Particles({ count = 100 }: { count?: number }) {
  const { viewport, pointer } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Generate initial particle states
  const nodes = useMemo(() => {
    const arr: Node[] = [];
    const width = viewport.width * 1.5;
    const height = viewport.height * 1.5;

    for (let i = 0; i < count; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * width,
        (Math.random() - 0.5) * height,
        (Math.random() - 0.5) * 5
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.02
      );
      arr.push({ pos, vel, originalPos: pos.clone() });
    }
    return arr;
  }, [count, viewport.width, viewport.height]);

  // Float arrays for points & lines
  const pointsPositions = useMemo(() => new Float32Array(count * 3), [count]);
  // Pre-allocate lines vertex array. Max connections we support is count * 4
  const maxLinePoints = count * 6;
  const linePositions = useMemo(() => new Float32Array(maxLinePoints * 3), [maxLinePoints]);

  useFrame(() => {
    const width = viewport.width * 1.5;
    const height = viewport.height * 1.5;
    
    // Project pointer to 3D plane
    const mouseX = pointer.x * viewport.width * 0.5;
    const mouseY = pointer.y * viewport.height * 0.5;
    const mousePos = new THREE.Vector3(mouseX, mouseY, 0);

    // Update node positions
    nodes.forEach((node, i) => {
      // Basic drift
      node.pos.add(node.vel);

      // Bounce bounds
      if (Math.abs(node.pos.x) > width / 2) node.vel.x *= -1;
      if (Math.abs(node.pos.y) > height / 2) node.vel.y *= -1;
      if (Math.abs(node.pos.z) > 4) node.vel.z *= -1;

      // Mouse interactive warp (nodes pull/push slightly relative to cursor)
      const distToMouse = node.pos.distanceTo(mousePos);
      if (distToMouse < 3.5) {
        const force = (3.5 - distToMouse) * 0.03;
        const dir = new THREE.Vector3().subVectors(node.pos, mousePos).normalize();
        node.pos.addScaledVector(dir, force);
      } else {
        // Return to natural drift path
        const pullDir = new THREE.Vector3().subVectors(node.originalPos, node.pos).normalize();
        node.pos.addScaledVector(pullDir, 0.005);
      }

      // Write coordinates to points array
      pointsPositions[i * 3] = node.pos.x;
      pointsPositions[i * 3 + 1] = node.pos.y;
      pointsPositions[i * 3 + 2] = node.pos.z;
    });

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Connect close nodes and write to line geometry
    let lineIdx = 0;
    const maxDist = 2.2;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (lineIdx >= maxLinePoints - 2) break;

        const dist = nodes[i].pos.distanceTo(nodes[j].pos);
        if (dist < maxDist) {
          // Point A
          linePositions[lineIdx * 3] = nodes[i].pos.x;
          linePositions[lineIdx * 3 + 1] = nodes[i].pos.y;
          linePositions[lineIdx * 3 + 2] = nodes[i].pos.z;
          
          // Point B
          linePositions[(lineIdx + 1) * 3] = nodes[j].pos.x;
          linePositions[(lineIdx + 1) * 3 + 1] = nodes[j].pos.y;
          linePositions[(lineIdx + 1) * 3 + 2] = nodes[j].pos.z;
          
          lineIdx += 2;
        }
      }
    }

    // Zero out unused vertices
    for (let i = lineIdx; i < maxLinePoints; i++) {
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
      {/* Dynamic connections */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#3B82F6"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Glow Nodes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[pointsPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#2563EB"
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export default function NetworkBackground() {
  return (
    <div className="absolute inset-0 -z-10 bg-slate-950 pointer-events-none">
      {/* Sleek radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05),transparent_60%)]" />
      
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Particles count={110} />
      </Canvas>
    </div>
  );
}
