'use client';

import { useEffect, useRef } from 'react';

interface TunnelRing {
  z: number;
  radius: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
  segments: number;
  color: string;
  glowColor: string;
  opacity: number;
}

interface EnergyParticle {
  angle: number;
  z: number;
  speed: number;
  radius: number;
  size: number;
  opacity: number;
  color: string;
}

export default function WormholeCanvas({
  isActive,
  onSyncPulse,
  syncPhase,
}: {
  isActive: boolean;
  onSyncPulse?: (phase: number) => void;
  syncPhase?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<TunnelRing[]>([]);
  const particlesRef = useRef<EnergyParticle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const activationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Init tunnel rings
    const ringCount = 40;
    const colors = ['#a855f7', '#e040a0', '#06d6a0', '#fbbf24', '#8b5cf6'];
    const glowColors = ['rgba(168,85,247,0.4)', 'rgba(224,64,160,0.4)', 'rgba(6,214,160,0.4)', 'rgba(251,191,36,0.4)', 'rgba(139,92,246,0.4)'];
    const rings: TunnelRing[] = [];
    for (let i = 0; i < ringCount; i++) {
      const ci = i % colors.length;
      rings.push({
        z: i * (100 / ringCount),
        radius: 30 + Math.random() * 20,
        speed: 20 + Math.random() * 15,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2,
        segments: 5 + Math.floor(Math.random() * 4),
        color: colors[ci],
        glowColor: glowColors[ci],
        opacity: 0.3 + Math.random() * 0.4,
      });
    }
    ringsRef.current = rings;

    // Init energy particles
    const eParticles: EnergyParticle[] = [];
    for (let i = 0; i < 120; i++) {
      eParticles.push({
        angle: Math.random() * Math.PI * 2,
        z: Math.random() * 100,
        speed: 30 + Math.random() * 40,
        radius: 10 + Math.random() * 60,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    particlesRef.current = eParticles;

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const dt = 0.016;
      timeRef.current += dt;
      const t = timeRef.current;

      // Smooth activation
      if (isActive) {
        activationRef.current = Math.min(1, activationRef.current + dt * 0.8);
      } else {
        activationRef.current = Math.max(0, activationRef.current - dt * 0.5);
      }
      const activation = activationRef.current;

      // Sync phase pulse
      if (isActive && onSyncPulse) {
        onSyncPulse(activation);
      }

      if (w === 0 || h === 0) { animationRef.current = requestAnimationFrame(draw); return; }

      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // === BACKGROUND VORTEX GLOW ===
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.5);
      bgGrad.addColorStop(0, `rgba(168,85,247,${0.15 * activation})`);
      bgGrad.addColorStop(0.4, `rgba(224,64,160,${0.08 * activation})`);
      bgGrad.addColorStop(0.7, `rgba(6,214,160,${0.04 * activation})`);
      bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // === TUNNEL RINGS ===
      const sortedRings = [...ringsRef.current].sort((a, b) => b.z - a.z);
      const maxZ = 100;

      for (const ring of sortedRings) {
        ring.z -= ring.speed * dt * (1 + activation * 2);
        ring.rotation += ring.rotSpeed * dt * (1 + activation * 0.5);

        if (ring.z < -10) {
          ring.z = maxZ + 10;
          ring.rotation = Math.random() * Math.PI * 2;
        }

        const perspective = 300 / (300 + ring.z);
        const screenRadius = ring.radius * perspective * (Math.min(w, h) / 500);
        const screenX = cx + Math.sin(ring.rotation * 0.3) * 10 * perspective;
        const screenY = cy + Math.cos(ring.rotation * 0.2) * 8 * perspective;

        const depthFade = 1 - ring.z / (maxZ + 20);
        const alpha = ring.opacity * depthFade * activation;

        if (alpha < 0.01 || screenRadius < 2) continue;

        // Draw ring segments (hexagonal/polygonal shape)
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(ring.rotation);

        // Glow
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = ring.glowColor;
        ctx.lineWidth = screenRadius * 0.4;
        ctx.beginPath();
        for (let s = 0; s <= ring.segments; s++) {
          const a = (s / ring.segments) * Math.PI * 2;
          const r = screenRadius * (1 + Math.sin(a * 3 + t * 2) * 0.1);
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Main ring
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = Math.max(1, screenRadius * 0.08);
        ctx.beginPath();
        for (let s = 0; s <= ring.segments; s++) {
          const a = (s / ring.segments) * Math.PI * 2;
          const r = screenRadius * (1 + Math.sin(a * 3 + t * 2) * 0.1);
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Vertex dots
        ctx.globalAlpha = alpha * 1.5;
        ctx.fillStyle = ring.color;
        for (let s = 0; s < ring.segments; s++) {
          const a = (s / ring.segments) * Math.PI * 2;
          const r = screenRadius * (1 + Math.sin(a * 3 + t * 2) * 0.1);
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, screenRadius * 0.04), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // === ENERGY PARTICLES streaming through tunnel ===
      for (const p of particlesRef.current) {
        p.z -= p.speed * dt * (1 + activation * 2);
        p.angle += dt * 0.5;

        if (p.z < -10) {
          p.z = maxZ + 10;
          p.angle = Math.random() * Math.PI * 2;
          p.opacity = Math.random() * 0.6 + 0.2;
        }

        const perspective = 300 / (300 + p.z);
        const screenR = p.radius * perspective * (Math.min(w, h) / 500);
        const px = cx + Math.cos(p.angle) * screenR;
        const py = cy + Math.sin(p.angle) * screenR;

        const depthFade = 1 - p.z / (maxZ + 20);
        const alpha = p.opacity * depthFade * activation;

        if (alpha < 0.01) continue;

        ctx.save();
        // Trail
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * perspective * 0.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        const prevZ = p.z + p.speed * dt * 5;
        const prevPerspective = 300 / (300 + prevZ);
        const prevR = p.radius * prevPerspective * (Math.min(w, h) / 500);
        ctx.lineTo(
          cx + Math.cos(p.angle - dt * 2) * prevR,
          cy + Math.sin(p.angle - dt * 2) * prevR
        );
        ctx.stroke();

        // Dot
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.5, p.size * perspective), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // === CENTER PORTAL GLOW ===
      if (activation > 0.1) {
        const portalPulse = 1 + Math.sin(t * 3) * 0.2;
        const portalSize = Math.min(w, h) * 0.12 * portalPulse * activation;
        const portalGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, portalSize);
        portalGrad.addColorStop(0, `rgba(255,255,255,${0.9 * activation})`);
        portalGrad.addColorStop(0.2, `rgba(168,85,247,${0.6 * activation})`);
        portalGrad.addColorStop(0.5, `rgba(224,64,160,${0.3 * activation})`);
        portalGrad.addColorStop(0.8, `rgba(6,214,160,${0.1 * activation})`);
        portalGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = portalGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, portalSize, 0, Math.PI * 2);
        ctx.fill();

        // Rotating energy arc
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 2);
        ctx.globalAlpha = 0.6 * activation;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, portalSize * 0.6, 0, Math.PI * 0.8);
        ctx.stroke();
        ctx.strokeStyle = '#06d6a0';
        ctx.beginPath();
        ctx.arc(0, 0, portalSize * 0.6, Math.PI, Math.PI * 1.8);
        ctx.stroke();
        ctx.strokeStyle = '#e040a0';
        ctx.beginPath();
        ctx.arc(0, 0, portalSize * 0.6, Math.PI * 1.2, Math.PI * 2.2);
        ctx.stroke();
        ctx.restore();
      }

      // === IDLE STATE: subtle pulsing ring ===
      if (activation < 0.1) {
        const idlePulse = Math.sin(t * 1.5) * 0.5 + 0.5;
        ctx.save();
        ctx.globalAlpha = idlePulse * 0.2;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        ctx.lineDashOffset = -t * 30;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(w, h) * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, onSyncPulse, syncPhase]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      aria-label="Túnel de wormhole sincronizado com o buraco negro"
    />
  );
}