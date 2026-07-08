'use client';

import { useEffect, useRef, useState } from 'react';

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
}

export default function TrinuclearSandboxCanvas({ isActive, corePower, syncIntensity }: TrinuclearSandboxCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<EnergyParticle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);

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
      });
    };

    const animate = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);
      time += 0.004;

      // Background grid
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.03)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

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

      // Cross-core inference mesh (dense connections inside triangle)
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

        // Cross-core inference beams
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

      // Central OpenClaw nexus
      const nexusSize = isActive ? 20 + syncIntensity * 15 + Math.sin(time * 4) * 4 : 16;
      const nexusGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, nexusSize + 20);
      nexusGrad.addColorStop(0, `rgba(168, 85, 247, ${isActive ? 0.5 : 0.15})`);
      nexusGrad.addColorStop(0.5, `rgba(224, 64, 160, ${isActive ? 0.2 : 0.05})`);
      nexusGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, nexusSize + 20, 0, Math.PI * 2);
      ctx.fillStyle = nexusGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, nexusSize, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, nexusSize);
      coreGrad.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
      coreGrad.addColorStop(0.7, 'rgba(224, 64, 160, 0.3)');
      coreGrad.addColorStop(1, 'rgba(168, 85, 247, 0.05)');
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Nexus rotating segments
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

      // Lines from nexus to cores
      corePositions.forEach((pos, i) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = CORES[i].glowColor + (isActive ? '22' : '0a');
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.lineDashOffset = -time * 100;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Spawn energy particles
      if (isActive && time - lastSpawn > 0.15) {
        spawnParticle(w, h);
        lastSpawn = time;
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => p.progress <= 1);
      particlesRef.current.forEach(p => {
        p.progress += p.speed;
        const sp = corePositions[p.sourceCore];
        const tp = corePositions[p.targetCore];
        const cpx = (sp.x + tp.x) / 2 + Math.sin(time * 5 + p.sourceCore) * 25;
        const cpy = (sp.y + tp.y) / 2 + Math.cos(time * 5 + p.targetCore) * 25;
        const t = Math.min(p.progress, 1);
        const it = 1 - t;
        p.x = it * it * sp.x + 2 * it * t * cpx + t * t * tp.x;
        p.y = it * it * sp.y + 2 * it * t * cpy + t * t * tp.y;

        // Trail
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

      // Limit particles
      if (particlesRef.current.length > 80) {
        particlesRef.current = particlesRef.current.slice(-80);
      }

      // Draw each core
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

        // Power ring (arc based on power)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, coreSize + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * power);
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

        // Inner icon (simplified)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = ['▶', '△', '●'];
        ctx.fillText(icons[i], pos.x, pos.y);

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