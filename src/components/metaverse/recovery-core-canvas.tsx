'use client';

import { useEffect, useRef, useCallback } from 'react';

interface RNANode {
  x: number;
  y: number;
  z: number;
  type: 'backbone' | 'base' | 'quantum';
  baseColor: [number, number, number];
  phase: number;
  size: number;
  bonded: boolean;
}

interface QuantumLink {
  fromIdx: number;
  toIdx: number;
  strength: number;
  phase: number;
  color: string;
}

const PAIR_COLORS: Record<string, [number, number, number]> = {
  A: [6, 214, 160],    // Adenine - cyan/teal
  U: [224, 64, 160],   // Uracil - magenta
  G: [168, 85, 247],   // Guanine - purple
  C: [251, 191, 36],   // Cytosine - gold
};

export default function RecoveryCoreCanvas({
  recoveryActive,
  recoveryProgress,
  quantumSymbiosis,
}: {
  recoveryActive: boolean;
  recoveryProgress: number;
  quantumSymbiosis: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<RNANode[]>([]);
  const linksRef = useRef<QuantumLink[]>([]);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const hoveredNodeRef = useRef<number>(-1);

  const init = useCallback((w: number, h: number) => {
    sizeRef.current = { w, h };
    const nodes: RNANode[] = [];
    const bases = ['A', 'U', 'G', 'C'];
    const cx = w / 2;
    const cy = h / 2;

    // Double helix rRNA strand
    const strandLength = Math.min(Math.floor(h / 12), 50);
    const helixRadius = Math.min(w, h) * 0.15;
    const verticalSpacing = (h * 0.7) / strandLength;

    for (let i = 0; i < strandLength; i++) {
      const t = (i / strandLength) * Math.PI * 4; // 2 full turns
      const y = cy - (h * 0.35) + i * verticalSpacing;

      // Strand 1
      const x1 = cx + Math.cos(t) * helixRadius;
      const z1 = Math.sin(t);
      const base1 = bases[i % 4];
      nodes.push({
        x: x1, y, z: z1,
        type: 'base',
        baseColor: PAIR_COLORS[base1],
        phase: t,
        size: 3.5 + Math.abs(z1) * 2,
        bonded: true,
      });

      // Backbone 1
      nodes.push({
        x: x1 + Math.cos(t) * 6,
        y,
        z: z1,
        type: 'backbone',
        baseColor: [100, 100, 140],
        phase: t,
        size: 2 + Math.abs(z1),
        bonded: false,
      });

      // Strand 2 (opposite)
      const x2 = cx + Math.cos(t + Math.PI) * helixRadius;
      const z2 = Math.sin(t + Math.PI);
      const base2 = bases[(i + 2) % 4]; // Complementary-ish
      nodes.push({
        x: x2, y, z: z2,
        type: 'base',
        baseColor: PAIR_COLORS[base2],
        phase: t + Math.PI,
        size: 3.5 + Math.abs(z2) * 2,
        bonded: true,
      });

      // Backbone 2
      nodes.push({
        x: x2 + Math.cos(t + Math.PI) * 6,
        y,
        z: z2,
        type: 'backbone',
        baseColor: [100, 100, 140],
        phase: t + Math.PI,
        size: 2 + Math.abs(z2),
        bonded: false,
      });
    }

    // Quantum symbiosis nodes (floating around the helix)
    const quantumCount = 30;
    for (let i = 0; i < quantumCount; i++) {
      nodes.push({
        x: cx + (Math.random() - 0.5) * w * 0.8,
        y: cy + (Math.random() - 0.5) * h * 0.8,
        z: Math.random() * 2 - 1,
        type: 'quantum',
        baseColor: [168, 85, 247],
        phase: Math.random() * Math.PI * 2,
        size: Math.random() * 2 + 1,
        bonded: false,
      });
    }

    nodesRef.current = nodes;

    // Quantum entanglement links
    const links: QuantumLink[] = [];
    const baseNodes = nodes.filter(n => n.type === 'base');
    for (let i = 0; i < baseNodes.length; i += 2) {
      if (i + 1 < baseNodes.length) {
        links.push({
          fromIdx: nodes.indexOf(baseNodes[i]),
          toIdx: nodes.indexOf(baseNodes[i + 1]),
          strength: 0.5 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          color: 'rgba(168,85,247,0.2)',
        });
      }
    }

    // Quantum-to-helix links
    const quantumNodes = nodes.filter(n => n.type === 'quantum');
    for (const qn of quantumNodes) {
      const qi = nodes.indexOf(qn);
      const nearest = baseNodes.reduce((best, bn) => {
        const d = Math.hypot(bn.x - qn.x, bn.y - qn.y);
        return d < best.d ? { idx: nodes.indexOf(bn), d } : best;
      }, { idx: 0, d: Infinity });
      if (nearest.d < 200) {
        links.push({
          fromIdx: qi,
          toIdx: nearest.idx,
          strength: 0.3 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          color: 'rgba(6,214,160,0.15)',
        });
      }
    }
    linksRef.current = links;
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
      if (nodesRef.current.length === 0) init(rect.width, rect.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const nodes = nodesRef.current;
      hoveredNodeRef.current = -1;
      let minDist = 20;
      for (let i = 0; i < nodes.length; i++) {
        const d = Math.hypot(nodes[i].x - mx, nodes[i].y - my);
        if (d < minDist) { minDist = d; hoveredNodeRef.current = i; }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) { animRef.current = requestAnimationFrame(draw); return; }

      const cx = w / 2;
      const cy = h / 2;
      const nodes = nodesRef.current;
      const links = linksRef.current;

      ctx.clearRect(0, 0, w, h);

      const recoveryIntensity = recoveryActive ? recoveryProgress / 100 : 0;
      const symbiosisIntensity = quantumSymbiosis ? Math.min(recoveryIntensity * 1.5, 1) : 0;

      // === BACKGROUND: subtle grid ===
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = '#06d6a0';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = gridSize; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = gridSize; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      // === Recovery scanning line ===
      if (recoveryActive) {
        const scanY = cy - h * 0.35 + (h * 0.7) * (recoveryProgress / 100);
        ctx.save();
        const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
        scanGrad.addColorStop(0, 'rgba(6,214,160,0)');
        scanGrad.addColorStop(0.5, `rgba(6,214,160,${0.3 * recoveryIntensity})`);
        scanGrad.addColorStop(1, 'rgba(6,214,160,0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 30, w, 60);

        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#06d6a0';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);
        ctx.lineDashOffset = -t * 60;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(w, scanY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // === Draw quantum links ===
      for (const link of links) {
        const a = nodes[link.fromIdx];
        const b = nodes[link.toIdx];
        if (!a || !b) continue;

        const linkAlpha = link.strength * (0.5 + Math.sin(t * 2 + link.phase) * 0.3);
        const isVisible = quantumSymbiosis || link.strength > 0.5;
        if (!isVisible && !symbiosisIntensity) continue;

        ctx.save();
        ctx.globalAlpha = linkAlpha * (symbiosisIntensity > 0 ? 0.8 : 0.2);
        ctx.strokeStyle = link.color;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        // Curved quantum link
        const midX = (a.x + b.x) / 2 + Math.sin(t * 3 + link.phase) * 20;
        const midY = (a.y + b.y) / 2 + Math.cos(t * 2 + link.phase) * 15;
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(midX, midY, b.x, b.y);
        ctx.stroke();

        // Traveling pulse
        if (symbiosisIntensity > 0.2) {
          const pulsePos = (Math.sin(t * 4 + link.phase) + 1) / 2;
          const px = (1 - pulsePos) * (1 - pulsePos) * a.x + 2 * (1 - pulsePos) * pulsePos * midX + pulsePos * pulsePos * b.x;
          const py = (1 - pulsePos) * (1 - pulsePos) * a.y + 2 * (1 - pulsePos) * pulsePos * midY + pulsePos * pulsePos * b.y;
          ctx.globalAlpha = symbiosisIntensity * 0.8;
          ctx.fillStyle = '#06d6a0';
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // === Draw nodes (sorted by z for depth) ===
      const sortedIndices = nodes.map((_, i) => i).sort((a, b) => nodes[a].z - nodes[b].z);

      for (const idx of sortedIndices) {
        const node = nodes[idx];
        const isHovered = hoveredNodeRef.current === idx;
        const depthScale = 0.6 + (node.z + 1) * 0.2;

        // Animate quantum nodes
        if (node.type === 'quantum') {
          node.x += Math.sin(t * 0.5 + node.phase) * 0.3;
          node.y += Math.cos(t * 0.7 + node.phase) * 0.2;
        }

        const [cr, cg, cb] = node.baseColor;
        const alpha = (0.4 + Math.abs(node.z) * 0.3) * depthScale;

        ctx.save();

        if (node.type === 'quantum') {
          // Quantum node: ethereal glow
          const qAlpha = alpha * (0.3 + symbiosisIntensity * 0.7);
          ctx.globalAlpha = qAlpha * 0.2;
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size * 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = qAlpha;
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size * depthScale, 0, Math.PI * 2);
          ctx.fill();

          // Quantum state ring
          if (symbiosisIntensity > 0.3) {
            ctx.globalAlpha = symbiosisIntensity * 0.3;
            ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size * 6 + Math.sin(t * 3 + node.phase) * 3, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else {
          // RNA node
          const size = node.size * depthScale * (isHovered ? 1.5 : 1);

          // Recovery glow on base nodes
          if (node.type === 'base' && recoveryActive) {
            const nodeProgress = Math.max(0, Math.min(1, recoveryProgress / 100 * 1.5 - node.phase / (Math.PI * 4)));
            if (nodeProgress > 0) {
              ctx.globalAlpha = nodeProgress * 0.3;
              ctx.fillStyle = '#06d6a0';
              ctx.beginPath();
              ctx.arc(node.x, node.y, size * 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Main node
          ctx.globalAlpha = alpha;
          ctx.fillStyle = node.type === 'backbone'
            ? `rgba(${cr},${cg},${cb},${0.5 + Math.abs(node.z) * 0.3})`
            : `rgb(${cr},${cg},${cb})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
          ctx.fill();

          // Hover effect
          if (isHovered) {
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 6, 0, Math.PI * 2);
            ctx.stroke();

            // Label
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = '#e8e0f0';
            ctx.font = '10px monospace';
            const labels: Record<string, string> = { A: 'Adenina', U: 'Uracila', G: 'Guanina', C: 'Citosina' };
            const colorMap: Record<string, string> = {
              '6,214,160': 'A', '224,64,160': 'U', '168,85,247': 'G', '251,191,36': 'C',
            };
            const key = `${cr},${cg},${cb}`;
            const label = node.type === 'base' ? (labels[colorMap[key]] || 'Base') : 'Backbone rRNA';
            ctx.fillText(label, node.x + size + 8, node.y + 3);
          }
        }
        ctx.restore();
      }

      // === Symbiosis burst effect ===
      if (symbiosisIntensity > 0.8) {
        ctx.save();
        ctx.globalAlpha = (symbiosisIntensity - 0.8) * 2;
        const burstGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.4);
        burstGrad.addColorStop(0, 'rgba(6,214,160,0.08)');
        burstGrad.addColorStop(0.5, 'rgba(168,85,247,0.04)');
        burstGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = burstGrad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animRef.current);
    };
  }, [init, recoveryActive, recoveryProgress, quantumSymbiosis]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      aria-label="Nucleo de processamento ribossomico rRNA com simbiose quantica"
    />
  );
}