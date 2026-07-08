'use client';

import { useEffect, useRef, useCallback } from 'react';

interface DataStream {
  angle: number;
  radius: number;
  speed: number;
  length: number;
  opacity: number;
  color: string;
  width: number;
}

interface GaugeConfig {
  label: string;
  value: number; // 0-1
  color: string;
  glowColor: string;
  unit: string;
  maxLabel: string;
}

export default function ZettaScaleGauge({
  metrics,
  isValidating,
  validationIntensity,
}: {
  metrics: GaugeConfig[];
  isValidating: boolean;
  validationIntensity: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamsRef = useRef<DataStream[]>([]);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const initStreams = useCallback((w: number, h: number) => {
    sizeRef.current = { w, h };
    const streams: DataStream[] = [];
    for (let i = 0; i < 60; i++) {
      const hue = Math.random() < 0.5 ? 160 + Math.random() * 20 : 270 + Math.random() * 30;
      streams.push({
        angle: Math.random() * Math.PI * 2,
        radius: 20 + Math.random() * 30,
        speed: 0.5 + Math.random() * 1.5,
        length: 3 + Math.random() * 8,
        opacity: 0.3 + Math.random() * 0.5,
        color: `hsl(${hue}, 80%, 60%)`,
        width: 0.5 + Math.random() * 1.5,
      });
    }
    streamsRef.current = streams;
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
      if (streamsRef.current.length === 0) initStreams(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) { animRef.current = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.32;

      // === Central data vortex ===
      const vortexIntensity = 0.5 + validationIntensity * 0.5;
      for (const stream of streamsRef.current) {
        stream.angle += stream.speed * 0.02 * (1 + validationIntensity * 2);
        const r = baseRadius * 0.15 + stream.radius * (0.8 + Math.sin(t * 0.5 + stream.angle) * 0.2);
        const x = cx + Math.cos(stream.angle) * r;
        const y = cy + Math.sin(stream.angle) * r;

        const endAngle = stream.angle + stream.length * 0.05;
        const ex = cx + Math.cos(endAngle) * r;
        const ey = cy + Math.sin(endAngle) * r;

        ctx.save();
        ctx.globalAlpha = stream.opacity * vortexIntensity;
        ctx.strokeStyle = stream.color;
        ctx.lineWidth = stream.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
      }

      // Central glow
      const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.3);
      cGrad.addColorStop(0, `rgba(6,214,160,${0.15 * vortexIntensity})`);
      cGrad.addColorStop(0.5, `rgba(168,85,247,${0.08 * vortexIntensity})`);
      cGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // === GAUGE ARCS ===
      const gaugeCount = metrics.length;
      const gapAngle = 0.08;
      const totalGap = gapAngle * (gaugeCount + 1);
      const availableAngle = Math.PI * 1.6;
      const arcLength = (availableAngle - totalGap) / gaugeCount;
      const startAngle = Math.PI * 0.7 + gapAngle;

      for (let i = 0; i < gaugeCount; i++) {
        const m = metrics[i];
        const aStart = startAngle + i * (arcLength + gapAngle);
        const aEnd = aStart + arcLength;

        // Background track
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#8888aa';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius, aStart, aEnd);
        ctx.stroke();
        ctx.restore();

        // Value arc
        const valueEnd = aStart + arcLength * m.value;
        ctx.save();
        ctx.globalAlpha = 0.8 + Math.sin(t * 2 + i) * 0.1;
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.shadowColor = m.glowColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius, aStart, valueEnd);
        ctx.stroke();
        ctx.restore();

        // Endpoint dot
        const dotX = cx + Math.cos(valueEnd) * baseRadius;
        const dotY = cy + Math.sin(valueEnd) * baseRadius;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Label at the midpoint of the arc
        const midAngle = (aStart + aEnd) / 2;
        const labelR = baseRadius + 22;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = m.color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.label, lx, ly - 6);
        ctx.fillStyle = '#e8e0f0';
        ctx.font = '10px monospace';
        ctx.fillText(`${Math.floor(m.value * 100)}%`, lx, ly + 7);
        ctx.restore();

        // Validation pulse on the arc
        if (isValidating) {
          const pulsePos = ((t * 0.8 + i * 0.3) % 1);
          const pulseAngle = aStart + arcLength * pulsePos;
          const px = cx + Math.cos(pulseAngle) * baseRadius;
          const py = cy + Math.sin(pulseAngle) * baseRadius;

          ctx.save();
          ctx.globalAlpha = 0.6 * (1 - pulsePos);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = m.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // === Center text ===
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#8888aa';
      ctx.font = '9px monospace';
      ctx.letterSpacing = '3px';
      ctx.fillText('ZETTASCALE', cx, cy - 18);

      const avgValue = metrics.reduce((s, m) => s + m.value, 0) / metrics.length;
      const statusLabel = avgValue > 0.9 ? 'VALIDADO' : avgValue > 0.6 ? 'ATIVO' : 'MONITORANDO';
      const statusColor = avgValue > 0.9 ? '#06d6a0' : avgValue > 0.6 ? '#fbbf24' : '#a855f7';

      ctx.globalAlpha = 1;
      ctx.fillStyle = statusColor;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(statusLabel, cx, cy + 4);

      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#8888aa';
      ctx.font = '8px monospace';
      ctx.fillText(isValidating ? 'VALIDACAO EM CURSO' : `${metrics.length} NUCLEOS ONLINE`, cx, cy + 20);

      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [metrics, isValidating, validationIntensity, initStreams]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      aria-label="Painel de medidores Zettascale"
    />
  );
}