'use client';

import { useEffect, useRef, useState } from 'react';

interface GraphNode {
  id: string;
  label: string;
  category: 'core' | 'rag' | 'quantum' | 'narrative' | 'vault' | 'agent' | 'infra' | 'pipeline';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  connections: string[];
  pulsePhase: number;
  active: boolean;
  activityHistory: number[];
  edgeWeights: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  core: '#fbbf24',
  rag: '#a855f7',
  quantum: '#06d6a0',
  narrative: '#e040a0',
  vault: '#8b5cf6',
  agent: '#fbbf24',
  infra: '#06b6d4',
  pipeline: '#f97316',
};

const CLUSTER_ZONE_COLORS: Record<string, string> = {
  core: 'rgba(251, 191, 36, 0.04)',
  rag: 'rgba(168, 85, 247, 0.04)',
  quantum: 'rgba(6, 214, 160, 0.04)',
  narrative: 'rgba(224, 64, 160, 0.04)',
  vault: 'rgba(139, 92, 246, 0.04)',
  agent: 'rgba(251, 191, 36, 0.04)',
  infra: 'rgba(6, 182, 212, 0.04)',
  pipeline: 'rgba(249, 115, 22, 0.04)',
};

const CLUSTER_BORDER_COLORS: Record<string, string> = {
  core: 'rgba(251, 191, 36, 0.12)',
  rag: 'rgba(168, 85, 247, 0.12)',
  quantum: 'rgba(6, 214, 160, 0.12)',
  narrative: 'rgba(224, 64, 160, 0.12)',
  vault: 'rgba(139, 92, 246, 0.12)',
  agent: 'rgba(251, 191, 36, 0.12)',
  infra: 'rgba(6, 182, 212, 0.12)',
  pipeline: 'rgba(249, 115, 22, 0.12)',
};

const INITIAL_NODES: Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy' | 'pulsePhase' | 'active' | 'activityHistory' | 'edgeWeights'>[] = [
  // Original 15
  { id: 'meta', label: 'MetaTempo', category: 'core', size: 22, connections: ['rag-core', 'claude', 'fable', 'vault-hub', 'quantum-bridge'], color: '#fbbf24' },
  { id: 'rag-core', label: 'RAG Engine', category: 'rag', size: 18, connections: ['meta', 'vector-db', 'embeddings', 'retriever', 'claude'], color: '#a855f7' },
  { id: 'vector-db', label: 'Vector DB', category: 'rag', size: 14, connections: ['rag-core', 'embeddings', 'vault-hub'], color: '#a855f7' },
  { id: 'embeddings', label: 'Embeddings', category: 'rag', size: 13, connections: ['rag-core', 'vector-db', 'quantum-bridge'], color: '#a855f7' },
  { id: 'retriever', label: 'Retriever', category: 'rag', size: 14, connections: ['rag-core', 'claude', 'fable', 'reranker'], color: '#a855f7' },
  { id: 'claude', label: 'Claude', category: 'agent', size: 17, connections: ['meta', 'rag-core', 'retriever', 'fable', 'prompt-lib'], color: '#fbbf24' },
  { id: 'fable', label: 'Fable 5', category: 'narrative', size: 16, connections: ['meta', 'claude', 'retriever', 'narr-core'], color: '#e040a0' },
  { id: 'narr-core', label: 'Narrative Core', category: 'narrative', size: 14, connections: ['fable', 'story-graph', 'vault-hub'], color: '#e040a0' },
  { id: 'story-graph', label: 'Story Graph', category: 'narrative', size: 12, connections: ['narr-core', 'quantum-bridge'], color: '#e040a0' },
  { id: 'quantum-bridge', label: 'Quantum Bridge', category: 'quantum', size: 15, connections: ['meta', 'embeddings', 'story-graph', 'symbiosis'], color: '#06d6a0' },
  { id: 'symbiosis', label: 'Simbiose Q', category: 'quantum', size: 13, connections: ['quantum-bridge', 'vault-hub'], color: '#06d6a0' },
  { id: 'vault-hub', label: 'Vault Hub', category: 'vault', size: 16, connections: ['meta', 'vector-db', 'narr-core', 'symbiosis', 'obsidian'], color: '#8b5cf6' },
  { id: 'obsidian', label: 'Obsidian', category: 'vault', size: 14, connections: ['vault-hub', 'git-clone', 'prompt-lib'], color: '#8b5cf6' },
  { id: 'git-clone', label: 'Git Clone', category: 'vault', size: 12, connections: ['obsidian', 'vault-hub'], color: '#8b5cf6' },
  { id: 'prompt-lib', label: 'Prompt Lib', category: 'agent', size: 13, connections: ['claude', 'obsidian', 'fable'], color: '#fbbf24' },
  // 13 new nodes
  { id: 'chunker', label: 'Chunker', category: 'pipeline', size: 11, connections: ['rag-core', 'vector-db', 'batch-processor'], color: '#f97316' },
  { id: 'reranker', label: 'Reranker', category: 'pipeline', size: 12, connections: ['retriever', 'rag-core', 'claude'], color: '#f97316' },
  { id: 'memory-buffer', label: 'Memory Buf', category: 'infra', size: 12, connections: ['claude', 'llm-router', 'cache-layer'], color: '#06b6d4' },
  { id: 'context-window', label: 'Context Win', category: 'infra', size: 11, connections: ['claude', 'memory-buffer', 'token-counter'], color: '#06b6d4' },
  { id: 'token-counter', label: 'Token Cnt', category: 'infra', size: 10, connections: ['context-window', 'claude', 'metrics-collector'], color: '#06b6d4' },
  { id: 'llm-router', label: 'LLM Router', category: 'agent', size: 14, connections: ['claude', 'memory-buffer', 'config-manager'], color: '#fbbf24' },
  { id: 'cache-layer', label: 'Cache Layer', category: 'infra', size: 11, connections: ['memory-buffer', 'embed-cache', 'vector-db'], color: '#06b6d4' },
  { id: 'embed-cache', label: 'Embed Cache', category: 'infra', size: 10, connections: ['cache-layer', 'embeddings', 'vector-db'], color: '#06b6d4' },
  { id: 'batch-processor', label: 'Batch Proc', category: 'pipeline', size: 11, connections: ['chunker', 'vector-db', 'logger'], color: '#f97316' },
  { id: 'error-handler', label: 'Error Hndlr', category: 'infra', size: 10, connections: ['rag-core', 'claude', 'logger', 'metrics-collector'], color: '#06b6d4' },
  { id: 'logger', label: 'Logger', category: 'infra', size: 9, connections: ['batch-processor', 'error-handler', 'metrics-collector'], color: '#06b6d4' },
  { id: 'metrics-collector', label: 'Metrics', category: 'infra', size: 10, connections: ['token-counter', 'error-handler', 'logger', 'config-manager'], color: '#06b6d4' },
  { id: 'config-manager', label: 'Config Mgr', category: 'infra', size: 11, connections: ['llm-router', 'metrics-collector', 'rag-core'], color: '#06b6d4' },
];

// Edge weight defaults
const DEFAULT_EDGE_WEIGHTS: Record<string, Record<string, number>> = {};
INITIAL_NODES.forEach(n => {
  DEFAULT_EDGE_WEIGHTS[n.id] = {};
  n.connections.forEach(c => {
    DEFAULT_EDGE_WEIGHTS[n.id][c] = 0.3 + Math.random() * 0.7;
  });
});

interface ObsidianKnowledgeGraphProps {
  isActive: boolean;
  activeNode?: string;
  onNodeClick?: (nodeId: string) => void;
}

// ---- Temporal Edge Interface ----
interface TemporalEdge {
  from: string;
  to: string;
  phase: number;
  speed: number;
  active: boolean;
  dataFlow: number;
}

// Draw a rounded rect using arcTo (no roundRect)
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
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
      nodesRef.current = INITIAL_NODES.map((n) => ({
        ...n,
        x: w / 2 + (Math.random() - 0.5) * w * 0.5,
        y: h / 2 + (Math.random() - 0.5) * h * 0.5,
        vx: 0,
        vy: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        active: n.id === activeNode,
        activityHistory: Array.from({ length: 10 }, () => 0.1 + Math.random() * 0.2),
        edgeWeights: DEFAULT_EDGE_WEIGHTS[n.id] ? { ...DEFAULT_EDGE_WEIGHTS[n.id] } : {},
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

    // Get unique categories in order
    const allCategories = Array.from(new Set(INITIAL_NODES.map(n => n.category)));

    // For curved edges: deterministically decide if an edge is curved
    const edgeIsCurved = new Map<string, boolean>();
    INITIAL_NODES.forEach(n => {
      n.connections.forEach(c => {
        const key = [n.id, c].sort().join('::');
        if (!edgeIsCurved.has(key)) {
          edgeIsCurved.set(key, Math.random() > 0.5);
        }
      });
    });

    // ---- Initialize Temporal Edges (10 edges with traveling packets) ----
    const temporalEdges: TemporalEdge[] = [];
    const edgePairsForTemporal: [string, string][] = [
      ['meta', 'rag-core'],
      ['rag-core', 'claude'],
      ['claude', 'fable'],
      ['rag-core', 'vector-db'],
      ['vault-hub', 'obsidian'],
      ['claude', 'llm-router'],
      ['memory-buffer', 'cache-layer'],
      ['chunker', 'vector-db'],
      ['quantum-bridge', 'symbiosis'],
      ['retriever', 'reranker'],
    ];
    edgePairsForTemporal.forEach(([from, to]) => {
      temporalEdges.push({
        from,
        to,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
        active: false,
        dataFlow: Math.random(),
      });
    });

    // ---- Build adjacency for semantic proximity (2-3 hop neighborhoods) ----
    const buildNeighborhood = (startId: string, maxHops: number): Set<string> => {
      const visited = new Set<string>();
      const queue: { id: string; hops: number }[] = [{ id: startId, hops: 0 }];
      visited.add(startId);
      while (queue.length > 0) {
        const { id: current, hops } = queue.shift()!;
        if (hops >= maxHops) continue;
        const node = INITIAL_NODES.find(n => n.id === current);
        if (!node) continue;
        node.connections.forEach(connId => {
          if (!visited.has(connId)) {
            visited.add(connId);
            queue.push({ id: connId, hops: hops + 1 });
          }
        });
      }
      return visited;
    };

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

      // Repulsion between nodes (reduced for same-cluster)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const sameCluster = nodes[i].category === nodes[j].category;
          const repulsionRadius = sameCluster ? 100 : 150;
          const repulsionForce = sameCluster ? 0.00015 : 0.0003;
          if (dist < repulsionRadius) {
            const force = (repulsionRadius - dist) * repulsionForce;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
      }

      // Category-based attraction (same category nodes attract more strongly)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].category !== nodes[j].category) continue;
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          if (dist > 60 && dist < 250) {
            const force = 0.0004;
            nodes[i].vx += (dx / dist) * force;
            nodes[i].vy += (dy / dist) * force;
            nodes[j].vx -= (dx / dist) * force;
            nodes[j].vy -= (dy / dist) * force;
          }
        }
      }

      // Circular layout bias: nodes tend to arrange by category around a circle
      const categoryAngleMap: Record<string, number> = {};
      allCategories.forEach((cat, idx) => {
        categoryAngleMap[cat] = (idx / allCategories.length) * Math.PI * 2;
      });
      const layoutRadius = Math.min(w2, h2) * 0.3;
      nodes.forEach(n => {
        const targetAngle = categoryAngleMap[n.category] || 0;
        const targetX = cx + Math.cos(targetAngle + time * 0.02) * layoutRadius * 0.4;
        const targetY = cy + Math.sin(targetAngle + time * 0.02) * layoutRadius * 0.4;
        n.vx += (targetX - n.x) * 0.00005;
        n.vy += (targetY - n.y) * 0.00005;
      });

      // Subtle orbital motion
      nodes.forEach(n => {
        const dx = n.x - cx;
        const dy = n.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
          const orbitalSpeed = 0.00003;
          n.vx += (-dy / dist) * orbitalSpeed * dist;
          n.vy += (dx / dist) * orbitalSpeed * dist;
        }
      });

      // Spring connections
      nodes.forEach(n => {
        n.connections.forEach(connId => {
          const target = nodes.find(t => t.id === connId);
          if (!target) return;
          const dx = target.x - n.x;
          const dy = target.y - n.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
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

      // Update active state and activity history
      nodes.forEach(n => {
        n.active = n.id === activeNode;
        n.pulsePhase += 0.03;

        const newActivity = n.active
          ? 0.7 + Math.sin(time * 5) * 0.3
          : 0.1 + Math.sin(n.pulsePhase) * 0.1;
        n.activityHistory.push(newActivity);
        if (n.activityHistory.length > 10) {
          n.activityHistory.shift();
        }
      });

      // ---- Draw cluster zones with pulsing boundaries ----
      const categoryNodes: Record<string, GraphNode[]> = {};
      nodes.forEach(n => {
        if (!categoryNodes[n.category]) categoryNodes[n.category] = [];
        categoryNodes[n.category].push(n);
      });

      Object.entries(categoryNodes).forEach(([category, catNodes]) => {
        if (catNodes.length < 2) return;

        // Compute bounding box with padding
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        catNodes.forEach(n => {
          minX = Math.min(minX, n.x - n.size - 12);
          minY = Math.min(minY, n.y - n.size - 18);
          maxX = Math.max(maxX, n.x + n.size + 12);
          maxY = Math.max(maxY, n.y + n.size + 22);
        });

        const padX = 20;
        const padY = 16;
        const zx = minX - padX;
        const zy = minY - padY;
        const zw = maxX - minX + padX * 2;
        const zh = maxY - minY + padY * 2;
        const zr = 14;

        // Check if any node in this cluster is active
        const hasActiveNode = catNodes.some(n => n.active);
        const pulseAlpha = hasActiveNode
          ? 0.12 + Math.sin(time * 3) * 0.06
          : 0.12;

        ctx.beginPath();
        drawRoundedRect(ctx, zx, zy, zw, zh, zr);

        // Enhanced fill with pulse
        const zoneAlpha = hasActiveNode ? 0.06 + Math.sin(time * 2) * 0.02 : 0.04;
        ctx.fillStyle = CLUSTER_ZONE_COLORS[category] || 'rgba(136, 136, 170, 0.03)';
        ctx.fill();

        // Pulsing border
        ctx.strokeStyle = CLUSTER_BORDER_COLORS[category] || 'rgba(136, 136, 170, 0.08)';
        ctx.lineWidth = hasActiveNode ? 1.5 : 1;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -time * 15;
        ctx.stroke();
        ctx.setLineDash([]);

        // Glow pulse on active cluster border
        if (hasActiveNode) {
          ctx.beginPath();
          drawRoundedRect(ctx, zx - 2, zy - 2, zw + 4, zh + 4, zr + 2);
          const glowColor = CLUSTER_BORDER_COLORS[category] || 'rgba(136, 136, 170, 0.08)';
          ctx.strokeStyle = glowColor.replace(/[\d.]+\)$/, `${0.08 + Math.sin(time * 4) * 0.04})`);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Category label
        ctx.font = '7px monospace';
        ctx.fillStyle = (CATEGORY_COLORS[category] || '#666688') + (hasActiveNode ? 'aa' : '66');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(category.toUpperCase(), zx + 8, zy + 5);
      });

      // ---- Semantic Proximity Regions (gradient fills between close nodes, 2-3 hops) ----
      if (isActive) {
        const drawnRegions = new Set<string>();
        nodes.forEach(n => {
          const neighborhood = buildNeighborhood(n.id, 2);
          neighborhood.forEach(neighborId => {
            const regionKey = [n.id, neighborId].sort().join('::');
            if (drawnRegions.has(regionKey) || n.id === neighborId) return;
            drawnRegions.add(regionKey);

            const neighbor = nodes.find(nn => nn.id === neighborId);
            if (!neighbor) return;

            const dx = neighbor.x - n.x;
            const dy = neighbor.y - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Only draw for reasonably close nodes (within 2-hop semantic neighborhood)
            if (dist < 160 && dist > 20) {
              const regionAlpha = 0.03 + Math.sin(time * 0.5 + n.pulsePhase) * 0.015;
              const midX = (n.x + neighbor.x) / 2;
              const midY = (n.y + neighbor.y) / 2;
              const radius = dist * 0.35;

              // Gradient-filled ellipse between the two nodes
              const grad = ctx.createRadialGradient(midX, midY, 0, midX, midY, radius);
              const blendColor = n.color === neighbor.color ? n.color : '#8888aa';
              // Parse hex color to rgba
              const r = parseInt(blendColor.slice(1, 3), 16);
              const g = parseInt(blendColor.slice(3, 5), 16);
              const b = parseInt(blendColor.slice(5, 7), 16);
              grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${regionAlpha})`);
              grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

              ctx.save();
              ctx.translate(midX, midY);
              ctx.rotate(Math.atan2(dy, dx));
              ctx.scale(dist / (radius * 2), 1);
              ctx.translate(-midX, -midY);
              ctx.beginPath();
              ctx.arc(midX, midY, radius, 0, Math.PI * 2);
              ctx.fillStyle = grad;
              ctx.fill();
              ctx.restore();
            }
          });
        });
      }

      // ---- Quantum pulse wave from active node ----
      if (activeNode) {
        const activeNodeObj = nodes.find(n => n.id === activeNode);
        if (activeNodeObj) {
          const pulseRadius = ((time * 80) % 200);
          const pulseAlpha = Math.max(0, 1 - pulseRadius / 200) * 0.15;
          if (pulseAlpha > 0.01) {
            ctx.beginPath();
            ctx.arc(activeNodeObj.x, activeNodeObj.y, pulseRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(168, 85, 247, ${pulseAlpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            const pulse2 = ((time * 80 + 100) % 200);
            const pulse2Alpha = Math.max(0, 1 - pulse2 / 200) * 0.08;
            if (pulse2Alpha > 0.01) {
              ctx.beginPath();
              ctx.arc(activeNodeObj.x, activeNodeObj.y, pulse2, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(6, 214, 160, ${pulse2Alpha})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }

      // ---- Draw connections with edge weights and curves ----
      const drawnEdges = new Set<string>();
      nodes.forEach(n => {
        n.connections.forEach(connId => {
          const target = nodes.find(t => t.id === connId);
          if (!target) return;

          const edgeKey = [n.id, connId].sort().join('::');
          if (drawnEdges.has(edgeKey)) return;
          drawnEdges.add(edgeKey);

          const isActiveConn = (n.id === activeNode || target.id === activeNode);
          const isHoveredConn = hoveredRef && (n.id === hoveredRef || target.id === hoveredRef);
          const weight = n.edgeWeights[connId] || target.edgeWeights[n.id] || 0.5;
          const isCurved = edgeIsCurved.get(edgeKey) || false;

          const dx = target.x - n.x;
          const dy = target.y - n.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

          if (isActiveConn) {
            // ---- Quantum entanglement visualization ----
            ctx.beginPath();
            if (isCurved) {
              const midX = (n.x + target.x) / 2;
              const midY = (n.y + target.y) / 2;
              const perpX = -(target.y - n.y) / dist * 30;
              const perpY = (target.x - n.x) / dist * 30;
              ctx.moveTo(n.x, n.y);
              ctx.quadraticCurveTo(midX + perpX, midY + perpY, target.x, target.y);
            } else {
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
            }
            ctx.strokeStyle = `${n.color}33`;
            ctx.lineWidth = 0.5;
            ctx.setLineDash([3, 5]);
            ctx.lineDashOffset = -time * 80;
            ctx.stroke();
            ctx.setLineDash([]);

            // Glow line
            ctx.beginPath();
            if (isCurved) {
              const midX = (n.x + target.x) / 2;
              const midY = (n.y + target.y) / 2;
              const perpX = -(target.y - n.y) / dist * 30;
              const perpY = (target.x - n.x) / dist * 30;
              ctx.moveTo(n.x, n.y);
              ctx.quadraticCurveTo(midX + perpX, midY + perpY, target.x, target.y);
            } else {
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
            }
            ctx.strokeStyle = `${n.color}44`;
            ctx.lineWidth = 0.8 + weight * 0.8;
            ctx.stroke();

            // Bidirectional flowing particles (entanglement particles)
            const particleCount = 3;
            for (let pi = 0; pi < particleCount; pi++) {
              const fwdPos = ((time * 1.5 + pi / particleCount) % 1);
              let fwdX: number, fwdY: number;
              if (isCurved) {
                const midX = (n.x + target.x) / 2;
                const midY = (n.y + target.y) / 2;
                const perpX = -(target.y - n.y) / dist * 30;
                const perpY = (target.x - n.x) / dist * 30;
                const t = fwdPos;
                fwdX = (1 - t) * (1 - t) * n.x + 2 * (1 - t) * t * (midX + perpX) + t * t * target.x;
                fwdY = (1 - t) * (1 - t) * n.y + 2 * (1 - t) * t * (midY + perpY) + t * t * target.y;
              } else {
                fwdX = n.x + dx * fwdPos;
                fwdY = n.y + dy * fwdPos;
              }
              ctx.beginPath();
              ctx.arc(fwdX, fwdY, 1.8, 0, Math.PI * 2);
              ctx.fillStyle = n.color;
              ctx.fill();
              ctx.beginPath();
              ctx.arc(fwdX, fwdY, 4, 0, Math.PI * 2);
              ctx.fillStyle = n.color + '22';
              ctx.fill();

              const revPos = ((time * 1.2 + pi / particleCount + 0.5) % 1);
              let revX: number, revY: number;
              if (isCurved) {
                const midX = (n.x + target.x) / 2;
                const midY = (n.y + target.y) / 2;
                const perpX = -(target.y - n.y) / dist * 30;
                const perpY = (target.x - n.x) / dist * 30;
                const t = revPos;
                revX = (1 - t) * (1 - t) * n.x + 2 * (1 - t) * t * (midX + perpX) + t * t * target.x;
                revY = (1 - t) * (1 - t) * n.y + 2 * (1 - t) * t * (midY + perpY) + t * t * target.y;
              } else {
                revX = target.x - dx * revPos;
                revY = target.y - dy * revPos;
              }
              ctx.beginPath();
              ctx.arc(revX, revY, 1.3, 0, Math.PI * 2);
              ctx.fillStyle = target.color + 'cc';
              ctx.fill();
              ctx.beginPath();
              ctx.arc(revX, revY, 3, 0, Math.PI * 2);
              ctx.fillStyle = target.color + '18';
              ctx.fill();
            }
          } else if (isHoveredConn) {
            ctx.beginPath();
            if (isCurved) {
              const midX = (n.x + target.x) / 2;
              const midY = (n.y + target.y) / 2;
              const perpX = -(target.y - n.y) / dist * 25;
              const perpY = (target.x - n.x) / dist * 25;
              ctx.moveTo(n.x, n.y);
              ctx.quadraticCurveTo(midX + perpX, midY + perpY, target.x, target.y);
            } else {
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
            }
            ctx.strokeStyle = `${n.color}55`;
            ctx.lineWidth = 0.8 + weight * 0.8;
            ctx.stroke();
          } else {
            // Normal edge with weight-based thickness (1-4px range)
            ctx.beginPath();
            if (isCurved) {
              const midX = (n.x + target.x) / 2;
              const midY = (n.y + target.y) / 2;
              const perpX = -(target.y - n.y) / dist * 20;
              const perpY = (target.x - n.x) / dist * 20;
              ctx.moveTo(n.x, n.y);
              ctx.quadraticCurveTo(midX + perpX, midY + perpY, target.x, target.y);
            } else {
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
            }
            const baseAlpha = isActive ? 0.12 : 0.06;
            const edgeAlpha = baseAlpha + weight * 0.06;
            ctx.strokeStyle = `rgba(136, 136, 170, ${edgeAlpha})`;
            // Edge thickness proportional to weight (1-4px)
            ctx.lineWidth = 1 + weight * 3;
            ctx.stroke();

            // ---- Animated dots flowing along high-weight edges ----
            if (weight > 0.6 && isActive) {
              const dotCount = Math.floor(weight * 2);
              for (let di = 0; di < dotCount; di++) {
                const dotPos = ((time * 0.5 * (0.5 + weight * 0.5) + di / dotCount) % 1);
                let dotX: number, dotY: number;
                if (isCurved) {
                  const midX = (n.x + target.x) / 2;
                  const midY = (n.y + target.y) / 2;
                  const perpX = -(target.y - n.y) / dist * 20;
                  const perpY = (target.x - n.x) / dist * 20;
                  const t = dotPos;
                  dotX = (1 - t) * (1 - t) * n.x + 2 * (1 - t) * t * (midX + perpX) + t * t * target.x;
                  dotY = (1 - t) * (1 - t) * n.y + 2 * (1 - t) * t * (midY + perpY) + t * t * target.y;
                } else {
                  dotX = n.x + dx * dotPos;
                  dotY = n.y + dy * dotPos;
                }
                const dotAlpha = (weight - 0.6) * 0.5;
                ctx.beginPath();
                ctx.arc(dotX, dotY, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 200, 230, ${dotAlpha})`;
                ctx.fill();
              }
            }
          }
        });
      });

      // ---- Draw Temporal Edges with traveling packets ----
      if (isActive) {
        temporalEdges.forEach(te => {
          const fromNode = nodes.find(nn => nn.id === te.from);
          const toNode = nodes.find(nn => nn.id === te.to);
          if (!fromNode || !toNode) return;

          // Check if this temporal edge should be active
          te.active = fromNode.active || toNode.active || (isActive && Math.sin(time * 0.3 + te.phase) > 0.3);
          te.dataFlow = (te.dataFlow + 0.004 * te.speed) % 1;

          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

          // Draw temporal edge line with gradient showing data transformation
          const edgeGrad = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
          const fromR = parseInt(fromNode.color.slice(1, 3), 16);
          const fromG = parseInt(fromNode.color.slice(3, 5), 16);
          const fromB = parseInt(fromNode.color.slice(5, 7), 16);
          const toR = parseInt(toNode.color.slice(1, 3), 16);
          const toG = parseInt(toNode.color.slice(3, 5), 16);
          const toB = parseInt(toNode.color.slice(5, 7), 16);
          const tempAlpha = te.active ? 0.2 : 0.06;
          edgeGrad.addColorStop(0, `rgba(${fromR}, ${fromG}, ${fromB}, ${tempAlpha})`);
          edgeGrad.addColorStop(1, `rgba(${toR}, ${toG}, ${toB}, ${tempAlpha})`);

          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = edgeGrad;
          ctx.lineWidth = te.active ? 1.5 : 0.5;
          ctx.stroke();

          // Active temporal edges glow brighter
          if (te.active) {
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.strokeStyle = `rgba(${fromR}, ${fromG}, ${fromB}, 0.05)`;
            ctx.lineWidth = 5;
            ctx.stroke();
          }

          // Traveling packet (bright dot moving along the edge)
          const packetX = fromNode.x + dx * te.dataFlow;
          const packetY = fromNode.y + dy * te.dataFlow;

          // Interpolate color along the path
          const pR = Math.round(fromR + (toR - fromR) * te.dataFlow);
          const pG = Math.round(fromG + (toG - fromG) * te.dataFlow);
          const pB = Math.round(fromB + (toB - fromB) * te.dataFlow);

          // Packet glow
          const packetAlpha = te.active ? 0.6 : 0.25;
          ctx.beginPath();
          ctx.arc(packetX, packetY, te.active ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${packetAlpha * 0.3})`;
          ctx.fill();

          // Packet core
          ctx.beginPath();
          ctx.arc(packetX, packetY, te.active ? 2 : 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${packetAlpha})`;
          ctx.fill();

          // Trail behind packet
          const trailLen = 3;
          for (let ti = 1; ti <= trailLen; ti++) {
            const trailPos = te.dataFlow - ti * 0.02 * te.speed;
            if (trailPos < 0) continue;
            const trailX = fromNode.x + dx * trailPos;
            const trailY = fromNode.y + dy * trailPos;
            const trailA = packetAlpha * (1 - ti / (trailLen + 1)) * 0.4;
            ctx.beginPath();
            ctx.arc(trailX, trailY, 1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${trailA})`;
            ctx.fill();
          }
        });
      }

      // ---- Draw nodes with sparklines ----
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

        // ---- Sparkline (activity history) below label ----
        const sparklineY = n.y + drawSize + 5 + Math.max(8, n.size * 0.55) + 4;
        const sparklineW = n.size * 2.2;
        const sparklineH = 6;
        const sparklineX = n.x - sparklineW / 2;
        const history = n.activityHistory;
        if (history.length >= 2) {
          ctx.beginPath();
          for (let hi = 0; hi < history.length; hi++) {
            const hx = sparklineX + (hi / (history.length - 1)) * sparklineW;
            const hy = sparklineY + sparklineH - history[hi] * sparklineH;
            if (hi === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          const sparkAlpha = n.active ? 0.7 : isHovered ? 0.5 : 0.25;
          ctx.strokeStyle = n.color + (n.active ? 'bb' : isHovered ? '88' : '44');
          ctx.lineWidth = 1;
          ctx.stroke();

          // Sparkline fill
          ctx.lineTo(sparklineX + sparklineW, sparklineY + sparklineH);
          ctx.lineTo(sparklineX, sparklineY + sparklineH);
          ctx.closePath();
          ctx.fillStyle = n.color + Math.floor(sparkAlpha * 0.3 * 255).toString(16).padStart(2, '0');
          ctx.fill();
        }
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