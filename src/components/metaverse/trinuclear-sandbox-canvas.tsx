'use client';

import { useEffect, useRef } from 'react';

interface CoreDef {
  id: 'ollama' | 'llama4' | 'openai';
  label: string;
  sublabel: string;
  color: string;
  glowColor: string;
  angle: number;
}

const CORES: CoreDef[] = [
  { id: 'ollama', label: 'Ollama', sublabel: 'Local Runtime', color: '#06d6a0', glowColor: 'rgba(6,214,160,', angle: -Math.PI / 2 },
  { id: 'llama4', label: 'Llama 4', sublabel: 'Maverick', color: '#fbbf24', glowColor: 'rgba(251,191,36,', angle: Math.PI / 6 },
  { id: 'openai', label: 'OpenAI', sublabel: 'Native API', color: '#e040a0', glowColor: 'rgba(224,64,160,', angle: (5 * Math.PI) / 6 },
];

interface TrinuclearSandboxCanvasProps {
  isActive: boolean;
  corePower: Record<string, number>;
  syncIntensity: number;
}

interface EnergyParticle {
  x: number;
  y: number;
  targetCore: number;
  sourceCore: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
  trail: { x: number; y: number }[];
}

interface PulseWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface CoreThroughput {
  values: number[];
}

export default function TrinuclearSandboxCanvas({ isActive, corePower, syncIntensity }: TrinuclearSandboxCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<EnergyParticle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);
  const pulseWavesRef = useRef<PulseWave[]>([]);
  const ambientParticlesRef = useRef<AmbientParticle[]>([]);
  const coreThroughputRef = useRef<CoreThroughput[]>(
    CORES.map(() => ({ values: [0, 0, 0, 0, 0] }))
  );
  const prevPowerRef = useRef<Record<string, number>>({});
  const coreSatellitesRef = useRef<{ angle: number; speed: number; distance: number }[][]>(
    CORES.map(() => {
      const sats: { angle: number; speed: number; distance: number }[] = [];
      for (let i = 0; i < 3; i++) {
        sats.push({
          angle: (Math.PI * 2 / 3) * i,
          speed: 0.8 + Math.random() * 0.6,
          distance: 42 + Math.random() * 8,
        });
      }
      return sats;
    })
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    let time = 0;
    let lastSpawn = 0;
    let lastThroughputUpdate = 0;

    // Initialize ambient particles
    if (ambientParticlesRef.current.length === 0) {
      for (let i = 0; i < 40; i++) {
        ambientParticlesRef.current.push({
          x: Math.random() * 2000,
          y: Math.random() * 2000,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          size: 0.5 + Math.random() * 1,
          alpha: 0.05 + Math.random() * 0.1,
        });
      }
    }

    const getCorePos = (coreIdx: number, w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.28;
      const angle = CORES[coreIdx].angle + time * 0.08;
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    };

    const spawnParticle = (w: number, h: number) => {
      const source = Math.floor(Math.random() * 3);
      let target = Math.floor(Math.random() * 3);
      while (target === source) target = Math.floor(Math.random() * 3);
      const sp = getCorePos(source, w, h);
      const colors = ['#06d6a0', '#fbbf24', '#e040a0'];
      particlesRef.current.push({
        x: sp.x,
        y: sp.y,
        sourceCore: source,
        targetCore: target,
        progress: 0,
        speed: 0.008 + Math.random() * 0.012,
        color: colors[source],
        size: 2 + Math.random() * 2.5,
        trail: [],
      });
    };

    // Draw hexagonal grid
    const drawHexGrid = (w: number, h: number) => {
      const hexSize = 30;
      const hexH = hexSize * Math.sqrt(3);
      const hexW = hexSize * 2;

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.025)';
      ctx.lineWidth = 0.5;

      for (let row = -1; row < h / hexH + 1; row++) {
        for (let col = -1; col < w / hexW + 1; col++) {
          const offsetX = row % 2 !== 0 ? hexW * 0.75 : 0;
          const cx = col * hexW * 1.5 + offsetX;
          const cy = row * hexH;

          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const hx = cx + hexSize * Math.cos(angle);
            const hy = cy + hexSize * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    };

    // Draw ambient particles
    const drawAmbientParticles = (w: number, h: number) => {
      ambientParticlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
        ctx.fill();
      });
    };

    // Draw orbital data streams
    const drawOrbitalStreams = (cx: number, cy: number, w: number, h: number) => {
      if (!isActive) return;
      const baseRadius = Math.min(w, h) * 0.18;
      const streamColors = ['#06d6a0', '#fbbf24', '#e040a0'];
      const streamAlphas = [0.12, 0.1, 0.12];

      for (let s = 0; s < 3; s++) {
        const rx = baseRadius + s * 25;
        const ry = baseRadius * 0.45 + s * 12;
        const rotation = s * 0.4 + time * 0.3 * (s % 2 === 0 ? 1 : -1);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        // Draw elliptical path
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = streamColors[s];
        ctx.globalAlpha = streamAlphas[s] * syncIntensity;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 8]);
        ctx.lineDashOffset = -time * 60 * (s % 2 === 0 ? 1 : -1);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Flowing dots along the path
        const numDots = 3 + s;
        for (let d = 0; d < numDots; d++) {
          const dotAngle = (Math.PI * 2 / numDots) * d + time * (1.2 + s * 0.3) * (s % 2 === 0 ? 1 : -1);
          const dx = Math.cos(dotAngle) * rx;
          const dy = Math.sin(dotAngle) * ry;

          ctx.beginPath();
          ctx.arc(dx, dy, 1.5 + Math.sin(time * 3 + d) * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = streamColors[s];
          ctx.globalAlpha = 0.6 * syncIntensity;
          ctx.fill();

          // Glow
          ctx.beginPath();
          ctx.arc(dx, dy, 5, 0, Math.PI * 2);
          ctx.fillStyle = streamColors[s];
          ctx.globalAlpha = 0.1 * syncIntensity;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        ctx.restore();
      }
    };

    // Draw pulse waves
    const updateAndDrawPulseWaves = () => {
      pulseWavesRef.current = pulseWavesRef.current.filter(pw => pw.alpha > 0.01);
      pulseWavesRef.current.forEach(pw => {
        pw.radius += 2.5;
        pw.alpha *= 0.96;

        ctx.beginPath();
        ctx.arc(pw.x, pw.y, pw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = pw.color;
        ctx.globalAlpha = pw.alpha;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    };

    // Check for power changes and emit pulse waves
    const checkPowerChanges = (corePositions: { x: number; y: number }[]) => {
      CORES.forEach((core, i) => {
        const currentPower = corePower[core.id] || 0;
        const prevPower = prevPowerRef.current[core.id] || 0;
        if (Math.abs(currentPower - prevPower) > 0.15 && currentPower > 0.1) {
          pulseWavesRef.current.push({
            x: corePositions[i].x,
            y: corePositions[i].y,
            radius: 30,
            maxRadius: 120,
            color: core.color,
            alpha: 0.6,
          });
        }
        prevPowerRef.current[core.id] = currentPower;
      });
    };

    // Draw core satellites
    const drawCoreSatellites = (pos: { x: number; y: number }, coreIdx: number, core: CoreDef) => {
      const sats = coreSatellitesRef.current[coreIdx];
      sats.forEach((sat, si) => {
        sat.angle += sat.speed * 0.01;
        const sx = pos.x + Math.cos(sat.angle) * sat.distance;
        const sy = pos.y + Math.sin(sat.angle) * sat.distance;

        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 + si * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = core.color;
        ctx.globalAlpha = 0.7;
        ctx.fill();

        // Satellite orbit line
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, sat.distance, sat.angle, sat.angle + 0.8);
        ctx.strokeStyle = core.color;
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    };

    // Draw tiny bar chart inside core
    const drawCoreBarChart = (pos: { x: number; y: number }, coreIdx: number, core: CoreDef) => {
      const throughput = coreThroughputRef.current[coreIdx];
      const barW = 3;
      const barGap = 1;
      const totalW = throughput.values.length * (barW + barGap);
      const startX = pos.x - totalW / 2;
      const baseY = pos.y + 8;
      const maxBarH = 10;

      throughput.values.forEach((val, i) => {
        const barH = Math.max(1, (val / 80) * maxBarH);
        const x = startX + i * (barW + barGap);

        ctx.fillStyle = core.color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, baseY - barH, barW, barH);
        ctx.globalAlpha = 1;
      });
    };

    const animate = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);
      time += 0.004;

      // Hexagonal grid background
      drawHexGrid(w, h);

      // Ambient particles
      drawAmbientParticles(w, h);

      // Triangle connections between cores
      const corePositions = CORES.map((_, i) => getCorePos(i, w, h));

      // Mesh fill with animated gradient
      ctx.beginPath();
      ctx.moveTo(corePositions[0].x, corePositions[0].y);
      ctx.lineTo(corePositions[1].x, corePositions[1].y);
      ctx.lineTo(corePositions[2].x, corePositions[2].y);
      ctx.closePath();
      const triAlpha = isActive ? 0.02 + syncIntensity * 0.05 : 0.01;
      const triGrad = ctx.createLinearGradient(
        corePositions[0].x, corePositions[0].y,
        corePositions[2].x, corePositions[2].y
      );
      triGrad.addColorStop(0, `rgba(6, 214, 160, ${triAlpha})`);
      triGrad.addColorStop(0.5, `rgba(168, 85, 247, ${triAlpha * 1.5})`);
      triGrad.addColorStop(1, `rgba(224, 64, 160, ${triAlpha})`);
      ctx.fillStyle = triGrad;
      ctx.fill();

      // Cross-core inference mesh
      if (isActive && syncIntensity > 0.2) {
        const meshPoints = 12;
        for (let m = 0; m < meshPoints; m++) {
          const t1 = Math.random();
          const t2 = Math.random() * (1 - t1);
          const t3 = 1 - t1 - t2;
          const mx = corePositions[0].x * t1 + corePositions[1].x * t2 + corePositions[2].x * t3;
          const my = corePositions[0].y * t1 + corePositions[1].y * t2 + corePositions[2].y * t3;
          ctx.beginPath();
          ctx.arc(mx, my, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168, 85, 247, ${syncIntensity * 0.15})`;
          ctx.fill();
        }

        if (syncIntensity > 0.5) {
          for (let c = 0; c < 3; c++) {
            const target = (c + 1) % 3;
            const src = corePositions[c];
            const tgt = corePositions[target];
            const beamProgress = ((time * 3 + c) % 1);
            const bpx = src.x + (tgt.x - src.x) * beamProgress;
            const bpy = src.y + (tgt.y - src.y) * beamProgress;
            ctx.save();
            ctx.globalAlpha = syncIntensity * 0.6;
            ctx.fillStyle = CORES[c].color;
            ctx.beginPath();
            ctx.arc(bpx, bpy, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = syncIntensity * 0.15;
            ctx.beginPath();
            ctx.arc(bpx, bpy, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // Triangle edges
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3;
        ctx.beginPath();
        ctx.moveTo(corePositions[i].x, corePositions[i].y);
        ctx.lineTo(corePositions[j].x, corePositions[j].y);
        const edgeAlpha = isActive ? 0.15 + syncIntensity * 0.2 : 0.06;
        ctx.strokeStyle = `rgba(168, 85, 247, ${edgeAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Orbital data streams around nexus
      drawOrbitalStreams(cx, cy, w, h);

      // Central OpenClaw nexus - enhanced
      const nexusSize = isActive ? 20 + syncIntensity * 15 + Math.sin(time * 4) * 4 : 16;

      // Outer glow
      const nexusGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, nexusSize + 25);
      nexusGrad.addColorStop(0, `rgba(168, 85, 247, ${isActive ? 0.5 : 0.15})`);
      nexusGrad.addColorStop(0.5, `rgba(224, 64, 160, ${isActive ? 0.2 : 0.05})`);
      nexusGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, nexusSize + 25, 0, Math.PI * 2);
      ctx.fillStyle = nexusGrad;
      ctx.fill();

      // Core body
      ctx.beginPath();
      ctx.arc(cx, cy, nexusSize, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, nexusSize);
      coreGrad.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
      coreGrad.addColorStop(0.7, 'rgba(224, 64, 160, 0.3)');
      coreGrad.addColorStop(1, 'rgba(168, 85, 247, 0.05)');
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Rotating hexagonal wireframe
      const hexRadius = nexusSize + 8;
      const hexRotation = time * 1.5;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(hexRotation);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const hx = Math.cos(a) * hexRadius;
        const hy = Math.sin(a) * hexRadius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(168, 85, 247, ${isActive ? 0.35 : 0.1})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // Inner rotating triangle (counter-rotating)
      const triRadius = nexusSize * 0.55;
      const triRotation = -time * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(triRotation);
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
        const tx = Math.cos(a) * triRadius;
        const ty = Math.sin(a) * triRadius;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(6, 214, 160, ${isActive ? 0.4 : 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Nexus rotating segments (existing)
      for (let i = 0; i < 6; i++) {
        const segAngle = time * 3 + (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.arc(cx, cy, nexusSize + 5, segAngle, segAngle + 0.5);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(6, 214, 160, 0.4)' : 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Nexus label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OPENCLAW', cx, cy - 3);
      ctx.font = '7px monospace';
      ctx.fillStyle = '#8888aa';
      ctx.fillText('SANDBOX', cx, cy + 8);

      // Data throughput text near nexus
      if (isActive) {
        const throughput = Object.values(corePower).reduce((s, v) => s + v, 0);
        const tpsValue = (throughput * 120 + Math.sin(time * 5) * 10).toFixed(0);
        ctx.font = '7px monospace';
        ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText(`${tpsValue} tok/s`, cx, cy + nexusSize + 22);
      }

      // Enhanced energy beams from nexus to each core (thicker, more visible)
      corePositions.forEach((pos, i) => {
        // Thick gradient beam
        const beamGrad = ctx.createLinearGradient(cx, cy, pos.x, pos.y);
        beamGrad.addColorStop(0, CORES[i].glowColor + (isActive ? '30' : '08'));
        beamGrad.addColorStop(0.5, CORES[i].glowColor + (isActive ? '18' : '04'));
        beamGrad.addColorStop(1, CORES[i].glowColor + (isActive ? '30' : '08'));

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = isActive ? 3 : 1;
        ctx.stroke();

        // Dashed overlay
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = CORES[i].glowColor + (isActive ? '25' : '0a');
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.lineDashOffset = -time * 100;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Spawn energy particles (faster spawn when active)
      const spawnRate = isActive ? 0.08 : 0.15;
      if (isActive && time - lastSpawn > spawnRate) {
        spawnParticle(w, h);
        lastSpawn = time;
      }

      // Update and draw particles with trails
      particlesRef.current = particlesRef.current.filter(p => p.progress <= 1);
      particlesRef.current.forEach(p => {
        // Store trail position
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 4) p.trail.shift();

        p.progress += p.speed;
        const sp = corePositions[p.sourceCore];
        const tp = corePositions[p.targetCore];
        const cpx = (sp.x + tp.x) / 2 + Math.sin(time * 5 + p.sourceCore) * 25;
        const cpy = (sp.y + tp.y) / 2 + Math.cos(time * 5 + p.targetCore) * 25;
        const t = Math.min(p.progress, 1);
        const it = 1 - t;
        p.x = it * it * sp.x + 2 * it * t * cpx + t * t * tp.x;
        p.y = it * it * sp.y + 2 * it * t * cpy + t * t * tp.y;

        // Draw fading trail
        if (p.trail.length > 1) {
          for (let ti = 0; ti < p.trail.length - 1; ti++) {
            const trailAlpha = ((ti + 1) / p.trail.length) * 0.2;
            const trailSize = p.size * ((ti + 1) / p.trail.length) * 0.7;
            ctx.beginPath();
            ctx.arc(p.trail[ti].x, p.trail[ti].y, trailSize, 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.floor(trailAlpha * 255).toString(16).padStart(2, '0');
            ctx.fill();
          }
        }

        // Outer glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '18';
        ctx.fill();

        // Particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      // Limit particles to 150
      if (particlesRef.current.length > 150) {
        particlesRef.current = particlesRef.current.slice(-150);
      }

      // Check for power changes and emit pulse waves
      checkPowerChanges(corePositions);

      // Draw pulse waves
      updateAndDrawPulseWaves();

      // Update core throughput data every ~1 second
      if (time - lastThroughputUpdate > 1) {
        lastThroughputUpdate = time;
        CORES.forEach((core, i) => {
          const power = corePower[core.id] || 0;
          const throughput = coreThroughputRef.current[i];
          throughput.values.shift();
          throughput.values.push(power * 80 + Math.sin(time * 2 + i) * 10);
        });
      }

      // Draw each core with enhancements
      CORES.forEach((core, i) => {
        const pos = corePositions[i];
        const power = corePower[core.id] || 0.5;
        const coreSize = 28 + power * 18;
        const pulse = Math.sin(time * 3 + i * 2) * 0.15 + 0.85;

        // Outer ring
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, coreSize + 12, 0, Math.PI * 2);
        ctx.strokeStyle = core.glowColor + (isActive ? '30' : '12');
        ctx.lineWidth = 1;
        ctx.stroke();

        // Power ring with smooth easing
        const easedPower = power < 0.5
          ? 2 * power * power
          : 1 - Math.pow(-2 * power + 2, 2) / 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, coreSize + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * easedPower);
        ctx.strokeStyle = core.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Core glow
        const glowGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, coreSize);
        glowGrad.addColorStop(0, core.glowColor + `${0.5 * pulse * (0.5 + power * 0.5)})`);
        glowGrad.addColorStop(0.6, core.glowColor + `${0.15 * pulse})`);
        glowGrad.addColorStop(1, core.glowColor + '00)');
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Core inner circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, coreSize * 0.6, 0, Math.PI * 2);
        const innerGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, coreSize * 0.6);
        innerGrad.addColorStop(0, core.glowColor + 'aa');
        innerGrad.addColorStop(1, core.glowColor + '22');
        ctx.fillStyle = innerGrad;
        ctx.fill();

        // Inner icon (simplified, no emoji)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = ['>', 'v', '*'];
        ctx.fillText(icons[i], pos.x, pos.y);

        // Core satellites
        if (isActive) {
          drawCoreSatellites(pos, i, core);
        }

        // Tiny bar chart inside core
        if (isActive) {
          drawCoreBarChart(pos, i, core);
        }

        // Labels
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = core.color;
        ctx.fillText(core.label, pos.x, pos.y + coreSize + 18);
        ctx.font = '7px monospace';
        ctx.fillStyle = '#8888aa';
        ctx.fillText(core.sublabel, pos.x, pos.y + coreSize + 29);

        // Power percentage
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = core.color;
        ctx.fillText(`${(power * 100).toFixed(0)}%`, pos.x, pos.y + coreSize + 40);
      });

      // Mouse interaction: repel nearby particles
      if (mouseRef.current.x > 0) {
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 60, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive, corePower, syncIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  );
}