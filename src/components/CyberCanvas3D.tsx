'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
}

export default function CyberCanvas3D() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Coordinate mouse
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Inizializzazione Matrice Particelle 3D
    const particleCount = 75;
    const particles: Particle[] = [];
    const fov = 350;

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * width * 1.5;
      const y = (Math.random() - 0.5) * height * 1.5;
      const z = Math.random() * 500 - 100;
      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const projectedPoints: { x: number; y: number; scale: number; alpha: number }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Movimento ondulatorio 3D
        p.x += p.vx;
        p.y += p.vy;
        p.z = p.baseZ + Math.sin(time + i * 0.2) * 45;

        // Reazione al mouse
        const dx = mouse.x - width / 2;
        const dy = mouse.y - height / 2;
        const rotX = p.x - dx * 0.15;
        const rotY = p.y - dy * 0.15;

        // Proiezione prospettica 3D -> 2D
        const scale = fov / (fov + p.z);
        const x2d = rotX * scale + width / 2;
        const y2d = rotY * scale + height / 2;
        const alpha = Math.max(0.1, Math.min(1, (scale - 0.3) * 1.2));

        projectedPoints.push({ x: x2d, y: y2d, scale, alpha });

        // Rendering del nodo olografico
        ctx.beginPath();
        ctx.arc(x2d, y2d, Math.max(1, 2.2 * scale), 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? `rgba(0, 240, 255, ${alpha})` : `rgba(0, 245, 155, ${alpha * 0.8})`;
        ctx.shadowColor = i % 3 === 0 ? '#00F0FF' : '#00F59B';
        ctx.shadowBlur = 8 * scale;
        ctx.fill();
      }

      // Connessioni vettoriali a ragnatela tra i nodi
      ctx.shadowBlur = 0;
      for (let i = 0; i < projectedPoints.length; i++) {
        for (let j = i + 1; j < projectedPoints.length; j++) {
          const p1 = projectedPoints[i];
          const p2 = projectedPoints[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * Math.min(p1.alpha, p2.alpha) * 0.35;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60"
    />
  );
}