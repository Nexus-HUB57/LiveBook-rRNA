'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  baseAngle: number;
  baseRadius: number;
  size: number;
  brightness: number;
}

interface AccretionParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  opacity: number;
  color: [number, number, number];
  spiralRate: number;
  life: number;
}

interface AbsorbedParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export default function BlackHoleCanvas({
  onWormholeTrigger,
  isWormholeActive,
  syncPhase,
}: {
  onWormholeTrigger?: () => void;
  isWormholeActive?: boolean;
  syncPhase?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const accretionRef = useRef<AccretionParticle[]>([]);
  const absorbedRef = useRef<AbsorbedParticle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const hoverRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });

  const init = useCallback((w: number, h: number) => {
    sizeRef.current = { w, h };
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.45;

    const stars: Star[] = [];
    for (let i = 0; i < 300; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * maxR * 1.8;
      stars.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        z: Math.random() * 2 + 0.5,
        baseAngle: angle,
        baseRadius: radius,
        size: Math.random() * 1.5 + 0.3,
        brightness: Math.random() * 0.8 + 0.2,
      });
    }
    starsRef.current = stars;

    const accretion: AccretionParticle[] = [];
    for (let i = 0; i < 400; i++) {
      const r = 40 + Math.random() * 140;
      const hue = r < 80 ? 280 + Math.random() * 40 : r < 120 ? 320 + Math.random() * 30 : 180 + Math.random() * 40;
      const color = hslToRgb(hue / 360, 0.8, 0.5 + Math.random() * 0.3);
      accretion.push({
        angle: Math.random() * Math.PI * 2,
        radius: r,
        speed: (0.3 + Math.random() * 0.7) / (r * 0.02),
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        color,
        spiralRate: 0.02 + Math.random() * 0.03,
        life: 1,
      });
    }
    accretionRef.current = accretion;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w: rect.width, h: rect.height };
      if (starsRef.current.length === 0) {
        init(rect.width, rect.height);
      }
    };

    const handleMouseMove = () => { hoverRef.current = true; };
    const handleMouseLeave = () => { hoverRef.current = false; };
    const handleClick = () => { onWormholeTrigger?.(); };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    // --- Helper functions inside useEffect for closure access to refs ---

    function drawAccretionHalf(
      c: CanvasRenderingContext2D,
      ccx: number, ccy: number, bhR: number,
      t: number, whIntensity: number, isBack: boolean
    ) {
      const accretion = accretionRef.current;
      for (const p of accretion) {
        p.angle += p.speed * 0.016 * (1 + whIntensity * 0.5);
        p.radius -= p.spiralRate * 0.02 * (1 + whIntensity);

        if (p.radius < bhR * 0.8) {
          p.radius = 120 + Math.random() * 60;
          p.angle = Math.random() * Math.PI * 2;
          p.life = 1;
        }

        const px = ccx + Math.cos(p.angle) * p.radius;
        const py = ccy + Math.sin(p.angle) * p.radius * 0.35;
        const isBehind = Math.sin(p.angle) > 0;

        if (isBack !== isBehind) continue;

        const distFromCenter = Math.sqrt((px - ccx) ** 2 + (py - ccy) ** 2);
        const fadeNear = distFromCenter < bhR * 1.2 ? Math.max(0, (distFromCenter - bhR) / (bhR * 0.2)) : 1;

        c.save();
        c.globalAlpha = p.opacity * fadeNear * (isBack ? 0.5 : 1);
        const [cr, cg, cb] = p.color;
        c.fillStyle = `rgb(${cr},${cg},${cb})`;
        c.beginPath();
        c.arc(px, py, p.size * (isBack ? 0.7 : 1), 0, Math.PI * 2);
        c.fill();

        c.globalAlpha = p.opacity * fadeNear * 0.15 * (isBack ? 0.3 : 1);
        c.beginPath();
        c.arc(px, py, p.size * 3, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    function drawJet(
      c: CanvasRenderingContext2D,
      jcx: number, jcy: number, bhR: number,
      t: number, intensity: number, direction: number
    ) {
      const jetLength = bhR * 5 * intensity;
      const segments = 30;

      for (let i = 0; i < segments; i++) {
        const progress = i / segments;
        const jy = jcy + direction * (bhR * 1.2 + progress * jetLength);
        const spread = progress * bhR * 0.8 * intensity;
        const wobble = Math.sin(t * 3 + i * 0.5) * spread * 0.3;
        const alpha = (1 - progress) * intensity * 0.4;

        c.save();
        c.globalAlpha = alpha;
        const grad = c.createRadialGradient(jcx + wobble, jy, 0, jcx + wobble, jy, Math.max(1, spread));
        grad.addColorStop(0, direction === -1 ? 'rgba(168,85,247,0.8)' : 'rgba(6,214,160,0.8)');
        grad.addColorStop(0.5, direction === -1 ? 'rgba(224,64,160,0.3)' : 'rgba(168,85,247,0.3)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = grad;
        c.beginPath();
        c.ellipse(jcx + wobble, jy, Math.max(1, spread), Math.max(1, spread * 0.4), 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    // --- Main draw loop ---

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) { animationRef.current = requestAnimationFrame(draw); return; }

      const cx = w / 2;
      const cy = h / 2;
      const bhRadius = Math.min(w, h) * 0.08;
      const eventHorizon = bhRadius * 1.5;
      const wormholeIntensity = isWormholeActive ? Math.min(syncPhase ?? 0, 1) : 0;

      ctx.clearRect(0, 0, w, h);

      // === BACKGROUND STARS with gravitational lensing ===
      for (const star of starsRef.current) {
        const dx = star.x - cx;
        const dy = star.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const lensStrength = Math.max(0, 1 - dist / (bhRadius * 6));
        const lensAngle = Math.atan2(dy, dx) + lensStrength * 0.5;
        const lensDist = dist + lensStrength * bhRadius * 2;

        const lx = cx + Math.cos(lensAngle) * lensDist;
        const ly = cy + Math.sin(lensAngle) * lensDist;

        const fadeFactor = dist < eventHorizon ? 0 : dist < eventHorizon * 2 ? (dist - eventHorizon) / eventHorizon : 1;
        const twinkle = Math.sin(t * star.z + star.baseAngle) * 0.2 + 0.8;

        ctx.save();
        ctx.globalAlpha = star.brightness * fadeFactor * twinkle * 0.7;
        ctx.fillStyle = '#e8e0f0';
        ctx.beginPath();
        ctx.arc(lx, ly, star.size * star.z, 0, Math.PI * 2);
        ctx.fill();

        if (lensStrength > 0.1 && dist < bhRadius * 5) {
          ctx.globalAlpha = lensStrength * 0.3 * fadeFactor;
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = star.size * 0.5;
          ctx.beginPath();
          const tangent = lensAngle + Math.PI / 2;
          ctx.moveTo(lx - Math.cos(tangent) * 4, ly - Math.sin(tangent) * 4);
          ctx.lineTo(lx + Math.cos(tangent) * 4, ly + Math.sin(tangent) * 4);
          ctx.stroke();
        }
        ctx.restore();
      }

      // === ACCRETION DISK (back half) ===
      drawAccretionHalf(ctx, cx, cy, bhRadius, t, wormholeIntensity, true);

      // === BLACK HOLE CENTER ===
      const pulseIntensity = 1 + Math.sin(t * 0.5) * 0.15 + wormholeIntensity * 0.5;
      const glowR = Math.max(1, eventHorizon * 2 * pulseIntensity);
      const glowGrad = ctx.createRadialGradient(cx, cy, Math.max(1, bhRadius * 0.5), cx, cy, glowR);
      glowGrad.addColorStop(0, 'rgba(0,0,0,1)');
      glowGrad.addColorStop(0.3, `rgba(20,0,40,${0.95 + wormholeIntensity * 0.05})`);
      glowGrad.addColorStop(0.5, `rgba(80,20,120,${0.3 + wormholeIntensity * 0.4})`);
      glowGrad.addColorStop(0.7, `rgba(168,85,247,${0.15 + wormholeIntensity * 0.3})`);
      glowGrad.addColorStop(1, 'rgba(168,85,247,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
      ctx.fill();

      if (wormholeIntensity > 0.1) {
        const wormGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, bhRadius));
        wormGrad.addColorStop(0, `rgba(6,214,160,${wormholeIntensity * 0.5})`);
        wormGrad.addColorStop(0.5, `rgba(168,85,247,${wormholeIntensity * 0.3})`);
        wormGrad.addColorStop(1, `rgba(224,64,160,${wormholeIntensity * 0.2})`);
        ctx.fillStyle = wormGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // === ACCRETION DISK (front half) ===
      drawAccretionHalf(ctx, cx, cy, bhRadius, t, wormholeIntensity, false);

      // === PHOTON RING ===
      ctx.save();
      ctx.globalAlpha = 0.4 + wormholeIntensity * 0.3 + Math.sin(t * 2) * 0.1;
      ctx.strokeStyle = `rgba(168,85,247,${0.5 + wormholeIntensity * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, eventHorizon * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // === JETS ===
      if (wormholeIntensity > 0.05) {
        drawJet(ctx, cx, cy, bhRadius, t, wormholeIntensity, -1);
        drawJet(ctx, cx, cy, bhRadius, t, wormholeIntensity, 1);
      }

      // === ABSORBED PARTICLES ===
      if (hoverRef.current && Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.min(w, h) * 0.4;
        absorbedRef.current.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          opacity: 0.8 + Math.random() * 0.2,
          color: ['#a855f7', '#06d6a0', '#e040a0'][Math.floor(Math.random() * 3)],
        });
      }

      for (let i = absorbedRef.current.length - 1; i >= 0; i--) {
        const p = absorbedRef.current[i];
        const pdx = cx - p.x;
        const pdy = cy - p.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        const force = 500 / (pdist * pdist + 100);
        p.vx += (pdx / pdist) * force;
        p.vy += (pdy / pdist) * force;
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.003;

        if (p.opacity <= 0 || pdist < bhRadius) {
          absorbedRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity * 0.6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (absorbedRef.current.length > 80) {
        absorbedRef.current.splice(0, 10);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationRef.current);
    };
  }, [init, isWormholeActive, syncPhase, onWormholeTrigger]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-pointer"
      aria-label="Simulacao interativa de buraco negro — clique para ativar o wormhole"
    />
  );
}