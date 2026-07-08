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

interface ISCOOrbiter {
  angle: number;
  speed: number;
  size: number;
  brightness: number;
  trail: { x: number; y: number }[];
}

interface PenroseEvent {
  phase: 'entering' | 'splitting' | 'escaping';
  timer: number;
  enterAngle: number;
  enterDist: number;
  escapeAngle: number;
  escapeSpeed: number;
  escapeX: number;
  escapeY: number;
  escapeVx: number;
  escapeVy: number;
  escapeSize: number;
  escapeOpacity: number;
  inwardsOpacity: number;
}

interface SuperradiantFlash {
  angle: number;
  dist: number;
  life: number;
  maxLife: number;
  size: number;
  maxOpacity: number;
}

interface ErgosphereConfig {
  oblateness: number;
  rotationSpeed: number;
  baseRadius: number;
  color: string;
  pulseFreq: number;
}

interface FrameDragLine {
  angle: number;
  length: number;
  speed: number;
  opacity: number;
  thickness: number;
}

interface GravWaveRipple {
  radius: number;
  opacity: number;
  speed: number;
  amplitude: number;
  freq: number;
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
  // Dramatic redshift: 0=cool(blue-white) 0.5=hot(orange) 1.0=extreme(deep red)
  if (temp < 0.25) {
    // Far: blue-white (blueshifted)
    return hslToRgb(210 + temp * 80, 0.5 + temp * 0.5, 0.7 + temp * 0.2);
  }
  if (temp < 0.5) {
    // Medium: white to yellow
    return hslToRgb(50 + (temp - 0.25) * 120, 0.7 + temp * 0.3, 0.75 - temp * 0.3);
  }
  if (temp < 0.75) {
    // Hot: orange
    return hslToRgb(30 + (temp - 0.5) * 30, 0.95, 0.55 - (temp - 0.5) * 0.3);
  }
  // Extreme: deep red (redshifted)
  return hslToRgb(5 + (1 - temp) * 15, 0.9, 0.35 - (temp - 0.75) * 0.5);
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
  const iscoRef = useRef<ISCOOrbiter[]>([]);
  const penroseRef = useRef<PenroseEvent[]>([]);
  const superradiantRef = useRef<SuperradiantFlash[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const hoverRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });
  const lastPenroseRef = useRef(0);
  const lastSuperradiantRef = useRef(0);
  const ergosphereConfigRef = useRef<ErgosphereConfig>({
    oblateness: 0.7,
    rotationSpeed: 0.2,
    baseRadius: 1,
    color: '#b8860b',
    pulseFreq: 0.8,
  });
  const frameDragRef = useRef<FrameDragLine[]>([]);
  const gravWaveRef = useRef<GravWaveRipple[]>([]);
  const lastGravWaveRef = useRef(0);

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

    // ISCO orbiters: 7 bright particles at ~3x Schwarzschild radius
    const iscoOrbiters: ISCOOrbiter[] = [];
    for (let i = 0; i < 7; i++) {
      iscoOrbiters.push({
        angle: (i / 7) * Math.PI * 2 + Math.random() * 0.3,
        speed: 1.8 + Math.random() * 0.6,
        size: 2 + Math.random() * 1.5,
        brightness: 0.7 + Math.random() * 0.3,
        trail: [],
      });
    }
    iscoRef.current = iscoOrbiters;

    // Frame-dragging spiral lines: 8 logarithmic spirals
    const frameDragLines: FrameDragLine[] = [];
    for (let i = 0; i < 8; i++) {
      frameDragLines.push({
        angle: (i / 8) * Math.PI * 2,
        length: 80 + Math.random() * 60,
        speed: 0.3 + Math.random() * 0.2,
        opacity: 0.08 + Math.random() * 0.07,
        thickness: 0.5 + Math.random() * 0.8,
      });
    }
    frameDragRef.current = frameDragLines;
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
      t: number, whIntensity: number, isBack: boolean,
      ergoRadiusX: number, ergoRadiusY: number
    ) {
      const accretion = accretionRef.current;
      for (const p of accretion) {
        p.angle += p.speed * 0.016 * (1 + whIntensity * 0.6);
        p.radius -= p.spiralRate * 0.02 * (1 + whIntensity * 1.2);
        // Dynamic temperature based on distance (dramatic redshift)
        p.temperature = Math.max(0, Math.min(1, 1 - (p.radius - bhR) / 150));

        if (p.radius < bhR * 0.8) {
          p.radius = 130 + Math.random() * 55;
          p.angle = Math.random() * Math.PI * 2;
          p.life = 1;
          p.temperature = 0.2 + Math.random() * 0.3;
        }

        // Frame-dragging spiral: particles near horizon get extra angular velocity
        const distFromHorizon = (p.radius - bhR) / bhR;
        const frameDragBoost = distFromHorizon < 1 ? (1 - distFromHorizon) * 1.5 : 0;
        p.angle += frameDragBoost * 0.016 * 2;

        const px = ccx + Math.cos(p.angle) * p.radius;
        const py = ccy + Math.sin(p.angle) * p.radius * 0.3;
        const isBehind = Math.sin(p.angle) > 0;

        if (isBack !== isBehind) continue;

        const distFromCenter = Math.sqrt((px - ccx) ** 2 + (py - ccy) ** 2);
        const fadeNear = distFromCenter < bhR * 1.2 ? Math.max(0, (distFromCenter - bhR) / (bhR * 0.2)) : 1;

        // Dramatic thermal color shift (gravitational redshift)
        const thermalColor = temperatureToColor(p.temperature);
        const [cr, cg, cb] = thermalColor;

        c.save();
        // Hotter particles glow more
        const glowMultiplier = 1 + p.temperature * 3;

        c.globalAlpha = p.opacity * fadeNear * (isBack ? 0.4 : 1);
        c.fillStyle = `rgba(${cr},${cg},${cb},1)`;
        c.beginPath();
        c.arc(px, py, p.size * (isBack ? 0.65 : 1), 0, Math.PI * 2);
        c.fill();

        // Heat glow for high-temperature particles (more dramatic)
        if (p.temperature > 0.4 && !isBack) {
          const heatAlpha = p.temperature * 0.3 * glowMultiplier;
          c.globalAlpha = p.opacity * fadeNear * Math.min(0.5, heatAlpha);
          c.beginPath();
          c.arc(px, py, p.size * 5 * glowMultiplier, 0, Math.PI * 2);
          c.fill();
        }

        // Extreme temperature glow (deep red corona)
        if (p.temperature > 0.8 && !isBack) {
          c.globalAlpha = p.opacity * fadeNear * 0.15;
          c.beginPath();
          c.arc(px, py, p.size * 8, 0, Math.PI * 2);
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
      t: number, intensity: number, direction: number,
      precessionAngle: number
    ) {
      const jetLength = bhR * 6 * intensity;
      const segments = 40;

      for (let i = 0; i < segments; i++) {
        const progress = i / segments;
        // Jet precession: wobble around vertical axis
        const precOffsetX = Math.sin(precessionAngle + progress * 0.5) * progress * bhR * 0.8;
        const precOffsetZ = Math.cos(precessionAngle + progress * 0.5) * progress * bhR * 0.3;
        const jy = jcy + direction * (bhR * 1.2 + progress * jetLength);
        const spread = progress * bhR * 0.9 * intensity;
        const wobble1 = Math.sin(t * 3 + i * 0.4) * spread * 0.25;
        const wobble2 = Math.cos(t * 2.3 + i * 0.6) * spread * 0.15;
        const alpha = (1 - progress * 0.8) * intensity * 0.45;
        const jx = jcx + precOffsetX + wobble1 + wobble2;

        c.save();
        c.globalAlpha = alpha;
        const grad = c.createRadialGradient(jx, jy, 0, jx, jy, Math.max(1, spread));
        grad.addColorStop(0, direction === -1 ? 'rgba(168,85,247,0.9)' : 'rgba(6,214,160,0.9)');
        grad.addColorStop(0.3, direction === -1 ? 'rgba(224,64,160,0.5)' : 'rgba(168,85,247,0.5)');
        grad.addColorStop(0.6, direction === -1 ? 'rgba(6,182,212,0.2)' : 'rgba(251,191,36,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = grad;
        c.beginPath();
        c.ellipse(jx, jy, Math.max(1, spread), Math.max(1, spread * 0.35), 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }

      // Jet core beam with precession
      c.save();
      c.globalAlpha = intensity * 0.15;
      const precBaseX = Math.sin(precessionAngle) * bhR * 0.15;
      const precEndX = Math.sin(precessionAngle + 0.5) * bhR * 0.4;
      const beamGrad = c.createLinearGradient(jcx, jcy, jcx + precEndX, jcy + direction * jetLength);
      beamGrad.addColorStop(0, direction === -1 ? 'rgba(168,85,247,0.6)' : 'rgba(6,214,160,0.6)');
      beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = beamGrad;
      c.beginPath();
      c.moveTo(jcx + precBaseX - 2, jcy);
      c.lineTo(jcx + precBaseX + 2, jcy);
      c.lineTo(jcx + precEndX + bhR * 0.15, jcy + direction * jetLength);
      c.lineTo(jcx + precEndX - bhR * 0.15, jcy + direction * jetLength);
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

      // Ergosphere dimensions (Kerr: oblate, outside event horizon)
      const ergoRadiusX = eventHorizon * 1.45;
      const ergoRadiusY = eventHorizon * 1.15;

      // Jet precession angle (slow wobble ~20s period)
      const jetPrecessionAngle = t * 0.314; // ~20 second period

      ctx.clearRect(0, 0, w, h);

      // === ADVANCED GRAVITATIONAL LENSING ===
      const einsteinRadius = bhRadius * 5;
      for (const star of starsRef.current) {
        const dx = star.x - cx;
        const dy = star.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const normalizedDist = dist / einsteinRadius;
        let lensStrength = 0;
        if (normalizedDist < 1) {
          lensStrength = 1;
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

      // === FRAME-DRAGGING SPIRAL ARMS in accretion disk ===
      if (wormholeIntensity > 0.1 || true) {
        ctx.save();
        const spiralArmCount = 3;
        for (let arm = 0; arm < spiralArmCount; arm++) {
          const armBaseAngle = (arm / spiralArmCount) * Math.PI * 2 + t * 0.15;
          ctx.beginPath();
          const armSteps = 120;
          for (let s = 0; s <= armSteps; s++) {
            const progress = s / armSteps;
            const spiralR = eventHorizon * 1.2 + progress * bhRadius * 4;
            // Frame-dragging: tighter spiral near horizon
            const dragFactor = 1 + (1 - progress) * 2;
            const spiralAngle = armBaseAngle + progress * Math.PI * 1.5 * dragFactor;
            const sx = cx + Math.cos(spiralAngle) * spiralR;
            const sy = cy + Math.sin(spiralAngle) * spiralR * 0.3;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.globalAlpha = 0.04 + wormholeIntensity * 0.06;
          ctx.strokeStyle = `rgba(168,85,247,1)`;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Glow pass
          ctx.globalAlpha = 0.02 + wormholeIntensity * 0.03;
          ctx.lineWidth = 8;
          ctx.stroke();
        }
        ctx.restore();
      }

      // === ERGOSPHERE VISUALIZATION (oblate, amber/gold, before accretion disk) ===
      {
        const ergoCfg = ergosphereConfigRef.current;
        const ergoBreathOblateness = ergoCfg.oblateness
          + Math.sin(t * ergoCfg.pulseFreq) * 0.06
          + (wormholeIntensity > 0.1 ? wormholeIntensity * 0.08 : 0);
        const ergoVisBaseR = eventHorizon * 1.35;
        const ergoVisPulseAlpha = 0.05 + Math.sin(t * ergoCfg.pulseFreq * 1.5) * 0.03
          + (wormholeIntensity > 0.1 ? wormholeIntensity * 0.07 : 0);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * ergoCfg.rotationSpeed);

        // Semi-transparent filled ellipse (dark amber/gold)
        ctx.globalAlpha = Math.min(0.12, ergoVisPulseAlpha);
        ctx.fillStyle = 'rgba(180,134,11,1)';
        ctx.beginPath();
        ctx.ellipse(0, 0, ergoVisBaseR, ergoVisBaseR * ergoBreathOblateness, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dashed border line for the ergosphere boundary
        ctx.globalAlpha = Math.min(0.25, ergoVisPulseAlpha * 2.5);
        ctx.strokeStyle = 'rgba(200,160,40,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 4]);
        ctx.lineDashOffset = -t * 15;
        ctx.beginPath();
        ctx.ellipse(0, 0, ergoVisBaseR, ergoVisBaseR * ergoBreathOblateness, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Subtle inner gradient to enhance depth
        const ergoInnerGrad = ctx.createRadialGradient(0, 0, bhRadius, 0, 0, Math.max(2, ergoVisBaseR));
        ergoInnerGrad.addColorStop(0, 'rgba(0,0,0,0)');
        ergoInnerGrad.addColorStop(0.6, `rgba(180,134,11,${0.02 + wormholeIntensity * 0.03})`);
        ergoInnerGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = ergoInnerGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, ergoVisBaseR, ergoVisBaseR * ergoBreathOblateness, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // === ACCRETION DISK (back half) ===
      drawAccretionHalf(ctx, cx, cy, bhRadius, t, wormholeIntensity, true, ergoRadiusX, ergoRadiusY);

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

      // === FRAME-DRAGGING SPIRAL LINES (logarithmic spirals near event horizon) ===
      {
        ctx.save();
        const fdRotationBase = t * 0.1 + wormholeIntensity * 0.2;
        for (const fdl of frameDragRef.current) {
          const fdStartAngle = fdl.angle + fdRotationBase;
          const fdA = eventHorizon * 1.05;
          const fdB = 0.15;
          ctx.beginPath();
          const fdSteps = 80;
          let fdLastValid = false;
          for (let fdi = 0; fdi <= fdSteps; fdi++) {
            const fdTheta = (fdi / fdSteps) * fdl.length * 0.02;
            const fdR = fdA * Math.exp(fdB * fdTheta);
            if (fdR > eventHorizon * 2.5) break;
            const fdX = cx + Math.cos(fdStartAngle + fdTheta) * fdR;
            const fdY = cy + Math.sin(fdStartAngle + fdTheta) * fdR;
            if (!fdLastValid) { ctx.moveTo(fdX, fdY); fdLastValid = true; }
            else ctx.lineTo(fdX, fdY);
          }
          ctx.globalAlpha = fdl.opacity + wormholeIntensity * 0.07;
          ctx.strokeStyle = 'rgba(200,160,60,1)';
          ctx.lineWidth = fdl.thickness;
          ctx.stroke();
        }
        ctx.restore();
      }

      // === ACCRETION DISK (front half) ===
      drawAccretionHalf(ctx, cx, cy, bhRadius, t, wormholeIntensity, false, ergoRadiusX, ergoRadiusY);

      // === ERGOSPHERE BOUNDARY (Kerr black hole) ===
      ctx.save();
      ctx.translate(cx, cy);
      const ergoPulse = 1 + Math.sin(t * 0.8) * 0.04;
      const ergoRotation = t * 0.2;

      // Ergosphere fill (very subtle)
      ctx.save();
      ctx.rotate(ergoRotation);
      ctx.globalAlpha = 0.06 + wormholeIntensity * 0.04;
      const ergoGrad = ctx.createRadialGradient(0, 0, bhRadius, 0, 0, Math.max(2, ergoRadiusX * ergoPulse));
      ergoGrad.addColorStop(0, 'rgba(168,85,247,0.2)');
      ergoGrad.addColorStop(0.5, 'rgba(100,50,180,0.1)');
      ergoGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ergoGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, ergoRadiusX * ergoPulse, ergoRadiusY * ergoPulse, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ergosphere boundary stroke
      ctx.globalAlpha = 0.2 + wormholeIntensity * 0.15;
      ctx.strokeStyle = 'rgba(168,85,247,0.6)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -t * 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, ergoRadiusX * ergoPulse, ergoRadiusY * ergoPulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Forced co-rotation visual: small arrows/dots inside ergosphere
      if (wormholeIntensity > 0.1) {
        const coRotCount = 8;
        ctx.globalAlpha = wormholeIntensity * 0.3;
        for (let cri = 0; cri < coRotCount; cri++) {
          const coAngle = (cri / coRotCount) * Math.PI * 2 + t * 1.5;
          const coR = eventHorizon * (0.85 + Math.sin(t + cri) * 0.15);
          const coX = Math.cos(coAngle) * coR;
          const coY = Math.sin(coAngle) * coR * 0.5;
          // Small trailing arc to show co-rotation direction
          ctx.strokeStyle = 'rgba(224,64,160,0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, coR, coAngle - 0.3, coAngle, false);
          ctx.stroke();
          // Dot at end
          ctx.fillStyle = 'rgba(224,64,160,0.8)';
          ctx.beginPath();
          ctx.arc(coX, coY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // === MULTI-SHELL PHOTON SPHERES (3 distinct shells with wobble) ===
      const photonShell1R = eventHorizon * 1.5 + Math.sin(t * 3.2) * 2;
      const photonShell2R = eventHorizon * 1.8 + Math.sin(t * 2.1 + 1) * 2;
      const photonShell3R = eventHorizon * 2.2 + Math.sin(t * 1.4 + 2) * 2;

      // Shell 1 (innermost): r = 1.5 * eventHorizon, bright white-gold, thin, fast rotation
      {
        const shell1Alpha = 0.5 + wormholeIntensity * 0.3 + Math.sin(t * 3.2) * 0.1;
        ctx.save();
        // Core ring
        ctx.globalAlpha = shell1Alpha;
        ctx.strokeStyle = `rgba(255,240,200,${0.8 + wormholeIntensity * 0.2})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, photonShell1R), 0, Math.PI * 2);
        ctx.stroke();
        // Thin glow
        ctx.globalAlpha = shell1Alpha * 0.3;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      }

      // Shell 2 (middle): r = 1.8 * eventHorizon, medium gold, medium thickness
      {
        const shell2Alpha = 0.35 + wormholeIntensity * 0.25 + Math.sin(t * 2.1) * 0.08;
        ctx.save();
        // Core ring
        ctx.globalAlpha = shell2Alpha;
        ctx.strokeStyle = `rgba(200,160,60,${0.6 + wormholeIntensity * 0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, photonShell2R), 0, Math.PI * 2);
        ctx.stroke();
        // Glow
        ctx.globalAlpha = shell2Alpha * 0.2;
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.restore();
      }

      // Shell 3 (outermost): r = 2.2 * eventHorizon, faint purple, thick and diffuse
      {
        const shell3Alpha = 0.2 + wormholeIntensity * 0.15 + Math.sin(t * 1.4) * 0.06;
        ctx.save();
        // Core ring
        ctx.globalAlpha = shell3Alpha;
        ctx.strokeStyle = `rgba(160,100,220,${0.3 + wormholeIntensity * 0.15})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, photonShell3R), 0, Math.PI * 2);
        ctx.stroke();
        // Diffuse glow
        ctx.globalAlpha = shell3Alpha * 0.1;
        ctx.lineWidth = 14;
        ctx.stroke();
        ctx.restore();
      }

      // === ISCO RING with orbiting particles ===
      const iscoRadius = bhRadius * 3;
      const iscoPulse = 0.25 + wormholeIntensity * 0.3;

      // ISCO ring
      ctx.save();
      ctx.globalAlpha = iscoPulse * 0.4;
      ctx.strokeStyle = 'rgba(6,214,160,0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.lineDashOffset = -t * 40;
      ctx.beginPath();
      ctx.ellipse(cx, cy, iscoRadius, iscoRadius * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ISCO orbiting particles
  for (const orb of iscoRef.current) {
    orb.angle += orb.speed * 0.016;
    const orbX = cx + Math.cos(orb.angle) * iscoRadius;
    const orbY = cy + Math.sin(orb.angle) * iscoRadius * 0.3;

    // Trail
    orb.trail.push({ x: orbX, y: orbY });
    if (orb.trail.length > 10) orb.trail.shift();

    const orbAlpha = iscoPulse * orb.brightness;

    // Draw trail
    if (orb.trail.length > 1) {
      for (let ti = 1; ti < orb.trail.length; ti++) {
        const trailAlpha = (ti / orb.trail.length) * orbAlpha * 0.4;
        ctx.save();
        ctx.globalAlpha = trailAlpha;
        ctx.strokeStyle = 'rgba(6,214,160,1)';
        ctx.lineWidth = orb.size * 0.5 * (ti / orb.trail.length);
        ctx.beginPath();
        ctx.moveTo(orb.trail[ti - 1].x, orb.trail[ti - 1].y);
        ctx.lineTo(orb.trail[ti].x, orb.trail[ti].y);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Particle glow
    ctx.save();
    ctx.globalAlpha = orbAlpha * 0.3;
    ctx.fillStyle = 'rgba(6,214,160,1)';
    ctx.beginPath();
    ctx.arc(orbX, orbY, orb.size * 4, 0, Math.PI * 2);
    ctx.fill();

    // Particle core
    ctx.globalAlpha = orbAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(orbX, orbY, orb.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

      // === SUPERRADIANT SCATTERING (bright flashes near ergosphere) ===
      if (t - lastSuperradiantRef.current > 2 + Math.random() * 4) {
        lastSuperradiantRef.current = t;
        superradiantRef.current.push({
          angle: Math.random() * Math.PI * 2,
          dist: eventHorizon * (1.1 + Math.random() * 0.3),
          life: 0,
          maxLife: 0.4 + Math.random() * 0.4,
          size: 15 + Math.random() * 25,
          maxOpacity: 0.5 + Math.random() * 0.5,
        });
      }

      for (let si = superradiantRef.current.length - 1; si >= 0; si--) {
        const sf = superradiantRef.current[si];
        sf.life += 0.016;
        if (sf.life >= sf.maxLife) {
          superradiantRef.current.splice(si, 1);
          continue;
        }
        const sProgress = sf.life / sf.maxLife;
        const sFade = sProgress < 0.3 ? sProgress / 0.3 : 1 - (sProgress - 0.3) / 0.7;
        const sAlpha = sFade * sf.maxOpacity;
        const sfX = cx + Math.cos(sf.angle) * sf.dist;
        const sfY = cy + Math.sin(sf.angle) * sf.dist * 0.3;

        ctx.save();
        const sfGrad = ctx.createRadialGradient(sfX, sfY, 0, sfX, sfY, Math.max(1, sf.size * sFade));
        sfGrad.addColorStop(0, `rgba(255,255,255,${sAlpha * 0.9})`);
        sfGrad.addColorStop(0.2, `rgba(168,85,247,${sAlpha * 0.6})`);
        sfGrad.addColorStop(0.5, `rgba(224,64,160,${sAlpha * 0.3})`);
        sfGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sfGrad;
        ctx.beginPath();
        ctx.arc(sfX, sfY, Math.max(1, sf.size * sFade * 1.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (superradiantRef.current.length > 8) {
        superradiantRef.current.splice(0, 2);
      }

      // === PENROSE PROCESS VISUALIZATION ===
      if (t - lastPenroseRef.current > 5 + Math.random() * 8) {
        lastPenroseRef.current = t;
        const enterAngle = Math.random() * Math.PI * 2;
        penroseRef.current.push({
          phase: 'entering',
          timer: 0,
          enterAngle,
          enterDist: eventHorizon * 2.5,
          escapeAngle: 0,
          escapeSpeed: 0,
          escapeX: 0,
          escapeY: 0,
          escapeVx: 0,
          escapeVy: 0,
          escapeSize: 0,
          escapeOpacity: 1,
          inwardsOpacity: 1,
        });
      }

      for (let pi = penroseRef.current.length - 1; pi >= 0; pi--) {
        const pe = penroseRef.current[pi];
        pe.timer += 0.016;

        if (pe.phase === 'entering') {
          // Particle spirals toward ergosphere
          pe.enterDist -= 1.5;
          pe.enterAngle += 0.04;

          const peX = cx + Math.cos(pe.enterAngle) * pe.enterDist;
          const peY = cy + Math.sin(pe.enterAngle) * pe.enterDist * 0.3;

          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = 'rgba(6,182,212,1)';
          ctx.beginPath();
          ctx.arc(peX, peY, 3, 0, Math.PI * 2);
          ctx.fill();
          // Glow
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.arc(peX, peY, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (pe.enterDist <= eventHorizon * 1.2) {
            pe.phase = 'splitting';
            pe.timer = 0;
            pe.escapeAngle = pe.enterAngle;
            pe.escapeX = peX;
            pe.escapeY = peY;
            pe.escapeSpeed = 4 + Math.random() * 3;
            pe.escapeSize = 4;
            pe.escapeOpacity = 1;
            pe.inwardsOpacity = 1;
          }
        } else if (pe.phase === 'splitting') {
          // Split animation: bright flash
          if (pe.timer < 0.3) {
            const splitFlash = 1 - pe.timer / 0.3;
            ctx.save();
            ctx.globalAlpha = splitFlash * 0.7;
            const splitGrad = ctx.createRadialGradient(pe.escapeX, pe.escapeY, 0, pe.escapeX, pe.escapeY, Math.max(1, 20 * splitFlash));
            splitGrad.addColorStop(0, 'rgba(255,255,255,1)');
            splitGrad.addColorStop(0.3, 'rgba(168,85,247,0.6)');
            splitGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = splitGrad;
            ctx.beginPath();
            ctx.arc(pe.escapeX, pe.escapeY, Math.max(1, 20 * splitFlash), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Inward-falling particle (red, fading)
          const inwardDist = eventHorizon * 1.2 - pe.timer * 30;
          if (inwardDist > bhRadius * 0.5) {
            pe.inwardsOpacity -= 0.015;
            const inX = cx + Math.cos(pe.escapeAngle + 0.05) * inwardDist;
            const inY = cy + Math.sin(pe.escapeAngle + 0.05) * inwardDist * 0.3;
            ctx.save();
            ctx.globalAlpha = Math.max(0, pe.inwardsOpacity) * 0.6;
            ctx.fillStyle = 'rgba(255,60,60,1)';
            ctx.beginPath();
            ctx.arc(inX, inY, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = Math.max(0, pe.inwardsOpacity) * 0.15;
            ctx.beginPath();
            ctx.arc(inX, inY, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Escaping particle (bright, high speed)
          pe.escapeVx = Math.cos(pe.escapeAngle) * pe.escapeSpeed * 3;
          pe.escapeVy = Math.sin(pe.escapeAngle) * pe.escapeSpeed * 3 * 0.3;
          pe.escapeX += pe.escapeVx;
          pe.escapeY += pe.escapeVy;
          pe.escapeOpacity -= 0.008;

          if (pe.escapeOpacity > 0) {
            ctx.save();
            // Bright escape particle
            ctx.globalAlpha = pe.escapeOpacity;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pe.escapeX, pe.escapeY, pe.escapeSize, 0, Math.PI * 2);
            ctx.fill();
            // Energy gain glow (bright blue-white)
            ctx.globalAlpha = pe.escapeOpacity * 0.4;
            const escGrad = ctx.createRadialGradient(pe.escapeX, pe.escapeY, 0, pe.escapeX, pe.escapeY, Math.max(1, pe.escapeSize * 5));
            escGrad.addColorStop(0, 'rgba(200,220,255,1)');
            escGrad.addColorStop(0.3, 'rgba(6,214,160,0.5)');
            escGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = escGrad;
            ctx.beginPath();
            ctx.arc(pe.escapeX, pe.escapeY, Math.max(1, pe.escapeSize * 5), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          if (pe.inwardsOpacity <= 0 && pe.escapeOpacity <= 0) {
            penroseRef.current.splice(pi, 1);
          }
        }
      }

      if (penroseRef.current.length > 5) {
        penroseRef.current.splice(0, 2);
      }

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

      // === JETS (evolved: with precession) ===
      if (wormholeIntensity > 0.05) {
        drawJet(ctx, cx, cy, bhRadius, t, wormholeIntensity, -1, jetPrecessionAngle);
        drawJet(ctx, cx, cy, bhRadius, t, wormholeIntensity, 1, jetPrecessionAngle);
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

      // === GRAVITATIONAL WAVE RIPPLES (topmost layer) ===
      {
        if (t - lastGravWaveRef.current > 3 && wormholeIntensity > 0.05) {
          lastGravWaveRef.current = t;
          if (gravWaveRef.current.length < 3) {
            gravWaveRef.current.push({
              radius: eventHorizon * 1.2,
              opacity: 0.12,
              speed: 40 + Math.random() * 20,
              amplitude: 3 + Math.random() * 3,
              freq: 6 + Math.random() * 4,
            });
          }
        }

        for (let gi = gravWaveRef.current.length - 1; gi >= 0; gi--) {
          const gw = gravWaveRef.current[gi];
          gw.radius += gw.speed * 0.016;
          gw.opacity -= 0.0008;
          if (gw.opacity <= 0 || gw.radius > Math.min(w, h) * 0.45) {
            gravWaveRef.current.splice(gi, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = gw.opacity;
          ctx.strokeStyle = 'rgba(130,100,200,1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          const gwSteps = 120;
          for (let gwi = 0; gwi <= gwSteps; gwi++) {
            const gwAngle = (gwi / gwSteps) * Math.PI * 2;
            const gwR = gw.radius + Math.sin(gwAngle * gw.freq + t * gw.speed * 0.05) * gw.amplitude;
            const gwx = cx + Math.cos(gwAngle) * gwR;
            const gwy = cy + Math.sin(gwAngle) * gwR;
            if (gwi === 0) ctx.moveTo(gwx, gwy);
            else ctx.lineTo(gwx, gwy);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
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
      aria-label="Buraco negro evoluido com ergosfera, aneis de fotons multiples, ISCO, processo de Penrose, precessao de jatos e espalhamento superradiante"
    />
  );
}