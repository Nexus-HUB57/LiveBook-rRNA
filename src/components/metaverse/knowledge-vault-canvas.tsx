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
  { name: 'Legado Lucas', type: 'legacy', status: 'sealed', size: 'infinity', color: '#fbbf24' },
];

const TYPE_ICONS: Record<string, string> = {
  keyvault: 'diamond', wallet: 'square', key: 'key', config: 'gear', pool: 'circle', legacy: 'star',
};

interface KnowledgeVaultCanvasProps {
  isActive: boolean;
  ragPhase: 'idle' | 'indexing' | 'retrieving' | 'generating' | 'streaming';
  onFileActivate: (file: VaultFile) => void;
}

const CLUSTER_NAMES = [
  'RAG-Index',
  'RAG-Embed',
  'RAG-Retrieve',
  'RAG-Generate',
  'Claude-Process',
  'Fable-Narrative',
  'Vault-Storage',
  'Quantum-Bridge',
];

const CLUSTER_COLORS = [
  '168,85,247',
  '6,214,160',
  '224,64,160',
  '251,191,36',
  '6,182,212',
  '244,114,182',
  '139,92,246',
  '52,211,153',
];

const RAG_PIPELINE_STAGES = ['INDEX', 'EMBED', 'RETRIEVE', 'GENERATE', 'STREAM'] as const;
const PHASE_TO_STAGE: Record<string, number> = {
  idle: -1,
  indexing: 0,
  retrieving: 2,
  generating: 3,
  streaming: 4,
};

// ---- Attention Beam Interface ----
interface AttentionBeam {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  weight: number;
  color: string;
  phase: number;
  fileIdx: number;
}

// ---- Embedding Point Interface ----
interface EmbeddingPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  cluster: number;
  dim1: number;
  dim2: number;
}

export default function KnowledgeVaultCanvas({ isActive, ragPhase, onFileActivate }: KnowledgeVaultCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filesRef = useRef<VaultFile[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const hoveredFileRef = useRef<number | null>(null);
  const animRef = useRef<number>(0);
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const prevRagPhaseRef = useRef<string>('idle');
  const activationWavesRef = useRef<{ startTime: number; cx: number; cy: number }[]>([]);

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

    const initW = canvas.getBoundingClientRect().width;
    const initH = canvas.getBoundingClientRect().height;

    // Initialize files in orbital arrangement
    if (filesRef.current.length === 0) {
      const cx = initW / 2;
      const cy = initH / 2;
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

    // ---- 160 neurons / 8 clusters ----
    const NEURON_COUNT = 160;
    const CLUSTER_COUNT = 8;
    const neurons: {
      x: number; y: number; vx: number; vy: number; size: number;
      connections: number[]; cluster: number; activation: number;
    }[] = [];
    for (let i = 0; i < NEURON_COUNT; i++) {
      const cluster = i % CLUSTER_COUNT;
      neurons.push({
        x: Math.random() * initW,
        y: Math.random() * (initH - 60),
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: 1 + Math.random() * 2.5,
        connections: Array.from({ length: 2 + Math.floor(Math.random() * 4) }, () => Math.floor(Math.random() * NEURON_COUNT)).filter(
          (v, idx, arr) => arr.indexOf(v) === idx && v !== i
        ),
        cluster,
        activation: 0.1 + Math.random() * 0.2,
      });
    }

    // ---- Synaptic plasticity: connection weight map ----
    const connectionWeights: Map<string, number> = new Map();
    const getWeightKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
    neurons.forEach(n => {
      n.connections.forEach(t => {
        const key = getWeightKey(neurons.indexOf(n), t);
        if (!connectionWeights.has(key)) {
          connectionWeights.set(key, 0.3 + Math.random() * 0.2);
        }
      });
    });

    // ---- Particle trails for data flow ----
    interface ParticleTrail {
      trail: { x: number; y: number }[];
      size: number;
      color: string;
      progress: number;
      speed: number;
      isRetrieve: boolean;
      fileIdx: number;
    }
    const particleTrails: ParticleTrail[] = [];

    // ---- Encryption orbit particles for file nodes ----
    interface EncryptionOrbit {
      fileIdx: number;
      angle: number;
      speed: number;
      radius: number;
      color: string;
      baseSpeed: number;
    }
    const encryptionOrbits: EncryptionOrbit[] = [];
    filesRef.current.forEach((file, idx) => {
      const count = 3;
      for (let p = 0; p < count; p++) {
        const isSealed = file.status === 'sealed';
        encryptionOrbits.push({
          fileIdx: idx,
          angle: (p / count) * Math.PI * 2,
          speed: isSealed ? 0.015 : 0.005,
          radius: 18 + Math.random() * 4,
          color: isSealed ? '#06d6a0' : '#fbbf24',
          baseSpeed: isSealed ? 0.015 : 0.005,
        });
      }
    });

    // ---- Embedding Space Projection (30 points, 4 clusters) ----
    const EMBEDDING_CLUSTER_COLORS = ['6,214,160', '168,85,247', '251,191,36', '224,64,160'];
    const embeddingPoints: EmbeddingPoint[] = [];
    for (let i = 0; i < 30; i++) {
      const cluster = Math.floor(i / 8) % 4;
      const angle = (cluster / 4) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const spread = 60 + Math.random() * 80;
      embeddingPoints.push({
        x: initW / 2 + Math.cos(angle) * spread + (Math.random() - 0.5) * 40,
        y: initH / 2 + Math.sin(angle) * spread + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        cluster,
        dim1: (Math.random() - 0.5) * 2,
        dim2: (Math.random() - 0.5) * 2,
      });
    }

    // ---- Attention Beams ----
    const attentionBeams: AttentionBeam[] = [];

    // ---- Neural Layer Visualization ----
    const NEURAL_LAYER_LABELS = ['Input', 'Hidden', 'Output'];
    const NEURAL_LAYER_NODE_COUNTS = [10, 9, 8];
    const neuralLayers: { y: number; nodes: { x: number; y: number }[] }[] = [];

    let time = 0;
    let waveIdCounter = 0;

    const animate = () => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);
      time += 0.005;

      // ---- Trigger activation waves on RAG phase changes ----
      if (ragPhase !== prevRagPhaseRef.current && ragPhase !== 'idle') {
        activationWavesRef.current.push({
          startTime: time,
          cx: cx,
          cy: cy,
        });
        waveIdCounter++;
        if (activationWavesRef.current.length > 6) {
          activationWavesRef.current.shift();
        }
      }
      prevRagPhaseRef.current = ragPhase;

      // ---- Draw Embedding Space Projection (background, very low opacity) ----
      if (isActive) {
        // Float embedding points gently
        embeddingPoints.forEach(ep => {
          ep.x += ep.vx + Math.sin(time * 1.2 + ep.dim1 * 3) * 0.05;
          ep.y += ep.vy + Math.cos(time * 0.9 + ep.dim2 * 3) * 0.05;
          // Soft bounds
          if (ep.x < 30 || ep.x > w - 30) ep.vx *= -1;
          if (ep.y < 30 || ep.y > h - 60) ep.vy *= -1;
          ep.vx *= 0.998;
          ep.vy *= 0.998;
        });

        // Draw connections between nearby points (cosine similarity > 0.8 simulation)
        for (let i = 0; i < embeddingPoints.length; i++) {
          for (let j = i + 1; j < embeddingPoints.length; j++) {
            const a = embeddingPoints[i];
            const b = embeddingPoints[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Simulate cosine similarity via distance threshold
            if (dist < 70) {
              const simAlpha = Math.max(0, (1 - dist / 70)) * 0.08;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(${EMBEDDING_CLUSTER_COLORS[a.cluster]}, ${simAlpha})`;
              ctx.lineWidth = 0.4;
              ctx.stroke();
            }
          }
        }

        // Draw embedding points
        embeddingPoints.forEach(ep => {
          const cc = EMBEDDING_CLUSTER_COLORS[ep.cluster];
          ctx.beginPath();
          ctx.arc(ep.x, ep.y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cc}, 0.12)`;
          ctx.fill();
          // Subtle glow
          ctx.beginPath();
          ctx.arc(ep.x, ep.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cc}, 0.03)`;
          ctx.fill();
        });
      }

      // ---- Draw Neural Layer Visualization (behind main elements) ----
      {
        const layerSpacing = Math.min(h * 0.12, 50);
        const layerStartY = cy - layerSpacing;
        const layerW = Math.min(w * 0.5, 300);

        // Rebuild neural layers each frame based on current canvas size
        neuralLayers.length = 0;
        NEURAL_LAYER_LABELS.forEach((_, li) => {
          const ly = layerStartY + li * layerSpacing;
          const nodeCount = NEURAL_LAYER_NODE_COUNTS[li];
          const nodeSpacing = layerW / (nodeCount + 1);
          const nodes: { x: number; y: number }[] = [];
          for (let ni = 0; ni < nodeCount; ni++) {
            nodes.push({
              x: cx - layerW / 2 + nodeSpacing * (ni + 1),
              y: ly,
            });
          }
          neuralLayers.push({ y: ly, nodes });
        });

        // Draw inter-layer connections with varying opacity (weights)
        for (let li = 0; li < neuralLayers.length - 1; li++) {
          const layerA = neuralLayers[li];
          const layerB = neuralLayers[li + 1];
          layerA.nodes.forEach((na, ai) => {
            layerB.nodes.forEach((nb, bi) => {
              // Pseudo-weight from deterministic hash
              const weightVal = 0.05 + Math.abs(Math.sin(ai * 7.3 + bi * 11.7 + li * 3.1)) * 0.15;
              const isActiveLayer = isActive && ragPhase !== 'idle';
              const alpha = isActiveLayer ? weightVal * (0.5 + Math.sin(time * 2 + ai + bi) * 0.3) : weightVal * 0.4;
              ctx.beginPath();
              ctx.moveTo(na.x, na.y);
              ctx.lineTo(nb.x, nb.y);
              ctx.strokeStyle = `rgba(136, 136, 200, ${Math.min(alpha, 0.08)})`;
              ctx.lineWidth = 0.3;
              ctx.stroke();
            });
          });
        }

        // Draw layer lines and nodes
        neuralLayers.forEach((layer, li) => {
          // Horizontal line
          ctx.beginPath();
          ctx.moveTo(layer.nodes[0].x - 10, layer.y);
          ctx.lineTo(layer.nodes[layer.nodes.length - 1].x + 10, layer.y);
          ctx.strokeStyle = 'rgba(136, 136, 200, 0.06)';
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Nodes (small circles)
          layer.nodes.forEach((node, ni) => {
            const pulse = isActive && ragPhase !== 'idle'
              ? 0.5 + Math.sin(time * 3 + ni * 0.8 + li * 2) * 0.3
              : 0.2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(136, 136, 200, ${pulse * 0.3})`;
            ctx.fill();
          });

          // Label
          ctx.font = '6px monospace';
          ctx.fillStyle = 'rgba(136, 136, 200, 0.1)';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(NEURAL_LAYER_LABELS[li], layer.nodes[0].x - 16, layer.y);
        });
      }

      // ---- Draw neural activation waves ----
      const wavesToKeep: typeof activationWavesRef.current = [];
      activationWavesRef.current.forEach(wave => {
        const elapsed = time - wave.startTime;
        const waveRadius = elapsed * 120;
        const maxRadius = Math.max(w, h) * 0.7;
        if (waveRadius < maxRadius) {
          const alpha = Math.max(0, (1 - waveRadius / maxRadius) * 0.25);
          if (alpha > 0.005) {
            ctx.beginPath();
            ctx.arc(wave.cx, wave.cy, waveRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 2.5 - (waveRadius / maxRadius) * 2;
            ctx.stroke();

            // Inner ring
            ctx.beginPath();
            ctx.arc(wave.cx, wave.cy, waveRadius * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(6, 214, 160, ${alpha * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          wavesToKeep.push(wave);
        }
      });
      activationWavesRef.current = wavesToKeep;

      // ---- Hebbian synaptic plasticity update ----
      if (isActive && ragPhase !== 'idle') {
        connectionWeights.forEach((weight, key) => {
          const [aStr, bStr] = key.split('-');
          const a = parseInt(aStr, 10);
          const b = parseInt(bStr, 10);
          const nA = neurons[a];
          const nB = neurons[b];
          if (!nA || !nB) return;
          if (nA.activation > 0.5 && nB.activation > 0.5) {
            const newWeight = Math.min(2.0, weight + 0.002);
            connectionWeights.set(key, newWeight);
          } else {
            const newWeight = Math.max(0.2, weight - 0.0003);
            connectionWeights.set(key, newWeight);
          }
        });
      }

      // ---- Draw neurons with synaptic plasticity ----
      neurons.forEach((n) => {
        // Cluster attraction
        const sameCluster = neurons.filter(m => m.cluster === n.cluster && m !== n);
        sameCluster.forEach(m => {
          const dx = m.x - n.x;
          const dy = m.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 80 && dist < 200) {
            n.vx += (dx / dist) * 0.002;
            n.vy += (dy / dist) * 0.002;
          }
        });

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h - 60) n.vy *= -1;
        n.vx *= 0.995;
        n.vy *= 0.995;

        // Activation propagation
        if (isActive && ragPhase !== 'idle') {
          n.activation = Math.min(1, n.activation + 0.001);
        } else {
          n.activation = Math.max(0.1, n.activation - 0.0005);
        }

        // Draw connections with synaptic weight
        const nIdx = neurons.indexOf(n);
        n.connections.forEach((targetIdx) => {
          const target = neurons[targetIdx];
          if (!target) return;
          const dx = n.x - target.x;
          const dy = n.y - target.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 130;
          if (dist < maxDist) {
            const weightKey = getWeightKey(nIdx, targetIdx);
            const synWeight = connectionWeights.get(weightKey) || 0.3;
            const baseAlpha = (1 - dist / maxDist) * 0.06;
            const activationBoost = (n.activation + target.activation) * 0.5;
            const alpha = baseAlpha * (0.3 + activationBoost * 0.7) * Math.min(synWeight, 1.0);
            const cc = CLUSTER_COLORS[n.cluster];
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(target.x, target.y);
            ctx.strokeStyle = `rgba(${cc}, ${alpha})`;
            ctx.lineWidth = (0.4 + activationBoost * 0.6) * Math.min(synWeight, 1.5);
            ctx.stroke();

            // Synaptic strengthening glow for strong connections
            if (synWeight > 0.8 && n.activation > 0.4) {
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
              ctx.strokeStyle = `rgba(${cc}, ${alpha * 0.3})`;
              ctx.lineWidth = (0.4 + activationBoost * 0.6) * synWeight * 2;
              ctx.stroke();
            }

            // Active connection pulse
            if (n.activation > 0.5 && Math.random() < 0.02) {
              const pp = Math.random();
              const px = n.x + (target.x - n.x) * pp;
              const py = n.y + (target.y - n.y) * pp;
              ctx.beginPath();
              ctx.arc(px, py, 1.5, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${cc}, ${0.6 * activationBoost})`;
              ctx.fill();
            }
          }
        });

        const distToCenter = Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2);
        const cc = CLUSTER_COLORS[n.cluster];
        const glow = n.activation * (0.3 + Math.sin(time * 3 + distToCenter * 0.01) * 0.15);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cc}, ${glow})`;
        ctx.fill();
        if (n.activation > 0.4) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.size + 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cc}, ${glow * 0.15})`;
          ctx.fill();
        }
      });

      // ---- RAG bidirectional data flow with particle trails ----
      if (ragPhase !== 'idle' && filesRef.current.length > 0) {
        const fileIdx1 = Math.floor(time * 8) % filesRef.current.length;
        const fileIdx2 = (fileIdx1 + 3) % filesRef.current.length;
        const retrieveFile = filesRef.current[fileIdx1];
        const generateFile = filesRef.current[fileIdx2];

        // During streaming: reverse direction (center -> edges)
        const isStreaming = ragPhase === 'streaming';

        // Retrieve stream (file -> core, or core -> file during streaming)
        const stream1Src = isStreaming ? { x: cx, y: cy } : retrieveFile;
        const stream1Tgt = isStreaming ? retrieveFile : { x: cx, y: cy };
        const cp1x = (stream1Src.x + stream1Tgt.x) / 2 + Math.sin(time * 5) * 35;
        const cp1y = (stream1Src.y + stream1Tgt.y) / 2 + Math.cos(time * 5) * 35;
        ctx.beginPath();
        ctx.moveTo(stream1Src.x, stream1Src.y);
        ctx.quadraticCurveTo(cp1x, cp1y, stream1Tgt.x, stream1Tgt.y);
        const grad1 = ctx.createLinearGradient(stream1Src.x, stream1Src.y, stream1Tgt.x, stream1Tgt.y);
        grad1.addColorStop(0, retrieveFile.color + '50');
        grad1.addColorStop(1, 'rgba(6,214,160,0.3)');
        ctx.strokeStyle = grad1;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 8]);
        ctx.lineDashOffset = isStreaming ? time * 200 : -time * 200;
        ctx.stroke();
        ctx.setLineDash([]);

        // Generate stream (core -> file, or file -> core during streaming)
        const stream2Src = isStreaming ? generateFile : { x: cx, y: cy };
        const stream2Tgt = isStreaming ? { x: cx, y: cy } : generateFile;
        const cp2x = (stream2Src.x + stream2Tgt.x) / 2 + Math.sin(time * 4 + 2) * 35;
        const cp2y = (stream2Src.y + stream2Tgt.y) / 2 + Math.cos(time * 4 + 2) * 35;
        ctx.beginPath();
        ctx.moveTo(stream2Src.x, stream2Src.y);
        ctx.quadraticCurveTo(cp2x, cp2y, stream2Tgt.x, stream2Tgt.y);
        const grad2 = ctx.createLinearGradient(stream2Src.x, stream2Src.y, stream2Tgt.x, stream2Tgt.y);
        grad2.addColorStop(0, 'rgba(224,64,160,0.3)');
        grad2.addColorStop(1, generateFile.color + '50');
        ctx.strokeStyle = grad2;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 6]);
        ctx.lineDashOffset = isStreaming ? -time * 150 : time * 150;
        ctx.stroke();
        ctx.setLineDash([]);

        // ---- Data flow particles with trails (8 particles) ----
        while (particleTrails.length < 8) {
          const pIdx = particleTrails.length;
          const isRetrieve = pIdx < 4;
          particleTrails.push({
            trail: [],
            size: 2 + Math.random() * 2,
            color: isRetrieve ? '#06d6a0' : '#e040a0',
            progress: pIdx * 0.125,
            speed: 1.2 + Math.random() * 0.6,
            isRetrieve,
            fileIdx: isRetrieve ? fileIdx1 : fileIdx2,
          });
        }

        // Update file indices
        particleTrails.forEach((p) => {
          p.fileIdx = p.isRetrieve ? fileIdx1 : fileIdx2;
        });

        // Draw and update particle trails
        particleTrails.forEach(p => {
          const file = filesRef.current[p.fileIdx % filesRef.current.length];
          if (!file) return;

          // Reverse source/target during streaming
          let src: { x: number; y: number };
          let tgt: { x: number; y: number };
          let cp: { x: number; y: number };

          if (isStreaming) {
            src = p.isRetrieve ? { x: cx, y: cy } : file;
            tgt = p.isRetrieve ? file : { x: cx, y: cy };
            cp = p.isRetrieve ? { x: cp1x, y: cp1y } : { x: cp2x, y: cp2y };
          } else {
            src = p.isRetrieve ? file : { x: cx, y: cy };
            tgt = p.isRetrieve ? { x: cx, y: cy } : file;
            cp = p.isRetrieve ? { x: cp1x, y: cp1y } : { x: cp2x, y: cp2y };
          }

          p.progress = (p.progress + 0.005 * p.speed) % 1;
          const pp = p.progress;
          const px = (1 - pp) * (1 - pp) * src.x + 2 * (1 - pp) * pp * cp.x + pp * pp * tgt.x;
          const py = (1 - pp) * (1 - pp) * src.y + 2 * (1 - pp) * pp * cp.y + pp * pp * tgt.y;

          // Store trail
          p.trail.push({ x: px, y: py });
          if (p.trail.length > 7) p.trail.shift();

          // Draw trail
          for (let t = 0; t < p.trail.length - 1; t++) {
            const trailAlpha = ((t + 1) / p.trail.length) * 0.4;
            const trailSize = p.size * ((t + 1) / p.trail.length) * 0.7;
            ctx.beginPath();
            ctx.arc(p.trail[t].x, p.trail[t].y, trailSize, 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.floor(trailAlpha * 255).toString(16).padStart(2, '0');
            ctx.fill();
          }

          // Draw main particle
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py, p.size + 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color + '25';
          ctx.fill();
        });
      } else {
        // Clear trails when idle
        particleTrails.forEach(p => { p.trail = []; });
      }

      // ---- Attention Beam Visualization ----
      if ((ragPhase === 'retrieving' || ragPhase === 'generating') && isActive && filesRef.current.length > 0) {
        const beamColor = ragPhase === 'retrieving' ? '#fbbf24' : '#e040a0';

        // Maintain 5-8 attention beams
        const targetBeamCount = 5 + Math.floor(Math.sin(time * 0.7) * 1.5 + 1.5);

        // Refresh beam file targets periodically
        while (attentionBeams.length < targetBeamCount) {
          const fileIdx = Math.floor(Math.random() * filesRef.current.length);
          const file = filesRef.current[fileIdx];
          attentionBeams.push({
            fromX: cx,
            fromY: cy,
            toX: file.x,
            toY: file.y,
            weight: Math.random(),
            color: beamColor,
            phase: Math.random() * Math.PI * 2,
            fileIdx,
          });
        }
        while (attentionBeams.length > targetBeamCount) {
          attentionBeams.pop();
        }

        // Update beam positions to track files
        attentionBeams.forEach(beam => {
          const file = filesRef.current[beam.fileIdx % filesRef.current.length];
          if (file) {
            beam.toX = file.x;
            beam.toY = file.y;
            beam.fromX = cx;
            beam.fromY = cy;
          }
          // Animate weight (0 to 1 and back)
          beam.phase += 0.03;
          beam.weight = (Math.sin(beam.phase) + 1) / 2;
        });

        // Draw attention beams
        attentionBeams.forEach(beam => {
          const thickness = 0.5 + beam.weight * 3;

          // Control point for quadratic bezier curve
          const midX = (beam.fromX + beam.toX) / 2;
          const midY = (beam.fromY + beam.toY) / 2;
          const perpDx = beam.toX - beam.fromX;
          const perpDy = beam.toY - beam.fromY;
          const perpLen = Math.max(1, Math.sqrt(perpDx * perpDx + perpDy * perpDy));
          const curvature = Math.sin(time * 2 + beam.phase) * 40;
          const cpX = midX + (-perpDy / perpLen) * curvature;
          const cpY = midY + (perpDx / perpLen) * curvature;

          // Glow layer
          ctx.beginPath();
          ctx.moveTo(beam.fromX, beam.fromY);
          ctx.quadraticCurveTo(cpX, cpY, beam.toX, beam.toY);
          const glowAlpha = beam.weight * 0.15;
          ctx.strokeStyle = ragPhase === 'retrieving'
            ? `rgba(251, 191, 36, ${glowAlpha})`
            : `rgba(224, 64, 160, ${glowAlpha})`;
          ctx.lineWidth = thickness + 4;
          ctx.stroke();

          // Main beam line
          ctx.beginPath();
          ctx.moveTo(beam.fromX, beam.fromY);
          ctx.quadraticCurveTo(cpX, cpY, beam.toX, beam.toY);
          const beamAlpha = 0.1 + beam.weight * 0.4;
          ctx.strokeStyle = ragPhase === 'retrieving'
            ? `rgba(251, 191, 36, ${beamAlpha})`
            : `rgba(224, 64, 160, ${beamAlpha})`;
          ctx.lineWidth = thickness;
          ctx.stroke();

          // Pulsing dot traveling along the beam
          const dotProgress = ((time * 1.5 + beam.phase) % 1);
          const t = dotProgress;
          const dotX = (1 - t) * (1 - t) * beam.fromX + 2 * (1 - t) * t * cpX + t * t * beam.toX;
          const dotY = (1 - t) * (1 - t) * beam.fromY + 2 * (1 - t) * t * cpY + t * t * beam.toY;

          // Dot glow
          ctx.beginPath();
          ctx.arc(dotX, dotY, 5 + beam.weight * 3, 0, Math.PI * 2);
          ctx.fillStyle = ragPhase === 'retrieving'
            ? `rgba(251, 191, 36, ${0.15 + beam.weight * 0.1})`
            : `rgba(224, 64, 160, ${0.15 + beam.weight * 0.1})`;
          ctx.fill();

          // Dot core
          ctx.beginPath();
          ctx.arc(dotX, dotY, 2 + beam.weight, 0, Math.PI * 2);
          ctx.fillStyle = beamColor;
          ctx.fill();
        });
      } else {
        // Fade out and clear attention beams
        attentionBeams.length = 0;
      }

      // ---- Indexing Scanning Line Effect ----
      if (ragPhase === 'indexing' && isActive) {
        const scanAngle = time * 3;
        const scanRadius = Math.min(cx, cy) * 0.65;
        const scanEndX = cx + Math.cos(scanAngle) * scanRadius;
        const scanEndY = cy + Math.sin(scanAngle) * scanRadius;

        // Scanning fan
        const fanAngle = 0.4;
        const fanGrad = ctx.createConicGradient(scanAngle - fanAngle, cx, cy);
        fanGrad.addColorStop(0, 'rgba(251, 191, 36, 0)');
        fanGrad.addColorStop(0.06, 'rgba(251, 191, 36, 0.08)');
        fanGrad.addColorStop(0.12, 'rgba(251, 191, 36, 0)');
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, scanRadius, scanAngle - fanAngle, scanAngle + fanAngle);
        ctx.closePath();
        ctx.fillStyle = fanGrad;
        ctx.fill();

        // Scan line
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(scanEndX, scanEndY);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Scan tip glow
        ctx.beginPath();
        ctx.arc(scanEndX, scanEndY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(scanEndX, scanEndY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
        ctx.fill();
      }

      // ---- Central RAG processor core ----
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

      // ---- Draw vault files with encryption orbit particles ----
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

        // Icon (simple text glyphs, no emoji)
        const iconMap: Record<string, string> = {
          keyvault: '\u25C6', wallet: '\u25C8', key: '\u2666', config: '\u2699', pool: '\u25C9', legacy: '\u2606',
        };
        ctx.fillStyle = '#ffffff';
        ctx.font = `${isHovered ? 12 : 9}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(iconMap[file.type] || '\u25CF', file.x, file.y);

        // ---- Encryption orbit particles ----
        const isBeingIndexed = ragPhase === 'indexing';
        encryptionOrbits.forEach(orbit => {
          if (orbit.fileIdx !== i) return;
          orbit.speed = isBeingIndexed ? orbit.baseSpeed * 3.5 : orbit.baseSpeed;
          orbit.angle += orbit.speed;
          const ox = file.x + Math.cos(orbit.angle) * (nodeSize + orbit.radius);
          const oy = file.y + Math.sin(orbit.angle) * (nodeSize + orbit.radius);

          const orbitColor = isBeingIndexed
            ? `rgba(251, 191, 36, ${0.6 + Math.sin(time * 8 + orbit.angle) * 0.3})`
            : `rgba(6, 214, 160, 0.5)`;

          ctx.beginPath();
          ctx.arc(ox, oy, isBeingIndexed ? 1.8 : 1.2, 0, Math.PI * 2);
          ctx.fillStyle = orbitColor;
          ctx.fill();

          if (isBeingIndexed) {
            ctx.beginPath();
            ctx.arc(ox, oy, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
            ctx.fill();
          }
        });

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
          const rr = textWidth / 2 + padding;
          const ry2 = 12;
          const bx = file.x - rr;
          const by = labelY - ry2;
          const bw = rr * 2;
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
          const statusText = `${file.status} / ${file.size}`;
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

      // ---- RAG Pipeline Flow Visualization (bottom of canvas) ----
      const pipelineY = h - 36;
      const pipelineStageWidth = 80;
      const pipelineGap = 30;
      const totalPipelineWidth = RAG_PIPELINE_STAGES.length * pipelineStageWidth + (RAG_PIPELINE_STAGES.length - 1) * pipelineGap;
      const pipelineStartX = (w - totalPipelineWidth) / 2;
      const activeStage = PHASE_TO_STAGE[ragPhase] ?? -1;

      // Background bar
      ctx.fillStyle = 'rgba(5, 5, 16, 0.6)';
      ctx.beginPath();
      const pbx = pipelineStartX - 16;
      const pby = pipelineY - 18;
      const pbw = totalPipelineWidth + 32;
      const pbh = 36;
      const pbr = 8;
      ctx.moveTo(pbx + pbr, pby);
      ctx.lineTo(pbx + pbw - pbr, pby);
      ctx.arcTo(pbx + pbw, pby, pbx + pbw, pby + pbr, pbr);
      ctx.lineTo(pbx + pbw, pby + pbh - pbr);
      ctx.arcTo(pbx + pbw, pby + pbh, pbx + pbw - pbr, pby + pbh, pbr);
      ctx.lineTo(pbx + pbr, pby + pbh);
      ctx.arcTo(pbx, pby + pbh, pbx, pby + pbh - pbr, pbr);
      ctx.lineTo(pbx, pby + br);
      ctx.arcTo(pbx, pby, pbx + pbr, pby, pbr);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(136, 136, 170, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw stages
      RAG_PIPELINE_STAGES.forEach((stage, si) => {
        const sx = pipelineStartX + si * (pipelineStageWidth + pipelineGap);
        const isActive2 = si === activeStage;
        const isPast = si < activeStage && activeStage >= 0;
        const pulseScale = isActive2 ? 1 + Math.sin(time * 6) * 0.08 : 1;
        const boxW = pipelineStageWidth * pulseScale;
        const boxH = 22;
        const boxX = sx + (pipelineStageWidth - boxW) / 2;
        const boxY = pipelineY - boxH / 2;

        // Stage box
        ctx.beginPath();
        const sbr = 4;
        ctx.moveTo(boxX + sbr, boxY);
        ctx.lineTo(boxX + boxW - sbr, boxY);
        ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + sbr, sbr);
        ctx.lineTo(boxX + boxW, boxY + boxH - sbr);
        ctx.arcTo(boxX + boxW, boxY + boxH, boxX + boxW - sbr, boxY + boxH, sbr);
        ctx.lineTo(boxX + sbr, boxY + boxH);
        ctx.arcTo(boxX, boxY + boxH, boxX, boxY + boxH - sbr, sbr);
        ctx.lineTo(boxX, boxY + sbr);
        ctx.arcTo(boxX, boxY, boxX + sbr, boxY, sbr);
        ctx.closePath();

        if (isActive2) {
          ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          const pulseR = 2 + Math.sin(time * 8) * 2;
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = pulseR;
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (isPast) {
          ctx.fillStyle = 'rgba(6, 214, 160, 0.12)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(6, 214, 160, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(20, 20, 40, 0.6)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(136, 136, 170, 0.2)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Stage label
        ctx.fillStyle = isActive2 ? '#ffffff' : isPast ? '#06d6a0' : '#666688';
        ctx.font = `${isActive2 ? 'bold ' : ''}8px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stage, sx + pipelineStageWidth / 2, pipelineY);

        // Arrow between stages
        if (si < RAG_PIPELINE_STAGES.length - 1) {
          const arrowX = sx + pipelineStageWidth + 4;
          const arrowEndX = sx + pipelineStageWidth + pipelineGap - 4;
          const arrowMidX = (arrowX + arrowEndX) / 2;
          const arrowY = pipelineY;

          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowEndX, arrowY);
          const isArrowActive = activeStage >= si && activeStage > si;
          ctx.strokeStyle = isArrowActive ? 'rgba(168, 85, 247, 0.6)' : 'rgba(136, 136, 170, 0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.lineDashOffset = -time * 60;
          ctx.stroke();
          ctx.setLineDash([]);

          // Data packet on arrow
          if (isArrowActive) {
            const packetPos = (time * 2 + si * 0.3) % 1;
            const packetX = arrowX + (arrowEndX - arrowX) * packetPos;
            ctx.beginPath();
            ctx.arc(packetX, arrowY, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#a855f7';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(packetX, arrowY, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
            ctx.fill();
          }

          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(arrowEndX, arrowY);
          ctx.lineTo(arrowEndX - 4, arrowY - 3);
          ctx.lineTo(arrowEndX - 4, arrowY + 3);
          ctx.closePath();
          ctx.fillStyle = isArrowActive ? 'rgba(168, 85, 247, 0.6)' : 'rgba(136, 136, 170, 0.2)';
          ctx.fill();
        }
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