"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  targetAlpha: number;
  alphaSpeed: number;
  color: string;
}

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let mouseX = -9999;
    let mouseY = -9999;
    let targetMouseX = -9999;
    let targetMouseY = -9999;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Palette inspired by ByTune: crisp star whites, soft indigo/violet glow, cyan sparks
    const COLORS = [
      "rgba(255, 255, 255, ",
      "rgba(245, 245, 248, ",
      "rgba(143, 139, 255, ",
      "rgba(111, 216, 255, ",
    ];

    let particles: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = Math.min(Math.floor((width * height) / 11000), 120);

      for (let i = 0; i < count; i++) {
        const baseAlpha = Math.random() * 0.65 + 0.15;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: -(Math.random() * 0.35 + 0.1),
          radius: Math.random() * 1.4 + 0.6,
          alpha: baseAlpha,
          targetAlpha: baseAlpha,
          alphaSpeed: Math.random() * 0.008 + 0.003,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      targetMouseX = -9999;
      targetMouseY = -9999;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    resize();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (targetMouseX > -9000) {
        mouseX += (targetMouseX - mouseX) * 0.08;
        mouseY += (targetMouseY - mouseY) * 0.08;
      } else {
        mouseX = -9999;
        mouseY = -9999;
      }

      // Draw subtle connecting constellation lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            const lineAlpha = (1 - dist / 90) * 0.12 * Math.min(particles[i].alpha, particles[j].alpha);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(143, 139, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.alpha < p.targetAlpha) {
            p.alpha = Math.min(p.targetAlpha, p.alpha + p.alphaSpeed);
          } else {
            p.alpha = Math.max(0.12, p.alpha - p.alphaSpeed);
            if (p.alpha <= 0.12) {
              p.targetAlpha = Math.random() * 0.75 + 0.2;
            }
          }

          if (mouseX > -9000) {
            const cdx = p.x - mouseX;
            const cdy = p.y - mouseY;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            if (cdist < 140 && cdist > 0) {
              const force = (1 - cdist / 140) * 0.8;
              p.x += (cdx / cdist) * force;
              p.y += (cdy / cdist) * force;
            }
          }

          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();

        if (p.radius > 1.2 && p.alpha > 0.45) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * 0.15})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute left-1/2 -top-[18%] -translate-x-1/2 w-[900px] h-[550px] rounded-full opacity-35 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(143, 139, 255, 0.16) 0%, rgba(111, 216, 255, 0.06) 45%, transparent 70%)",
        }}
      />
      <div
        className="absolute -right-[15%] top-[40%] w-[650px] h-[500px] rounded-full opacity-20 blur-[140px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(143, 139, 255, 0.12) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute -left-[10%] top-[70%] w-[600px] h-[500px] rounded-full opacity-15 blur-[130px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(30, 215, 96, 0.10) 0%, transparent 65%)",
        }}
      />

      <div className="absolute inset-0 bg-grid opacity-30 mask-radial" />
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
