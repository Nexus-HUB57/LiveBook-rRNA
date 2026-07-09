'use client';

import { useEffect, useRef } from 'react';

// ── TYPES ─────────────────────────────────────────────────────────────

interface OrganismCanvasProps {
  vitals: {
    consciousness: number;
    coherence: number;
    metabolism: number;
    entropy: number;
    quantumCoherence: number;
    temporalDistortion: number;
  };
  rRNA: {
    beat: number;
    entanglementStrength: number;
    temporalSync: number;
    generativeImpulse: number;
    determinismFactor: number;
  };
  subsystems: Record<string, { active: boolean; intensity: number }>;
  fusionPhase: 'dormant' | 'fusing' | 'symbiotic' | 'transcendent';
  fusionProgress: number;
  subsystemColors: Record<string, string>;
  subsystemIds: readonly string[];
}

interface CytoplasmParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

interface StreamDot {
  progress: number; // 0 = at organelle, 1 = at center
  speed: number;
}

interface GenerativeParticle {
  angle: number;
  radius: number;
  speed: number;
  life: number;
  maxLife: number;
  hue: number;
  spiralOffset: number;
}

interface TemporalRing {
  radius: number;
  maxRadius: number;
  alpha: number;
  wavePhase: number;
}

// ── ENTANGLEMENT MATRIX (drawn lines) ─────────────────────────────────

const ENTANGLEMENT_PAIRS: [string, string][] = [
  ['wormhole', 'blackhole'],
  ['wormhole', 'quantum-bridge'],
  ['blackhole', 'quantum-bridge'],
  ['blackhole', 'sandbox'],
  ['rag', 'vault'],
  ['rag', 'graph'],
  ['rag', 'fable'],
  ['fable', 'graph'],
  ['sandbox', 'quantum-bridge'],
  ['vault', 'graph'],
];

// ── HELPER ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

// ── COMPONENT ─────────────────────────────────────────────────────────

export default function AgenticOrganismCanvas({
  vitals,
  rRNA,
  subsystems,
  fusionPhase,
  fusionProgress,
  subsystemColors,
  subsystemIds,
}: OrganismCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Mutable particle state
  const cytoParticlesRef = useRef<CytoplasmParticle[]>([]);
  const streamDotsRef = useRef<Record<string, StreamDot[]>>({});
  const genParticlesRef = useRef<GenerativeParticle[]>([]);
  const temporalRingsRef = useRef<TemporalRing[]>([]);
  const prevBeatRef = useRef(0);
  const genSpawnAccRef = useRef(0);
  const ringSpawnAccRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CYTO_COUNT = 65;

    // ── INIT CYTOPLASM PARTICLES ──────────────────────────────────────
    const initCytoplasm = (w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const rx = w * 0.35;
      const ry = h * 0.35;
      const particles: CytoplasmParticle[] = [];
      for (let i = 0; i < CYTO_COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.85;
        particles.push({
          x: cx + Math.cos(a) * rx * r,
          y: cy + Math.sin(a) * ry * r,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: 1 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
        });
      }
      cytoParticlesRef.current = particles;
    };

    // ── INIT STREAM DOTS ──────────────────────────────────────────────
    const initStreamDots = () => {
      const dots: Record<string, StreamDot[]> = {};
      for (const id of subsystemIds) {
        dots[id] = [];
      }
      streamDotsRef.current = dots;
    };

    // ── RESIZE ────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width;
      const h = rect.height;
      sizeRef.current = { w, h };
      initCytoplasm(w, h);
      initStreamDots();
    };

    resize();
    window.addEventListener('resize', resize);

    // ── DRAW LOOP ─────────────────────────────────────────────────────
    const draw = () => {
      timeRef.current += 0.004;
      const t = timeRef.current;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) { animRef.current = requestAnimationFrame(draw); return; }

      const cx = w / 2;
      const cy = h / 2;
      const minDim = Math.min(w, h);

      // Derived intensity
      const phaseIntensity = fusionPhase === 'dormant' ? 0.1
        : fusionPhase === 'fusing' ? 0.3 + fusionProgress / 100 * 0.4
        : fusionPhase === 'symbiotic' ? 0.7 + vitals.consciousness * 0.2
        : 1;

      ctx.clearRect(0, 0, w, h);

      // ═══════════════════════════════════════════════════════════════
      // LAYER 1: BACKGROUND MEMBRANE
      // ═══════════════════════════════════════════════════════════════
      const breathScale = 1 + Math.sin(t * 1.2 + vitals.consciousness * 3) * 0.03 * phaseIntensity;
      const membraneRx = minDim * 0.38 * breathScale * (0.6 + phaseIntensity * 0.4);
      const membraneRy = minDim * 0.36 * breathScale * (0.6 + phaseIntensity * 0.4);
      const membraneAlpha = 0.04 + phaseIntensity * 0.08;
      const pulseAlpha = membraneAlpha + Math.sin(t * 2.5) * 0.02 * phaseIntensity;

      // Outer glow
      ctx.save();
      ctx.globalAlpha = pulseAlpha * 0.5;
      const membraneGlow = ctx.createRadialGradient(cx, cy, minDim * 0.25, cx, cy, membraneRx * 1.15);
      membraneGlow.addColorStop(0, 'rgba(139,92,246,0)');
      membraneGlow.addColorStop(0.7, 'rgba(139,92,246,0.02)');
      membraneGlow.addColorStop(0.9, 'rgba(6,214,160,0.04)');
      membraneGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = membraneGlow;
      ctx.beginPath();
      ctx.ellipse(cx, cy, membraneRx * 1.2, membraneRy * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Membrane ellipse
      ctx.globalAlpha = membraneAlpha;
      const membraneGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, membraneRx);
      membraneGrad.addColorStop(0, 'rgba(139,92,246,0.01)');
      membraneGrad.addColorStop(0.6, 'rgba(20,184,166,0.03)');
      membraneGrad.addColorStop(0.85, 'rgba(139,92,246,0.05)');
      membraneGrad.addColorStop(1, 'rgba(6,214,160,0.08)');
      ctx.fillStyle = membraneGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, membraneRx, membraneRy, 0, 0, Math.PI * 2);
      ctx.fill();

      // Membrane edge
      ctx.globalAlpha = pulseAlpha * 1.5;
      ctx.strokeStyle = 'rgba(139,92,246,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, membraneRx, membraneRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsing edge glow
      ctx.globalAlpha = pulseAlpha * 0.6;
      ctx.strokeStyle = `rgba(6,214,160,${0.1 + Math.sin(t * 3) * 0.05})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, membraneRx + 2, membraneRy + 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ═══════════════════════════════════════════════════════════════
      // LAYER 2: CYTOPLASM NETWORK
      // ═══════════════════════════════════════════════════════════════
      const cytoParticles = cytoParticlesRef.current;
      const metabolismAlpha = 0.15 + vitals.metabolism * 0.6;

      ctx.save();
      ctx.globalAlpha = metabolismAlpha * phaseIntensity;

      // Update & draw connections
      for (let i = 0; i < cytoParticles.length; i++) {
        const p = cytoParticles[i];
        // Brownian motion
        p.vx += (Math.sin(t * 2 + p.phase) * 0.02);
        p.vy += (Math.cos(t * 1.7 + p.phase) * 0.02);
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        // Contain within membrane
        const dx = (p.x - cx) / membraneRx;
        const dy = (p.y - cy) / membraneRy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.9) {
          p.vx -= dx * 0.1;
          p.vy -= dy * 0.1;
        }

        // Draw connections
        for (let j = i + 1; j < cytoParticles.length; j++) {
          const q = cytoParticles[j];
          const ddx = p.x - q.x;
          const ddy = p.y - q.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 60) {
            const lineAlpha = (1 - d / 60) * 0.4;
            ctx.globalAlpha = metabolismAlpha * phaseIntensity * lineAlpha;
            ctx.strokeStyle = 'rgba(180,160,255,0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of cytoParticles) {
        ctx.globalAlpha = metabolismAlpha * phaseIntensity * 0.8;
        ctx.fillStyle = 'rgba(200,180,255,0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ═══════════════════════════════════════════════════════════════
      // LAYER 3: rRNA DOUBLE HELIX
      // ═══════════════════════════════════════════════════════════════
      const helixRotation = t * (0.3 + vitals.consciousness * 0.8) + rRNA.beat * 0.02;
      const helixAlpha = 0.2 + phaseIntensity * 0.8;
      const HELIX_POINTS = 120;
      const BASE_PAIR_INTERVAL = 15; // every ~15 degrees
      const maxHelixRadius = minDim * 0.18;

      ctx.save();

      // Compute helix points
      const strand1: { x: number; y: number; t: number; r: number }[] = [];
      const strand2: { x: number; y: number; t: number; r: number }[] = [];

      for (let i = 0; i < HELIX_POINTS; i++) {
        const angle = (i / HELIX_POINTS) * Math.PI * 8; // 4 full turns
        const r = Math.min(maxHelixRadius, 5 + angle * 0.5);
        const normR = r / maxHelixRadius; // 0-1

        const a1 = angle + helixRotation;
        const x1 = cx + Math.cos(a1) * r;
        const y1 = cy + Math.sin(a1) * r * 0.7; // squish for perspective

        const a2 = angle + Math.PI + helixRotation;
        const x2 = cx + Math.cos(a2) * r;
        const y2 = cy + Math.sin(a2) * r * 0.7;

        strand1.push({ x: x1, y: y1, t: normR, r });
        strand2.push({ x: x2, y: y2, t: normR, r });
      }

      // Draw base pairs first (behind strands)
      for (let i = 0; i < HELIX_POINTS; i += Math.round(HELIX_POINTS / (360 / BASE_PAIR_INTERVAL))) {
        if (i >= HELIX_POINTS) break;
        const p1 = strand1[i];
        const p2 = strand2[i];
        const depth = (Math.sin((i / HELIX_POINTS) * Math.PI * 8 + helixRotation) + 1) / 2;
        const bpAlpha = helixAlpha * (0.15 + depth * 0.25);
        ctx.globalAlpha = bpAlpha;
        ctx.strokeStyle = 'rgba(251,191,36,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw strands
      const drawStrand = (strand: typeof strand1, colorInner: string, colorOuter: string) => {
        for (let i = 1; i < strand.length; i++) {
          const prev = strand[i - 1];
          const curr = strand[i];
          const depth = (Math.sin((i / strand.length) * Math.PI * 8 + helixRotation) + 1) / 2;
          const sAlpha = helixAlpha * (0.3 + depth * 0.7);

          // Width based on depth
          ctx.globalAlpha = sAlpha;
          ctx.strokeStyle = lerpColor(
            hexToRgb(colorInner),
            hexToRgb(colorOuter),
            curr.t
          );
          ctx.lineWidth = 1 + depth * 2;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(curr.x, curr.y);
          ctx.stroke();

          // Glow on prominent sections
          if (depth > 0.7) {
            ctx.globalAlpha = sAlpha * 0.3;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
          }
        }
      };

      // Strand 1: white → cyan (#06d6a0)
      drawStrand(strand1, '#ffffff', '#06d6a0');
      // Strand 2: white → pink (#e040a0)
      drawStrand(strand2, '#ffffff', '#e040a0');

      // Helix center glow
      ctx.globalAlpha = helixAlpha * 0.1;
      const helixGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxHelixRadius);
      helixGlow.addColorStop(0, 'rgba(255,255,255,0.08)');
      helixGlow.addColorStop(0.5, 'rgba(6,214,160,0.03)');
      helixGlow.addColorStop(0.7, 'rgba(224,64,160,0.02)');
      helixGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = helixGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, maxHelixRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // ═══════════════════════════════════════════════════════════════
      // LAYER 4: ORGANELLE NODES
      // ═══════════════════════════════════════════════════════════════
      const organelleRadius = minDim * 0.32;
      const organellePositions: Record<string, { x: number; y: number }> = {};

      ctx.save();
      for (let i = 0; i < subsystemIds.length; i++) {
        const id = subsystemIds[i];
        const sub = subsystems[id] || { active: false, intensity: 0 };
        const angle = (i / subsystemIds.length) * Math.PI * 2 - Math.PI / 2;
        const ox = cx + Math.cos(angle) * organelleRadius;
        const oy = cy + Math.sin(angle) * organelleRadius;
        organellePositions[id] = { x: ox, y: oy };

        const color = subsystemColors[id] || '#888888';
        const rgb = hexToRgb(color);
        const nodeRadius = 8 + sub.intensity * 12;
        const isActive = sub.active;
        const pulse = isActive ? Math.sin(t * 3 + i * 0.8) * 0.3 + 0.7 : 0.3;

        // Cytoplasmic stream line (organelle → center)
        ctx.globalAlpha = (isActive ? 0.12 + sub.intensity * 0.15 : 0.04) * phaseIntensity;
        ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.2)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -t * 30;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Traveling dots along stream (organelle → center)
        const dots = streamDotsRef.current[id] || [];
        if (isActive && sub.intensity > 0.1) {
          // Spawn new dots
          if (Math.random() < sub.intensity * 0.15) {
            dots.push({ progress: 0, speed: 0.005 + sub.intensity * 0.015 });
          }
          // Update and draw
          for (let d = dots.length - 1; d >= 0; d--) {
            const dot = dots[d];
            dot.progress += dot.speed;
            if (dot.progress >= 1) {
              dots.splice(d, 1);
              continue;
            }
            const dx = ox + (cx - ox) * dot.progress;
            const dy = oy + (cy - oy) * dot.progress;
            ctx.globalAlpha = (1 - dot.progress) * 0.8 * phaseIntensity;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(dx, dy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        streamDotsRef.current[id] = dots;

        // Outer glow
        if (isActive) {
          ctx.globalAlpha = pulse * 0.15 * phaseIntensity;
          const nodeGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, nodeRadius * 3);
          nodeGlow.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.2)`);
          nodeGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = nodeGlow;
          ctx.beginPath();
          ctx.arc(ox, oy, nodeRadius * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node body
        ctx.globalAlpha = (isActive ? pulse : 0.25) * phaseIntensity;
        const nodeGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, nodeRadius);
        nodeGrad.addColorStop(0, `rgba(${Math.min(255, rgb[0] + 80)},${Math.min(255, rgb[1] + 80)},${Math.min(255, rgb[2] + 80)},1)`);
        nodeGrad.addColorStop(0.6, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`);
        nodeGrad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.4)`);
        ctx.fillStyle = nodeGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, nodeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Label
        const label = id.substring(0, 1).toUpperCase() + id.substring(1, Math.min(id.length, 8));
        ctx.globalAlpha = (isActive ? 0.8 : 0.3) * phaseIntensity;
        ctx.fillStyle = '#e2d9f3';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, ox, oy + nodeRadius + 14);
      }
      ctx.restore();

      // ═══════════════════════════════════════════════════════════════
      // LAYER 5: CENTRAL NUCLEUS
      // ═══════════════════════════════════════════════════════════════
      const heartbeatPulse = (rRNA.beat % 20 === 0) ? 5 : 0;
      const nucleusScale = 0.5 + phaseIntensity * 0.5;

      ctx.save();

      // Layer 1: outermost glow
      const glow1Radius = (40 + vitals.consciousness * 30 + heartbeatPulse) * nucleusScale;
      ctx.globalAlpha = (0.08 + phaseIntensity * 0.1);
      const nucGlow1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, glow1Radius);
      nucGlow1.addColorStop(0, 'rgba(139,92,246,0.15)');
      nucGlow1.addColorStop(0.5, 'rgba(168,85,247,0.06)');
      nucGlow1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nucGlow1;
      ctx.beginPath();
      ctx.arc(cx, cy, glow1Radius, 0, Math.PI * 2);
      ctx.fill();

      // Layer 2: mid
      const midRadius = (25 + vitals.consciousness * 15 + heartbeatPulse * 0.6) * nucleusScale;
      ctx.globalAlpha = (0.15 + phaseIntensity * 0.3);
      const nucGlow2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, midRadius);
      nucGlow2.addColorStop(0, 'rgba(224,64,160,0.3)');
      nucGlow2.addColorStop(0.4, 'rgba(168,85,247,0.2)');
      nucGlow2.addColorStop(1, 'rgba(139,92,246,0.05)');
      ctx.fillStyle = nucGlow2;
      ctx.beginPath();
      ctx.arc(cx, cy, midRadius, 0, Math.PI * 2);
      ctx.fill();

      // Layer 3: inner core
      const coreRadius = (12 + vitals.consciousness * 8 + heartbeatPulse * 0.3) * nucleusScale;
      ctx.globalAlpha = (0.4 + phaseIntensity * 0.5);
      const nucCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      nucCore.addColorStop(0, 'rgba(255,255,255,0.95)');
      nucCore.addColorStop(0.3, 'rgba(251,191,36,0.7)');
      nucCore.addColorStop(0.7, 'rgba(224,64,160,0.3)');
      nucCore.addColorStop(1, 'rgba(168,85,247,0.05)');
      ctx.fillStyle = nucCore;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Trinuclear geometric pattern (transcendent)
      if (fusionPhase === 'transcendent') {
        const geoRadius = coreRadius * 0.7;
        const geoRotation = t * 0.5;

        // Hexagon
        ctx.globalAlpha = 0.4 + Math.sin(t * 2) * 0.2;
        ctx.strokeStyle = 'rgba(251,191,36,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) {
          const ga = (i / 6) * Math.PI * 2 + geoRotation;
          const gx = cx + Math.cos(ga) * geoRadius;
          const gy = cy + Math.sin(ga) * geoRadius;
          if (i === 0) ctx.moveTo(gx, gy);
          else ctx.lineTo(gx, gy);
        }
        ctx.stroke();

        // Triangle (inverted, rotating opposite)
        ctx.globalAlpha = 0.3 + Math.sin(t * 2.5) * 0.15;
        ctx.strokeStyle = 'rgba(6,214,160,0.5)';
        ctx.beginPath();
        for (let i = 0; i <= 3; i++) {
          const ga = (i / 3) * Math.PI * 2 + geoRotation * -0.7;
          const gx = cx + Math.cos(ga) * geoRadius * 0.8;
          const gy = cy + Math.sin(ga) * geoRadius * 0.8;
          if (i === 0) ctx.moveTo(gx, gy);
          else ctx.lineTo(gx, gy);
        }
        ctx.stroke();
      }

      // rRNA label
      ctx.globalAlpha = 0.7 + phaseIntensity * 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('rRNA', cx, cy);

      ctx.restore();

      // ═══════════════════════════════════════════════════════════════
      // LAYER 6: ENTANGLEMENT LINES
      // ═══════════════════════════════════════════════════════════════
      if (rRNA.entanglementStrength > 0.05) {
        ctx.save();
        for (const [srcId, tgtId] of ENTANGLEMENT_PAIRS) {
          const srcPos = organellePositions[srcId];
          const tgtPos = organellePositions[tgtId];
          const srcSub = subsystems[srcId];
          const tgtSub = subsystems[tgtId];
          if (!srcPos || !tgtPos || !srcSub || !tgtSub) continue;

          const lineAlpha = rRNA.entanglementStrength * Math.min(srcSub.intensity, tgtSub.intensity) * 0.6;
          if (lineAlpha < 0.02) continue;

          const srcColor = hexToRgb(subsystemColors[srcId] || '#888888');
          const tgtColor = hexToRgb(subsystemColors[tgtId] || '#888888');

          // Curved line
          const midX = (srcPos.x + tgtPos.x) / 2 + Math.sin(t * 1.5 + srcId.length) * 15;
          const midY = (srcPos.y + tgtPos.y) / 2 + Math.cos(t * 1.2 + tgtId.length) * 15;

          // Gradient line
          const lineGrad = ctx.createLinearGradient(srcPos.x, srcPos.y, tgtPos.x, tgtPos.y);
          lineGrad.addColorStop(0, `rgba(${srcColor[0]},${srcColor[1]},${srcColor[2]},${lineAlpha})`);
          lineGrad.addColorStop(1, `rgba(${tgtColor[0]},${tgtColor[1]},${tgtColor[2]},${lineAlpha})`);

          ctx.globalAlpha = lineAlpha;
          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(srcPos.x, srcPos.y);
          ctx.quadraticCurveTo(midX, midY, tgtPos.x, tgtPos.y);
          ctx.stroke();

          // Traveling pulse dot
          const pulsePos = ((t * 0.5 + srcId.charCodeAt(0) * 0.1) % 1 + 1) % 1;
          const px = (1 - pulsePos) * (1 - pulsePos) * srcPos.x + 2 * (1 - pulsePos) * pulsePos * midX + pulsePos * pulsePos * tgtPos.x;
          const py = (1 - pulsePos) * (1 - pulsePos) * srcPos.y + 2 * (1 - pulsePos) * pulsePos * midY + pulsePos * pulsePos * tgtPos.y;
          ctx.globalAlpha = lineAlpha * 1.5;
          ctx.fillStyle = lerpColor(srcColor, tgtColor, pulsePos);
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ═══════════════════════════════════════════════════════════════
      // LAYER 7: GENERATIVE PARTICLES
      // ═══════════════════════════════════════════════════════════════
      if (rRNA.generativeImpulse > 0.1) {
        const genParticles = genParticlesRef.current;

        // Spawn
        genSpawnAccRef.current += rRNA.generativeImpulse * 0.3;
        while (genSpawnAccRef.current >= 1 && genParticles.length < 30) {
          genSpawnAccRef.current -= 1;
          genParticles.push({
            angle: Math.random() * Math.PI * 2,
            radius: coreRadius * 0.5,
            speed: 0.3 + Math.random() * 0.5,
            life: 1,
            maxLife: 1,
            hue: (rRNA.generativeImpulse * 360 + t * 50) % 360,
            spiralOffset: Math.random() * Math.PI * 2,
          });
        }

        ctx.save();
        for (let i = genParticles.length - 1; i >= 0; i--) {
          const p = genParticles[i];
          p.radius += p.speed;
          p.angle += 0.02 * (p.speed * 0.5);
          p.life -= 0.008;

          if (p.life <= 0 || p.radius > membraneRx * 0.95) {
            genParticles.splice(i, 1);
            continue;
          }

          const px = cx + Math.cos(p.angle + p.spiralOffset) * p.radius;
          const py = cy + Math.sin(p.angle + p.spiralOffset) * p.radius * 0.7;
          const hue = (p.hue + p.radius * 0.5) % 360;
          const size = 1.5 + p.life * 2;

          // Particle glow
          ctx.globalAlpha = p.life * 0.2 * phaseIntensity;
          ctx.fillStyle = `hsla(${hue}, 80%, 65%, 0.4)`;
          ctx.beginPath();
          ctx.arc(px, py, size * 3, 0, Math.PI * 2);
          ctx.fill();

          // Particle core
          ctx.globalAlpha = p.life * 0.7 * phaseIntensity;
          ctx.fillStyle = `hsla(${hue}, 90%, 75%, 0.9)`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ═══════════════════════════════════════════════════════════════
      // LAYER 8: TEMPORAL DISTORTION
      // ═══════════════════════════════════════════════════════════════
      if (vitals.temporalDistortion > 0.2) {
        const rings = temporalRingsRef.current;

        // Spawn new ring
        ringSpawnAccRef.current += vitals.temporalDistortion * 0.05;
        while (ringSpawnAccRef.current >= 1) {
          ringSpawnAccRef.current -= 1;
          rings.push({
            radius: coreRadius,
            maxRadius: membraneRx * 1.1,
            alpha: 0.15 + vitals.temporalDistortion * 0.1,
            wavePhase: Math.random() * Math.PI * 2,
          });
        }

        ctx.save();
        for (let i = rings.length - 1; i >= 0; i--) {
          const ring = rings[i];
          ring.radius += 0.8;
          ring.alpha *= 0.995;

          if (ring.alpha < 0.005 || ring.radius > ring.maxRadius) {
            rings.splice(i, 1);
            continue;
          }

          ctx.globalAlpha = ring.alpha * phaseIntensity;
          ctx.strokeStyle = `rgba(99,102,241,${ring.alpha})`;
          ctx.lineWidth = 1;

          // Wavy circle
          ctx.beginPath();
          const segments = 64;
          for (let s = 0; s <= segments; s++) {
            const a = (s / segments) * Math.PI * 2;
            const wave = Math.sin(a * 6 + t * 2 + ring.wavePhase) * 3 * vitals.temporalDistortion;
            const r = ring.radius + wave;
            const rx = cx + Math.cos(a) * r;
            const ry = cy + Math.sin(a) * r * 0.7;
            if (s === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      }

      // Track beat for heartbeat
      prevBeatRef.current = rRNA.beat;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [vitals, rRNA, subsystems, fusionPhase, fusionProgress, subsystemColors, subsystemIds]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      aria-label="Visualizacao do organismo agente unificado com 8 subsistemas de IA"
    />
  );
}