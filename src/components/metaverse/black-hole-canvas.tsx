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
  color: string;
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
  temperature: number;
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

interface HawkingParticle {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
  vx: number;
  vy: number;
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

function temperatureToColor(temp: number): [number, number, number] {
  // 0=cool(blue) 0.5=hot(purple) 1.0=extreme(white-yellow)
  if (temp < 0.3) return hslToRgb(240 + temp * 100, 0.8, 0.4 + temp);
  if (temp < 0.6) return hslToRgb(280 + (temp - 0.3) * 100, 0.9, 0.5 + temp * 0.3);
  return hslToRgb(40 + (temp - 0.6) * 20, 0.6, 0.7 + temp * 0.3);
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
  const hawkingRef = useRef<HawkingParticle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const hoverRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });

  const init = useCallback((w: number, h: number) => {
    sizeRef.current = { w, h };
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.45;

    const starColors = ['#e8e0f0', '#c8d8ff', '#ffe8d0', '#ffd0e8', '#d0ffe8'];
    const stars: Star[] = [];
    for (let i = 0; i < 350; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * maxR * 2;
      stars.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        z: Math.random() * 2.5 + 0.3,
        baseAngle: angle,
        baseRadius: radius,
        size: Math.random() * 1.8 + 0.2,
        brightness: Math.random() * 0.8 + 0.2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }
    starsRef.current = stars;

    const accretion: AccretionParticle[] = [];
    for (let i = 0; i < 500; i++) {
      const r = 35 + Math.random() * 150;
      const distFromBH = (r - 35) / 150;
      const temp = 1 - distFromBH;
      const color = temperatureToColor(temp);
      accretion.push({
        angle: Math.random() * Math.PI * 2,
        radius: r,
        speed: (0.3 + Math.random() * 0.8) / (r * 0.018),
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        color,
        spiralRate: 0.015 + Math.random() * 0.035,
        life: 1,
        temperature: temp,
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

    function drawAccretionHalf(
      c: CanvasRenderingContext2D,
      ccx: number, ccy: number, bhR: number,
      t: number, whIntensity: number, isBack: boolean
    ) {
      const accretion = accretionRef.current;
      for (const p of accretion) {
        p.angle += p.speed * 0.016 * (1 + whIntensity * 0.6);
        p.radius -= p.spiralRate * 0.02 * (1 + whIntensity * 1.2);
        // Dynamic temperature based on distance
        p.temperature = Math.max(0, Math.min(1, 1 - (p.radius - bhR) / 150));

        if (p.radius < bhR * 0.8) {
          p.radius = 130 + Math.random() * 55;
          p.angle = Math.random() * Math.PI * 2;
          p.life = 1;
          p.temperature = 0.2 + Math.random() * 0.3;
        }

        const px = ccx + Math.cos(p.angle) * p.radius;
        const py = ccy + Math.sin(p.angle) * p.radius * 0.3;
        const isBehind = Math.sin(p.angle) > 0;

        if (isBack !== isBehind) continue;

        const distFromCenter = Math.sqrt((px - ccx) ** 2 + (py - ccy) ** 2);
        const fadeNear = distFromCenter < bhR * 1.2 ? Math.max(0, (distFromCenter - bhR) / (bhR * 0.2)) : 1;

        // Thermal color shift
        const thermalColor = temperatureToColor(p.temperature);
        const [cr, cg, cb] = thermalColor;

        c.save();
        // Hotter particles glow more
        const glowMultiplier = 1 + p.temperature * 2;

        c.globalAlpha = p.opacity * fadeNear * (isBack ? 0.4 : 1);
        c.fillStyle = `rgb(${cr},${cg},${cb})`;
        c.beginPath();
        c.arc(px, py, p.size * (isBack ? 0.65 : 1), 0, Math.PI * 2);
        c.fill();

        // Heat glow for high-temperature particles
        if (p.temperature > 0.6 && !isBack) {
          c.globalAlpha = p.opacity * fadeNear * 0.2 * glowMultiplier;
          c.beginPath();
          c.arc(px, py, p.size * 4 * glowMultiplier, 0, Math.PI * 2);
          c.fill();
        }

        c.globalAlpha = p.opacity * fadeNear * 0.12 * (isBack ? 0.3 : 1);
        c.beginPath();
        c.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    function drawJet(
      c: CanvasRenderingContext2D,
      jcx: number, jcy: number, bhR: number,
      t: number, intensity: number, direction: number
    ) {
      const jetLength = bhR * 6 * intensity;
      const segments = 40;

      for (let i = 0; i < segments; i++) {
        const progress = i / segments;
        const jy = jcy + direction * (bhR * 1.2 + progress * jetLength);
        const spread = progress * bhR * 0.9 * intensity;
        const wobble1 = Math.sin(t * 3 + i * 0.4) * spread * 0.25;
        const wobble2 = Math.cos(t * 2.3 + i * 0.6) * spread * 0.15;
        const alpha = (1 - progress * 0.8) * intensity * 0.45;

        c.save();
        c.globalAlpha = alpha;
        const grad = c.createRadialGradient(jcx + wobble1 + wobble2, jy, 0, jcx + wobble1, jy, Math.max(1, spread));
        grad.addColorStop(0, direction === -1 ? 'rgba(168,85,247,0.9)' : 'rgba(6,214,160,0.9)');
        grad.addColorStop(0.3, direction === -1 ? 'rgba(224,64,160,0.5)' : 'rgba(168,85,247,0.5)');
        grad.addColorStop(0.6, direction === -1 ? 'rgba(6,182,212,0.2)' : 'rgba(251,191,36,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = grad;
        c.beginPath();
        c.ellipse(jcx + wobble1 + wobble2, jy, Math.max(1, spread), Math.max(1, spread * 0.35), 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }

      // Jet core beam
      c.save();
      c.globalAlpha = intensity * 0.15;
      const beamGrad = c.createLinearGradient(jcx, jcy, jcx, jcy + direction * jetLength);
      beamGrad.addColorStop(0, direction === -1 ? 'rgba(168,85,247,0.6)' : 'rgba(6,214,160,0.6)');
      beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = beamGrad;
      c.beginPath();
      c.moveTo(jcx - 2, jcy);
      c.lineTo(jcx + 2, jcy);
      c.lineTo(jcx + bhR * 0.15, jcy + direction * jetLength);
      c.lineTo(jcx - bhR * 0.15, jcy + direction * jetLength);
      c.closePath();
      c.fill();
      c.restore();
    }

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

      // === ADVANCED GRAVITATIONAL LENSING ===
      const einsteinRadius = bhRadius * 5;
      for (const star of starsRef.current) {
        const dx = star.x - cx;
        const dy = star.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Einstein ring deflection: θ = 4GM/(rc²) ≈ R_E²/dist
        const normalizedDist = dist / einsteinRadius;
        let lensStrength = 0;
        if (normalizedDist < 1) {
          lensStrength = 1; // Inside Einstein ring
        } else if (normalizedDist < 2.5) {
          lensStrength = 1 / (normalizedDist * normalizedDist);
        }

        const lensAngle = Math.atan2(dy, dx) + lensStrength * 0.8;
        const lensDist = dist + lensStrength * bhRadius * 3;

        const lx = cx + Math.cos(lensAngle) * lensDist;
        const ly = cy + Math.sin(lensAngle) * lensDist;

        const fadeFactor = dist < eventHorizon ? 0 : dist < eventHorizon * 2 ? (dist - eventHorizon) / eventHorizon : 1;
        const twinkle = Math.sin(t * star.z * 1.5 + star.baseAngle * 2) * 0.25 + 0.75;

        ctx.save();
        ctx.globalAlpha = star.brightness * fadeFactor * twinkle * 0.75;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(lx, ly, star.size * star.z, 0, Math.PI * 2);
        ctx.fill();

        // Einstein ring arc for strongly lensed stars
        if (lensStrength > 0.15 && dist > eventHorizon) {
          ctx.globalAlpha = lensStrength * 0.2 * fadeFactor;
          ctx.strokeStyle = star.color;
          ctx.lineWidth = star.size * 0.8;
          const arcSpan = lensStrength * 1.2;
          const tangent = Math.atan2(dy, dx);
          ctx.beginPath();
          ctx.arc(cx, cy, dist * 0.92, tangent - arcSpan, tangent + arcSpan);
          ctx.stroke();
        }
        ctx.restore();
      }

      // === ACCRETION DISK (back half) ===
      drawAccretionHalf(ctx, cx, cy, bhRadius, t, wormholeIntensity, true);

      // === BLACK HOLE CENTER with photon sphere ===
      const pulseIntensity = 1 + Math.sin(t * 0.5) * 0.15 + wormholeIntensity * 0.6;
      const glowR = Math.max(1, eventHorizon * 2.2 * pulseIntensity);

      // Outer atmospheric glow
      const outerGlow = ctx.createRadialGradient(cx, cy, Math.max(1, glowR * 0.7), cx, cy, Math.max(2, glowR * 1.5));
      outerGlow.addColorStop(0, `rgba(80,20,120,${0.08 + wormholeIntensity * 0.1})`);
      outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Main glow
      const glowGrad = ctx.createRadialGradient(cx, cy, Math.max(1, bhRadius * 0.5), cx, cy, glowR);
      glowGrad.addColorStop(0, 'rgba(0,0,0,1)');
      glowGrad.addColorStop(0.25, `rgba(15,0,30,${0.97 + wormholeIntensity * 0.03})`);
      glowGrad.addColorStop(0.45, `rgba(60,10,90,${0.3 + wormholeIntensity * 0.4})`);
      glowGrad.addColorStop(0.65, `rgba(168,85,247,${0.12 + wormholeIntensity * 0.3})`);
      glowGrad.addColorStop(0.85, `rgba(6,182,212,${0.04 + wormholeIntensity * 0.1})`);
      glowGrad.addColorStop(1, 'rgba(168,85,247,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Event horizon (pure black)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
      ctx.fill();

      // Wormhole interior glow
      if (wormholeIntensity > 0.1) {
        const wormGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, bhRadius));
        wormGrad.addColorStop(0, `rgba(6,214,160,${wormholeIntensity * 0.6})`);
        wormGrad.addColorStop(0.4, `rgba(168,85,247,${wormholeIntensity * 0.4})`);
        wormGrad.addColorStop(0.8, `rgba(224,64,160,${wormholeIntensity * 0.2})`);
        wormGrad.addColorStop(1, `rgba(0,0,0,0.5)`);
        ctx.fillStyle = wormGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // === ACCRETION DISK (front half) ===
      drawAccretionHalf(ctx, cx, cy, bhRadius, t, wormholeIntensity, false);

      // === PHOTON RING (double ring) ===
      const photonPulse = 0.35 + wormholeIntensity * 0.35 + Math.sin(t * 2) * 0.08;
      ctx.save();
      ctx.globalAlpha = photonPulse;
      ctx.strokeStyle = `rgba(168,85,247,${0.6 + wormholeIntensity * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, eventHorizon * 0.88, 0, Math.PI * 2);
      ctx.stroke();
      // Second photon ring (ISCO)
      ctx.globalAlpha = photonPulse * 0.4;
      ctx.strokeStyle = `rgba(251,191,36,${0.4 + wormholeIntensity * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, eventHorizon * 1.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // === HAWKING RADIATION (evolved: pairs emitted from horizon) ===
      if (Math.random() < 0.04 + wormholeIntensity * 0.08) {
        const emitAngle = Math.random() * Math.PI * 2;
        hawkingRef.current.push({
          angle: emitAngle,
          dist: bhRadius * 1.1,
          speed: 30 + Math.random() * 50,
          size: 1 + Math.random() * 1.5,
          opacity: 0.6 + Math.random() * 0.4,
          color: ['#a855f7', '#06d6a0', '#fbbf24', '#06b6d4'][Math.floor(Math.random() * 4)],
          vx: Math.cos(emitAngle) * 0.8,
          vy: Math.sin(emitAngle) * 0.8,
        });
        // Anti-particle (inward, absorbed)
        hawkingRef.current.push({
          angle: emitAngle + Math.PI,
          dist: bhRadius * 1.1,
          speed: 20,
          size: 0.8 + Math.random(),
          opacity: 0.3 + Math.random() * 0.2,
          color: '#e040a0',
          vx: Math.cos(emitAngle + Math.PI) * 0.3,
          vy: Math.sin(emitAngle + Math.PI) * 0.3,
        });
      }

      for (let i = hawkingRef.current.length - 1; i >= 0; i--) {
        const hp = hawkingRef.current[i];
        hp.dist += hp.speed * 0.016;
        hp.opacity -= 0.008;
        const hpx = cx + Math.cos(hp.angle) * hp.dist;
        const hpy = cy + Math.sin(hp.angle) * hp.dist;

        if (hp.opacity <= 0 || hp.dist > Math.min(w, h) * 0.5) {
          hawkingRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = hp.opacity;
        ctx.fillStyle = hp.color;
        ctx.beginPath();
        ctx.arc(hpx, hpy, hp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = hp.opacity * 0.2;
        ctx.beginPath();
        ctx.arc(hpx, hpy, hp.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (hawkingRef.current.length > 60) {
        hawkingRef.current.splice(0, 10);
      }

      // === JETS (evolved: dual-frequency wobble + core beam) ===
      if (wormholeIntensity > 0.05) {
        drawJet(ctx, cx, cy, bhRadius, t, wormholeIntensity, -1);
        drawJet(ctx, cx, cy, bhRadius, t, wormholeIntensity, 1);
      }

      // === ABSORBED PARTICLES ===
      if (hoverRef.current && Math.random() < 0.35) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.min(w, h) * 0.4;
        absorbedRef.current.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          opacity: 0.8 + Math.random() * 0.2,
          color: ['#a855f7', '#06d6a0', '#e040a0', '#fbbf24'][Math.floor(Math.random() * 4)],
        });
      }

      for (let i = absorbedRef.current.length - 1; i >= 0; i--) {
        const p = absorbedRef.current[i];
        const pdx = cx - p.x;
        const pdy = cy - p.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        const force = 600 / (pdist * pdist + 80);
        p.vx += (pdx / pdist) * force;
        p.vy += (pdy / pdist) * force;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.004;

        if (p.opacity <= 0 || pdist < bhRadius) {
          absorbedRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity * 0.5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = p.opacity * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (absorbedRef.current.length > 100) {
        absorbedRef.current.splice(0, 15);
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
      aria-label="Buraco negro evoluido com radiacao Hawking e lente gravitacional avancada"
    />
  );
}