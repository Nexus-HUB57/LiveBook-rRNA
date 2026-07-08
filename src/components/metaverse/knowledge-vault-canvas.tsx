'use client';

import { useEffect, useRef, useState } from 'react';

interface VaultFile {
  name: string;
  type: 'keyvault' | 'wallet' | 'key' | 'config' | 'pool' | 'legacy';
  integrity: number;
  status: 'sealed' | 'syncing' | 'active';
  size: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pulsePhase: number;
}

const VAULT_FILES: Omit<VaultFile, 'x' | 'y' | 'vx' | 'vy' | 'pulsePhase' | 'integrity'>[] = [
  { name: 'keyvault_master_backup_2026-01-29.json', type: 'keyvault', status: 'sealed', size: '2.4 ZB', color: '#fbbf24' },
  { name: 'wallets_export.json', type: 'wallet', status: 'sealed', size: '890 YB', color: '#06d6a0' },
  { name: 'Ben_chave.txt', type: 'key', status: 'sealed', size: '128 KB', color: '#a855f7' },
  { name: 'bitcoin-keys-hex-...314453356.txt', type: 'key', status: 'sealed', size: '256 KB', color: '#a855f7' },
  { name: 'derive-keys.yml.txt', type: 'config', status: 'sealed', size: '64 KB', color: '#e040a0' },
  { name: 'pool-keys.zip', type: 'pool', status: 'sealed', size: '1.1 ZB', color: '#8b5cf6' },
  { name: 'Legado Lucas', type: 'legacy', status: 'sealed', size: '∞', color: '#fbbf24' },
];

const TYPE_ICONS: Record<string, string> = {
  keyvault: '◆', wallet: '◈', key: '🗝', config: '⚙', pool: '◉', legacy: '✧',
};

interface KnowledgeVaultCanvasProps {
  isActive: boolean;
  ragPhase: 'idle' | 'indexing' | 'retrieving' | 'generating' | 'streaming';
  onFileActivate: (file: VaultFile) => void;
}

export default function KnowledgeVaultCanvas({ isActive, ragPhase, onFileActivate }: KnowledgeVaultCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filesRef = useRef<VaultFile[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const hoveredFileRef = useRef<number | null>(null);
  const animRef = useRef<number>(0);
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);

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

    // Initialize files in orbital arrangement
    if (filesRef.current.length === 0) {
      const cx = canvas.getBoundingClientRect().width / 2;
      const cy = canvas.getBoundingClientRect().height / 2;
      filesRef.current = VAULT_FILES.map((f, i) => {
        const angle = (i / VAULT_FILES.length) * Math.PI * 2;
        const rx = Math.min(cx, cy) * 0.55;
        const ry = Math.min(cx, cy) * 0.35;
        return {
          ...f,
          x: cx + Math.cos(angle) * rx,
          y: cy + Math.sin(angle) * ry,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          pulsePhase: Math.random() * Math.PI * 2,
          integrity: 85 + Math.random() * 15,
        };
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleClick = () => {
      if (hoveredFileRef.current !== null) {
        onFileActivate(filesRef.current[hoveredFileRef.current]);
      }
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const NEURON_COUNT = 60;
    const neurons: { x: number; y: number; vx: number; vy: number; size: number; connections: number[] }[] = [];
    for (let i = 0; i < NEURON_COUNT; i++) {
      neurons.push({
        x: Math.random() * canvas.getBoundingClientRect().width,
        y: Math.random() * canvas.getBoundingClientRect().height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: 1 + Math.random() * 2.5,
        connections: Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => Math.floor(Math.random() * NEURON_COUNT)),
      });
    }

    let time = 0;

    const animate = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);
      time += 0.005;

      // Neural network background
      neurons.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        n.connections.forEach((targetIdx) => {
          const target = neurons[targetIdx];
          if (!target) return;
          const dx = n.x - target.x;
          const dy = n.y - target.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.08;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });

        const distToCenter = Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2);
        const glow = isActive ? 0.4 + Math.sin(time * 3 + distToCenter * 0.01) * 0.2 : 0.15;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${glow})`;
        ctx.fill();
      });

      // RAG data flow lines during active phases
      if (ragPhase !== 'idle' && filesRef.current.length > 0) {
        const activeFile = filesRef.current[Math.floor(time * 10) % filesRef.current.length];
        const progress = (time * 2) % 1;

        // Draw flowing data stream from file to center
        ctx.beginPath();
        const cp1x = (activeFile.x + cx) / 2 + Math.sin(time * 5) * 40;
        const cp1y = (activeFile.y + cy) / 2 + Math.cos(time * 5) * 40;
        ctx.moveTo(activeFile.x, activeFile.y);
        ctx.quadraticCurveTo(cp1x, cp1y, cx, cy);
        const gradient = ctx.createLinearGradient(activeFile.x, activeFile.y, cx, cy);
        gradient.addColorStop(0, activeFile.color + '40');
        gradient.addColorStop(progress, activeFile.color + 'cc');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 8]);
        ctx.lineDashOffset = -time * 200;
        ctx.stroke();
        ctx.setLineDash([]);

        // Data packets
        for (let p = 0; p < 3; p++) {
          const pp = ((time * 1.5 + p * 0.33) % 1);
          const px = (1 - pp) * (1 - pp) * activeFile.x + 2 * (1 - pp) * pp * cp1x + pp * pp * cx;
          const py = (1 - pp) * (1 - pp) * activeFile.y + 2 * (1 - pp) * pp * cp1y + pp * pp * cy;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = activeFile.color;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fillStyle = activeFile.color + '30';
          ctx.fill();
        }
      }

      // Central RAG processor core
      const coreSize = isActive ? 28 + Math.sin(time * 4) * 6 : 22 + Math.sin(time * 2) * 3;
      const coreGlow = isActive ? 0.6 + Math.sin(time * 3) * 0.3 : 0.2;

      // Outer glow rings
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        const ringR = coreSize + 15 + r * 18;
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${coreGlow * 0.15 / (r + 1)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Core gradient
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
      coreGrad.addColorStop(0, `rgba(168, 85, 247, ${coreGlow})`);
      coreGrad.addColorStop(0.5, `rgba(224, 64, 160, ${coreGlow * 0.5})`);
      coreGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Core text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RAG', cx, cy - 4);
      ctx.font = '7px monospace';
      ctx.fillStyle = '#8888aa';
      ctx.fillText(ragPhase.toUpperCase(), cx, cy + 8);

      // Rotating arc segments around core
      if (isActive) {
        for (let a = 0; a < 4; a++) {
          const startAngle = time * 2 + (a * Math.PI) / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, coreSize + 8, startAngle, startAngle + 0.8);
          ctx.strokeStyle = `rgba(6, 214, 160, ${0.3 + Math.sin(time * 3 + a) * 0.2})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Draw vault files
      hoveredFileRef.current = null;
      filesRef.current.forEach((file, i) => {
        file.pulsePhase += 0.02;

        // Orbital drift
        const targetAngle = (i / filesRef.current.length) * Math.PI * 2 + time * 0.3;
        const rx = Math.min(cx, cy) * 0.55;
        const ry = Math.min(cx, cy) * 0.35;
        const targetX = cx + Math.cos(targetAngle) * rx;
        const targetY = cy + Math.sin(targetAngle) * ry;
        file.x += (targetX - file.x) * 0.01 + file.vx;
        file.y += (targetY - file.y) * 0.01 + file.vy;

        // Mouse interaction
        const dx = file.x - mouseRef.current.x;
        const dy = file.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isHovered = dist < 40;
        if (isHovered) hoveredFileRef.current = i;

        if (dist < 80 && dist > 0) {
          file.vx += (dx / dist) * 0.05;
          file.vy += (dy / dist) * 0.05;
        }
        file.vx *= 0.96;
        file.vy *= 0.96;

        const pulse = Math.sin(file.pulsePhase) * 0.3 + 0.7;
        const nodeSize = isHovered ? 18 : 12;

        // Glow
        ctx.beginPath();
        ctx.arc(file.x, file.y, nodeSize + 10, 0, Math.PI * 2);
        ctx.fillStyle = file.color + (isHovered ? '25' : '10');
        ctx.fill();

        // Node
        ctx.beginPath();
        ctx.arc(file.x, file.y, nodeSize, 0, Math.PI * 2);
        const nodeGrad = ctx.createRadialGradient(file.x, file.y, 0, file.x, file.y, nodeSize);
        nodeGrad.addColorStop(0, file.color + (isHovered ? 'dd' : '88'));
        nodeGrad.addColorStop(1, file.color + '22');
        ctx.fillStyle = nodeGrad;
        ctx.fill();
        ctx.strokeStyle = file.color + (isHovered ? 'ff' : '66');
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = `${isHovered ? 12 : 9}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(TYPE_ICONS[file.type] || '●', file.x, file.y);

        // Label on hover
        if (isHovered) {
          const labelY = file.y - nodeSize - 14;
          ctx.font = '10px monospace';
          const textWidth = ctx.measureText(file.name).width;
          const padding = 8;

          ctx.fillStyle = 'rgba(5, 5, 16, 0.9)';
          ctx.strokeStyle = file.color + '66';
          ctx.lineWidth = 1;
          ctx.beginPath();
          const rx2 = textWidth / 2 + padding;
          const ry2 = 12;
          const bx = file.x - rx2;
          const by = labelY - ry2;
          const bw = rx2 * 2;
          const bh = ry2 * 2;
          const br = 6;
          ctx.moveTo(bx + br, by);
          ctx.lineTo(bx + bw - br, by);
          ctx.arcTo(bx + bw, by, bx + bw, by + br, br);
          ctx.lineTo(bx + bw, by + bh - br);
          ctx.arcTo(bx + bw, by + bh, bx + bw - br, by + bh, br);
          ctx.lineTo(bx + br, by + bh);
          ctx.arcTo(bx, by + bh, bx, by + bh - br, br);
          ctx.lineTo(bx, by + br);
          ctx.arcTo(bx, by, bx + br, by, br);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = file.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(file.name, file.x, labelY);

          // Status badge
          ctx.font = '7px monospace';
          const statusText = `${file.status} · ${file.size}`;
          ctx.fillStyle = '#8888aa';
          ctx.fillText(statusText, file.x, file.y + nodeSize + 12);
        }

        // Connection line to center
        ctx.beginPath();
        ctx.moveTo(file.x, file.y);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = file.color + '12';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Update hover state for React
      if (hoveredFileRef.current !== null) {
        setHoveredFile(filesRef.current[hoveredFileRef.current].name);
      } else {
        setHoveredFile(null);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [isActive, ragPhase, onFileActivate]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ cursor: hoveredFile ? 'pointer' : 'default' }}
    />
  );
}