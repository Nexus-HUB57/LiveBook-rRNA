'use client';

import { useEffect, useRef, useState } from 'react';

interface GraphNode {
  id: string;
  label: string;
  category: 'core' | 'rag' | 'quantum' | 'narrative' | 'vault' | 'agent';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  connections: string[];
  pulsePhase: number;
  active: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  core: '#fbbf24',
  rag: '#a855f7',
  quantum: '#06d6a0',
  narrative: '#e040a0',
  vault: '#8b5cf6',
  agent: '#fbbf24',
};

const INITIAL_NODES: Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy' | 'pulsePhase' | 'active'>[] = [
  { id: 'meta', label: 'MetaTempo', category: 'core', size: 22, connections: ['rag-core', 'claude', 'fable', 'vault-hub', 'quantum-bridge'] },
  { id: 'rag-core', label: 'RAG Engine', category: 'rag', size: 18, connections: ['meta', 'vector-db', 'embeddings', 'retriever', 'claude'] },
  { id: 'vector-db', label: 'Vector DB', category: 'rag', size: 14, connections: ['rag-core', 'embeddings', 'vault-hub'] },
  { id: 'embeddings', label: 'Embeddings', category: 'rag', size: 13, connections: ['rag-core', 'vector-db', 'quantum-bridge'] },
  { id: 'retriever', label: 'Retriever', category: 'rag', size: 14, connections: ['rag-core', 'claude', 'fable'] },
  { id: 'claude', label: 'Claude', category: 'agent', size: 17, connections: ['meta', 'rag-core', 'retriever', 'fable', 'prompt-lib'] },
  { id: 'fable', label: 'Fable 5', category: 'narrative', size: 16, connections: ['meta', 'claude', 'retriever', 'narr-core'] },
  { id: 'narr-core', label: 'Narrative Core', category: 'narrative', size: 14, connections: ['fable', 'story-graph', 'vault-hub'] },
  { id: 'story-graph', label: 'Story Graph', category: 'narrative', size: 12, connections: ['narr-core', 'quantum-bridge'] },
  { id: 'quantum-bridge', label: 'Quantum Bridge', category: 'quantum', size: 15, connections: ['meta', 'embeddings', 'story-graph', 'symbiosis'] },
  { id: 'symbiosis', label: 'Simbiose Q', category: 'quantum', size: 13, connections: ['quantum-bridge', 'vault-hub'] },
  { id: 'vault-hub', label: 'Vault Hub', category: 'vault', size: 16, connections: ['meta', 'vector-db', 'narr-core', 'symbiosis', 'obsidian'] },
  { id: 'obsidian', label: 'Obsidian', category: 'vault', size: 14, connections: ['vault-hub', 'git-clone', 'prompt-lib'] },
  { id: 'git-clone', label: 'Git Clone', category: 'vault', size: 12, connections: ['obsidian', 'vault-hub'] },
  { id: 'prompt-lib', label: 'Prompt Lib', category: 'agent', size: 13, connections: ['claude', 'obsidian', 'fable'] },
];

interface ObsidianKnowledgeGraphProps {
  isActive: boolean;
  activeNode?: string;
  onNodeClick?: (nodeId: string) => void;
}

export default function ObsidianKnowledgeGraph({ isActive, activeNode, onNodeClick }: ObsidianKnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const draggedNodeRef = useRef<string | null>(null);
  const animRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

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

    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;

    if (nodesRef.current.length === 0) {
      nodesRef.current = INITIAL_NODES.map((n, i) => ({
        ...n,
        x: w / 2 + (Math.random() - 0.5) * w * 0.5,
        y: h / 2 + (Math.random() - 0.5) * h * 0.5,
        vx: 0,
        vy: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        active: n.id === activeNode,
      }));
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (draggedNodeRef.current) {
        const node = nodesRef.current.find(n => n.id === draggedNodeRef.current);
        if (node) {
          node.vx = 0;
          node.vy = 0;
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const node of nodesRef.current) {
        const dx = node.x - mx;
        const dy = node.y - my;
        if (Math.sqrt(dx * dx + dy * dy) < node.size + 5) {
          draggedNodeRef.current = node.id;
          onNodeClick?.(node.id);
          break;
        }
      }
    };

    const handleMouseUp = () => {
      draggedNodeRef.current = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    let time = 0;
    let hoveredRef: string | null = null;

    const simulate = () => {
      const nodes = nodesRef.current;
      const w2 = canvas.getBoundingClientRect().width;
      const h2 = canvas.getBoundingClientRect().height;
      const cx = w2 / 2;
      const cy = h2 / 2;

      // Center gravity
      nodes.forEach(n => {
        n.vx += (cx - n.x) * 0.0003;
        n.vy += (cy - n.y) * 0.0003;
      });

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          if (dist < 150) {
            const force = (150 - dist) * 0.0003;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
      }

      // Spring connections
      nodes.forEach(n => {
        n.connections.forEach(connId => {
          const target = nodes.find(t => t.id === connId);
          if (!target) return;
          const dx = target.x - n.x;
          const dy = target.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const idealDist = 100;
          const force = (dist - idealDist) * 0.0008;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        });
      });

      // Mouse attraction/repulsion for hovered node
      if (hoveredRef) {
        const node = nodes.find(n => n.id === hoveredRef);
        if (node) {
          const dx = mouseRef.current.x - node.x;
          const dy = mouseRef.current.y - node.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          if (dist > 50) {
            node.vx += (dx / dist) * 0.15;
            node.vy += (dy / dist) * 0.15;
          }
        }
      }

      // Dragging
      if (draggedNodeRef.current) {
        const node = nodes.find(n => n.id === draggedNodeRef.current);
        if (node) {
          node.x = mouseRef.current.x;
          node.y = mouseRef.current.y;
        }
      }

      // Apply velocity with damping
      nodes.forEach(n => {
        if (n.id !== draggedNodeRef.current) {
          n.vx *= 0.92;
          n.vy *= 0.92;
          n.x += n.vx;
          n.y += n.vy;
          // Bounds
          n.x = Math.max(n.size + 10, Math.min(w2 - n.size - 10, n.x));
          n.y = Math.max(n.size + 10, Math.min(h2 - n.size - 10, n.y));
        }
      });
    };

    const draw = () => {
      const w2 = canvas.getBoundingClientRect().width;
      const h2 = canvas.getBoundingClientRect().height;
      ctx.clearRect(0, 0, w2, h2);
      time += 0.008;

      simulate();

      const nodes = nodesRef.current;

      // Update active state
      nodes.forEach(n => {
        n.active = n.id === activeNode;
        n.pulsePhase += 0.03;
      });

      // Draw connections
      nodes.forEach(n => {
        n.connections.forEach(connId => {
          const target = nodes.find(t => t.id === connId);
          if (!target) return;

          const isActiveConn = (n.id === activeNode || target.id === activeNode);
          const isHoveredConn = hoveredRef && (n.id === hoveredRef || target.id === hoveredRef);

          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(target.x, target.y);

          if (isActiveConn) {
            // Animated data flow on active connections
            const dx = target.x - n.x;
            const dy = target.y - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const flowPos = (time * 2) % 1;

            ctx.strokeStyle = `${n.color}44`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Flowing packet
            const px = n.x + dx * flowPos;
            const py = n.y + dy * flowPos;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = n.color;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = n.color + '33';
            ctx.fill();
          } else if (isHoveredConn) {
            ctx.strokeStyle = `${n.color}55`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            ctx.strokeStyle = `rgba(136, 136, 170, ${isActive ? 0.12 : 0.06})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      hoveredRef = null;
      nodes.forEach(n => {
        const dx = n.x - mouseRef.current.x;
        const dy = n.y - mouseRef.current.y;
        const isHovered = Math.sqrt(dx * dx + dy * dy) < n.size + 5;
        if (isHovered) hoveredRef = n.id;

        const pulse = Math.sin(n.pulsePhase) * 0.2 + 0.8;
        const drawSize = n.active ? n.size * 1.3 : isHovered ? n.size * 1.15 : n.size * pulse;

        // Active glow
        if (n.active || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, drawSize + 15, 0, Math.PI * 2);
          const glowGrad = ctx.createRadialGradient(n.x, n.y, drawSize, n.x, n.y, drawSize + 15);
          glowGrad.addColorStop(0, n.color + '30');
          glowGrad.addColorStop(1, n.color + '00');
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, drawSize, 0, Math.PI * 2);
        const nodeGrad = ctx.createRadialGradient(n.x - drawSize * 0.3, n.y - drawSize * 0.3, 0, n.x, n.y, drawSize);
        nodeGrad.addColorStop(0, n.color + (n.active ? 'ee' : isHovered ? 'cc' : '88'));
        nodeGrad.addColorStop(1, n.color + (n.active ? '44' : '22'));
        ctx.fillStyle = nodeGrad;
        ctx.fill();
        ctx.strokeStyle = n.color + (n.active ? 'ff' : isHovered ? 'aa' : '55');
        ctx.lineWidth = n.active ? 2 : 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = n.active || isHovered ? '#ffffff' : '#c0b8d0';
        ctx.font = `${n.active ? 'bold ' : ''}${Math.max(8, n.size * 0.55)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(n.label, n.x, n.y + drawSize + 5);
      });

      setHoveredNode(hoveredRef);
      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isActive, activeNode, onNodeClick]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ cursor: hoveredNode ? 'grab' : 'default' }}
    />
  );
}