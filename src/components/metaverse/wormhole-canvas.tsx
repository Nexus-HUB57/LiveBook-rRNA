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
  wobbleAmp: number;
  wobbleFreq: number;
  hueShift: number;
}

interface EnergyParticle {
  angle: number;
  z: number;
  speed: number;
  radius: number;
  size: number;
  opacity: number;
  color: string;
  trail: { x: number; y: number }[];
  helixPhase: number;
  helixAmp: number;
}

interface Filament {
  angleOffset: number;
  z: number;
  speed: number;
  amplitude: number;
  frequency: number;
  color: string;
  opacity: number;
  thickness: number;
}

interface TimeRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
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
  const filamentsRef = useRef<Filament[]>([]);
  const ripplesRef = useRef<TimeRipple[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const activationRef = useRef(0);
  const lastRippleRef = useRef(0);

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

    const ringCount = 50;
    const colors = ['#a855f7', '#e040a0', '#06d6a0', '#fbbf24', '#8b5cf6', '#06b6d4'];
    const glowColors = ['rgba(168,85,247,0.5)', 'rgba(224,64,160,0.5)', 'rgba(6,214,160,0.5)', 'rgba(251,191,36,0.5)', 'rgba(139,92,246,0.5)', 'rgba(6,182,212,0.5)'];
    const rings: TunnelRing[] = [];
    for (let i = 0; i < ringCount; i++) {
      const ci = i % colors.length;
      rings.push({
        z: i * (100 / ringCount),
        radius: 25 + Math.random() * 25,
        speed: 15 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.5,
        segments: 5 + Math.floor(Math.random() * 5),
        color: colors[ci],
        glowColor: glowColors[ci],
        opacity: 0.25 + Math.random() * 0.45,
        wobbleAmp: 0.05 + Math.random() * 0.12,
        wobbleFreq: 2 + Math.random() * 3,
        hueShift: Math.random() * Math.PI * 2,
      });
    }
    ringsRef.current = rings;

    const eParticles: EnergyParticle[] = [];
    for (let i = 0; i < 160; i++) {
      eParticles.push({
        angle: Math.random() * Math.PI * 2,
        z: Math.random() * 100,
        speed: 25 + Math.random() * 45,
        radius: 8 + Math.random() * 65,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        trail: [],
        helixPhase: Math.random() * Math.PI * 2,
        helixAmp: 3 + Math.random() * 12,
      });
    }
    particlesRef.current = eParticles;

    // Energy filaments — helical structures winding through the tunnel
    const filaments: Filament[] = [];
    for (let i = 0; i < 8; i++) {
      filaments.push({
        angleOffset: (i / 8) * Math.PI * 2,
        z: Math.random() * 100,
        speed: 12 + Math.random() * 15,
        amplitude: 15 + Math.random() * 30,
        frequency: 3 + Math.random() * 4,
        color: colors[i % colors.length],
        opacity: 0.15 + Math.random() * 0.2,
        thickness: 1 + Math.random() * 1.5,
      });
    }
    filamentsRef.current = filaments;

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const dt = 0.016;
      timeRef.current += dt;
      const t = timeRef.current;

      if (isActive) {
        activationRef.current = Math.min(1, activationRef.current + dt * 0.6);
      } else {
        activationRef.current = Math.max(0, activationRef.current - dt * 0.4);
      }
      const activation = activationRef.current;

      if (isActive && onSyncPulse) {
        onSyncPulse(activation);
      }

      if (w === 0 || h === 0) { animationRef.current = requestAnimationFrame(draw); return; }

      const cx = w / 2;
      const cy = h / 2;
      const maxZ = 100;

      ctx.clearRect(0, 0, w, h);

      // === BACKGROUND: Deep vortex gradient with spiral arms ===
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
      bgGrad.addColorStop(0, `rgba(168,85,247,${0.12 * activation})`);
      bgGrad.addColorStop(0.25, `rgba(224,64,160,${0.06 * activation})`);
      bgGrad.addColorStop(0.5, `rgba(6,214,160,${0.03 * activation})`);
      bgGrad.addColorStop(0.75, `rgba(6,182,212,${0.015 * activation})`);
      bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Spiral arms background
      if (activation > 0.05) {
        ctx.save();
        ctx.globalAlpha = activation * 0.06;
        for (let arm = 0; arm < 4; arm++) {
          ctx.beginPath();
          const armOffset = (arm / 4) * Math.PI * 2;
          for (let s = 0; s < 200; s++) {
            const progress = s / 200;
            const spiralAngle = armOffset + progress * Math.PI * 4 + t * 0.5;
            const spiralR = progress * Math.min(w, h) * 0.45;
            const sx = cx + Math.cos(spiralAngle) * spiralR;
            const sy = cy + Math.sin(spiralAngle) * spiralR;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.strokeStyle = colors[arm % colors.length];
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }

      // === TIME DILATION RIPPLES ===
      if (activation > 0.3 && t - lastRippleRef.current > 1.5) {
        lastRippleRef.current = t;
        ripplesRef.current.push({
          x: cx + (Math.random() - 0.5) * 40,
          y: cy + (Math.random() - 0.5) * 40,
          radius: 5,
          maxRadius: Math.min(w, h) * 0.4,
          opacity: 0.3,
          speed: 60 + Math.random() * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const ripple = ripplesRef.current[i];
        ripple.radius += ripple.speed * dt;
        ripple.opacity -= dt * 0.15;
        if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
          ripplesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = ripple.opacity * activation;
        ctx.strokeStyle = ripple.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
        // Second harmonic ring
        ctx.globalAlpha = ripple.opacity * activation * 0.3;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // === ENERGY FILAMENTS (helical structures) ===
      if (activation > 0.1) {
        for (const fil of filamentsRef.current) {
          fil.z -= fil.speed * dt * (1 + activation * 2.5);
          if (fil.z < -10) fil.z = maxZ + 10;

          const perspective = 350 / (350 + fil.z);
          const baseScreenR = fil.amplitude * perspective * (Math.min(w, h) / 500);
          const depthFade = 1 - fil.z / (maxZ + 20);

          ctx.save();
          ctx.globalAlpha = fil.opacity * depthFade * activation;
          ctx.strokeStyle = fil.color;
          ctx.lineWidth = fil.thickness * perspective;
          ctx.beginPath();

          const steps = 40;
          for (let s = 0; s <= steps; s++) {
            const progress = s / steps;
            const localZ = fil.z - progress * 30;
            const localPerspective = 350 / (350 + Math.max(0, localZ));
            const spiralAngle = fil.angleOffset + progress * fil.frequency * Math.PI + t * 1.5;
            const wobble = Math.sin(spiralAngle * 2 + t) * fil.amplitude * 0.2 * localPerspective;
            const screenR = (fil.amplitude + wobble) * localPerspective * (Math.min(w, h) / 500);
            const sx = cx + Math.cos(spiralAngle) * screenR;
            const sy = cy + Math.sin(spiralAngle) * screenR * 0.35;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();

          // Glow pass
          ctx.globalAlpha = fil.opacity * depthFade * activation * 0.2;
          ctx.lineWidth = fil.thickness * perspective * 4;
          ctx.stroke();
          ctx.restore();
        }
      }

      // === TUNNEL RINGS (evolved: wobble + hue shift + inner glow) ===
      const sortedRings = [...ringsRef.current].sort((a, b) => b.z - a.z);

      for (const ring of sortedRings) {
        ring.z -= ring.speed * dt * (1 + activation * 2.5);
        ring.rotation += ring.rotSpeed * dt * (1 + activation * 0.7);
        ring.hueShift += dt * 0.5;

        if (ring.z < -10) {
          ring.z = maxZ + 10;
          ring.rotation = Math.random() * Math.PI * 2;
        }

        const perspective = 350 / (350 + ring.z);
        const screenRadius = ring.radius * perspective * (Math.min(w, h) / 500);
        const wobbleX = Math.sin(ring.rotation * 0.3 + t) * 12 * perspective;
        const wobbleY = Math.cos(ring.rotation * 0.2 + t * 0.7) * 8 * perspective;
        const screenX = cx + wobbleX;
        const screenY = cy + wobbleY;

        const depthFade = 1 - ring.z / (maxZ + 20);
        const alpha = ring.opacity * depthFade * Math.max(0.08, activation);

        if (alpha < 0.01 || screenRadius < 1) continue;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(ring.rotation);

        // Outer glow layer (thicker, softer)
        ctx.globalAlpha = alpha * 0.15;
        ctx.strokeStyle = ring.glowColor;
        ctx.lineWidth = screenRadius * 0.5;
        ctx.beginPath();
        for (let s = 0; s <= ring.segments; s++) {
          const a = (s / ring.segments) * Math.PI * 2;
          const wobbleMod = 1 + Math.sin(a * ring.wobbleFreq + t * 2 + ring.hueShift) * ring.wobbleAmp;
          const r = screenRadius * wobbleMod;
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
        ctx.lineWidth = Math.max(0.8, screenRadius * 0.07);
        ctx.beginPath();
        for (let s = 0; s <= ring.segments; s++) {
          const a = (s / ring.segments) * Math.PI * 2;
          const wobbleMod = 1 + Math.sin(a * ring.wobbleFreq + t * 2 + ring.hueShift) * ring.wobbleAmp;
          const r = screenRadius * wobbleMod;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner fill (very subtle)
        if (screenRadius > 10) {
          ctx.globalAlpha = alpha * 0.04;
          ctx.fillStyle = ring.color;
          ctx.fill();
        }

        // Vertex dots with glow
        ctx.globalAlpha = alpha * 1.2;
        for (let s = 0; s < ring.segments; s++) {
          const a = (s / ring.segments) * Math.PI * 2;
          const wobbleMod = 1 + Math.sin(a * ring.wobbleFreq + t * 2 + ring.hueShift) * ring.wobbleAmp;
          const r = screenRadius * wobbleMod;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          const dotSize = Math.max(1, screenRadius * 0.05);

          // Glow
          ctx.globalAlpha = alpha * 0.3;
          ctx.fillStyle = ring.color;
          ctx.beginPath();
          ctx.arc(px, py, dotSize * 3, 0, Math.PI * 2);
          ctx.fill();

          // Core dot
          ctx.globalAlpha = alpha * 1.5;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // === ENERGY PARTICLES with helical trails ===
      for (const p of particlesRef.current) {
        p.z -= p.speed * dt * (1 + activation * 2.5);
        p.angle += dt * 0.6;
        p.helixPhase += dt * 4;

        if (p.z < -10) {
          p.z = maxZ + 10;
          p.angle = Math.random() * Math.PI * 2;
          p.opacity = Math.random() * 0.7 + 0.2;
          p.trail = [];
        }

        const perspective = 350 / (350 + p.z);
        const helixOffset = Math.sin(p.helixPhase) * p.helixAmp * perspective;
        const screenR = (p.radius + helixOffset) * perspective * (Math.min(w, h) / 500);
        const px = cx + Math.cos(p.angle) * screenR;
        const py = cy + Math.sin(p.angle) * screenR * 0.35;

        // Manage trail
        p.trail.push({ x: px, y: py });
        if (p.trail.length > 8) p.trail.shift();

        const depthFade = 1 - p.z / (maxZ + 20);
        const alpha = p.opacity * depthFade * activation;

        if (alpha < 0.01) continue;

        ctx.save();

        // Trail (gradient fade)
        if (p.trail.length > 1) {
          for (let ti = 1; ti < p.trail.length; ti++) {
            const trailAlpha = (ti / p.trail.length) * alpha * 0.4;
            ctx.globalAlpha = trailAlpha;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size * perspective * (ti / p.trail.length);
            ctx.beginPath();
            ctx.moveTo(p.trail[ti - 1].x, p.trail[ti - 1].y);
            ctx.lineTo(p.trail[ti].x, p.trail[ti].y);
            ctx.stroke();
          }
        }

        // Particle glow
        ctx.globalAlpha = alpha * 0.25;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, p.size * perspective * 3), 0, Math.PI * 2);
        ctx.fill();

        // Particle core
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.5, p.size * perspective), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // === CENTER PORTAL GLOW (evolved: multi-layer + distortion) ===
      if (activation > 0.05) {
        const portalPulse = 1 + Math.sin(t * 3) * 0.2 + Math.sin(t * 7) * 0.08;
        const portalSize = Math.min(w, h) * 0.14 * portalPulse * activation;

        // Outer distortion halo
        const haloGrad = ctx.createRadialGradient(cx, cy, portalSize * 0.8, cx, cy, portalSize * 2);
        haloGrad.addColorStop(0, `rgba(168,85,247,${0.08 * activation})`);
        haloGrad.addColorStop(0.5, `rgba(224,64,160,${0.04 * activation})`);
        haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, portalSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // Core portal
        const portalGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, portalSize));
        portalGrad.addColorStop(0, `rgba(255,255,255,${0.95 * activation})`);
        portalGrad.addColorStop(0.15, `rgba(168,85,247,${0.7 * activation})`);
        portalGrad.addColorStop(0.35, `rgba(224,64,160,${0.4 * activation})`);
        portalGrad.addColorStop(0.6, `rgba(6,214,160,${0.15 * activation})`);
        portalGrad.addColorStop(0.85, `rgba(6,182,212,${0.05 * activation})`);
        portalGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = portalGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, portalSize, 0, Math.PI * 2);
        ctx.fill();

        // Triple rotating arcs (evolved: counter-rotating + variable speed)
        ctx.save();
        ctx.translate(cx, cy);
        const arcConfigs = [
          { speed: 2, start: 0, len: 0.8, color: '#a855f7', width: 2.5 },
          { speed: -1.5, start: Math.PI, len: 0.9, color: '#06d6a0', width: 2 },
          { speed: 2.5, start: Math.PI * 1.2, len: 0.7, color: '#e040a0', width: 2 },
          { speed: -3, start: Math.PI * 0.5, len: 0.5, color: '#fbbf24', width: 1.5 },
        ];
        for (const arc of arcConfigs) {
          ctx.globalAlpha = 0.5 * activation;
          ctx.strokeStyle = arc.color;
          ctx.lineWidth = arc.width;
          ctx.beginPath();
          ctx.arc(0, 0, portalSize * 0.55, t * arc.speed + arc.start, t * arc.speed + arc.start + arc.len);
          ctx.stroke();
        }
        ctx.restore();
      }

      // === IDLE STATE: triple pulsing rings ===
      if (activation < 0.1) {
        for (let ir = 0; ir < 3; ir++) {
          const idlePulse = Math.sin(t * 1.2 + ir * 0.8) * 0.5 + 0.5;
          ctx.save();
          ctx.globalAlpha = idlePulse * 0.15;
          ctx.strokeStyle = colors[ir];
          ctx.lineWidth = 1;
          ctx.setLineDash([4 + ir * 2, 8 + ir * 3]);
          ctx.lineDashOffset = -t * (20 + ir * 10) * (ir % 2 === 0 ? 1 : -1);
          ctx.beginPath();
          ctx.arc(cx, cy, Math.min(w, h) * (0.12 + ir * 0.04), 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
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
      aria-label="Tunel de wormhole evoluido com filamentos helicoidais e vortice temporal"
    />
  );
}