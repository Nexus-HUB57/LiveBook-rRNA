'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  Copy,
  Terminal,
  Server,
  Cpu,
  Layers,
  Workflow,
  Database,
  MessageSquare,
  Search,
  Radio,
  Globe,
  Bot,
} from 'lucide-react';

/* ─── Scroll animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: 'easeOut' },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ─── Data ─── */
const languages = [
  {
    lang: 'Python',
    color: '#fbbf24',
    letter: 'Py',
    role: 'Orquestração LangChain + Crawl4AI',
    mech: 'Servidor Central gRPC / FastAPI',
    status: 'ONLINE',
    latency: '0.3ms',
  },
  {
    lang: 'C++',
    color: '#06b6d4',
    letter: 'C+',
    role: 'Busca vetorial, grafos, indexação',
    mech: 'pybind11 / gRPC ultra-baixa latência',
    status: 'ONLINE',
    latency: '2ms',
  },
  {
    lang: 'C# (.NET)',
    color: '#a855f7',
    letter: 'C#',
    role: 'Lógica de negócios, RPA corporativo',
    mech: 'Cliente gRPC consumindo LLM',
    status: 'ONLINE',
    latency: '5ms',
  },
  {
    lang: 'Java',
    color: '#f97316',
    letter: 'Ja',
    role: 'Dados distribuídos (Spark / Flink)',
    mech: 'Kafka / RabbitMQ + REST / gRPC',
    status: 'ONLINE',
    latency: '8ms',
  },
];

const flowSteps = [
  {
    num: 1,
    title: 'Gatilho Corporativo',
    tech: 'C# / Java',
    desc: 'Evento de negócio dispara o pipeline via gRPC.',
    color: '#f97316',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    num: 2,
    title: 'Ingestão Genômica',
    tech: 'Crawl4AI',
    desc: 'Web crawling inteligente extrai dados da web.',
    color: '#06d6a0',
    icon: <Search className="w-5 h-5" />,
  },
  {
    num: 3,
    title: 'Tradução Ribossômica',
    tech: 'LangChain',
    desc: 'Chains transformam dados brutos em contexto estruturado.',
    color: '#a855f7',
    icon: <Workflow className="w-5 h-5" />,
  },
  {
    num: 4,
    title: 'Processamento Cognitivo',
    tech: 'Claude / Llama / Hermes',
    desc: 'LLM local ou cloud processa e gera resposta.',
    color: '#e040a0',
    icon: <Bot className="w-5 h-5" />,
  },
  {
    num: 5,
    title: 'Execução Baixa Latência',
    tech: 'C++ Core',
    desc: 'Resultado final entregue em microssegundos.',
    color: '#fbbf24',
    icon: <Cpu className="w-5 h-5" />,
  },
];

const techStack = [
  { name: 'Crawl4AI', desc: 'Web crawling com extração por LLM', color: '#06d6a0', icon: <Globe className="w-5 h-5" /> },
  { name: 'LangChain', desc: 'Orquestração de chains e agentes', color: '#a855f7', icon: <Layers className="w-5 h-5" /> },
  { name: 'gRPC', desc: 'Comunicação inter-serviço ultra-rápida', color: '#06b6d4', icon: <Radio className="w-5 h-5" /> },
  { name: 'Apache Thrift', desc: 'Serialização multi-linguagem', color: '#f97316', icon: <Workflow className="w-5 h-5" /> },
  { name: 'pybind11', desc: 'Binding C++ ↔ Python sem overhead', color: '#fbbf24', icon: <Terminal className="w-5 h-5" /> },
  { name: 'Ollama', desc: 'Runtime de LLMs locais', color: '#e040a0', icon: <Bot className="w-5 h-5" /> },
  { name: 'vLLM', desc: 'Inferência LLM em alta velocidade', color: '#06d6a0', icon: <Cpu className="w-5 h-5" /> },
  { name: 'Apache Kafka', desc: 'Streaming de eventos distribuídos', color: '#a855f7', icon: <MessageSquare className="w-5 h-5" /> },
  { name: 'Apache Spark', desc: 'Processamento de dados em larga escala', color: '#f97316', icon: <Database className="w-5 h-5" /> },
  { name: 'Claude API', desc: 'LLM avançado da Anthropic', color: '#e040a0', icon: <Server className="w-5 h-5" /> },
];

const codeLines = [
  { content: '<span class="text-[#c678dd]">async</span> <span class="text-[#61afef]">def</span> <span class="text-[#61afef]">execute_rrna_extraction</span>(<span class="text-[#e5c07b]">url</span>: <span class="text-[#e5c07b]">str</span>):', num: 1 },
  { content: '    extraction_strategy = <span class="text-[#e5c07b]">LLMExtractionStrategy</span>(', num: 2 },
  { content: '        provider=<span class="text-[#98c379]">"ollama/hermes3"</span>,', num: 3 },
  { content: '        api_token=<span class="text-[#98c379]">"no-token-needed-for-local"</span>,', num: 4 },
  { content: '        instruction=<span class="text-[#98c379]">"Extraia todas as entidades, intenções..."</span>', num: 5 },
  { content: '    )', num: 6 },
  { content: '    <span class="text-[#c678dd]">async with</span> <span class="text-[#e5c07b]">AsyncWebCrawler</span>(verbose=<span class="text-[#d19a66]">True</span>) <span class="text-[#c678dd]">as</span> crawler:', num: 7 },
  { content: '        result = <span class="text-[#c678dd]">await</span> crawler.<span class="text-[#61afef]">arun</span>(', num: 8 },
  { content: '            url=url,', num: 9 },
  { content: '            extraction_strategy=extraction_strategy,', num: 10 },
  { content: '            bypass_cache=<span class="text-[#d19a66]">True</span>', num: 11 },
  { content: '        )', num: 12 },
  { content: '        <span class="text-[#c678dd]">return</span> result.extracted_content', num: 13 },
];

/* ─── Helix Canvas Component ─── */
function HelixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const amplitude = 40;
      const frequency = 0.02;
      const speed = 0.015;
      const centerY = h / 2;
      const steps = 200;

      // Draw base pairs first (behind strands)
      for (let i = 0; i < steps; i++) {
        const x = (i / steps) * w;
        const y1 = centerY + Math.sin(x * frequency + time) * amplitude;
        const y2 = centerY + Math.sin(x * frequency + time + Math.PI) * amplitude;
        const depth = (Math.sin(x * frequency + time) + 1) / 2;

        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.08 + depth * 0.12})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw strand 1 (purple-teal)
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * w;
        const y = centerY + Math.sin(x * frequency + time) * amplitude;
        const depth = (Math.sin(x * frequency + time) + 1) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw strand 2 (teal-pink)
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * w;
        const y = centerY + Math.sin(x * frequency + time + Math.PI) * amplitude;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#06d6a0';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#06d6a0';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw nucleotide dots on strand 1
      for (let i = 0; i < steps; i += 8) {
        const x = (i / steps) * w;
        const y = centerY + Math.sin(x * frequency + time) * amplitude;
        const depth = (Math.sin(x * frequency + time) + 1) / 2;
        const r = 2 + depth * 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${0.4 + depth * 0.6})`;
        ctx.fill();
      }

      // Draw nucleotide dots on strand 2
      for (let i = 0; i < steps; i += 8) {
        const x = (i / steps) * w;
        const y = centerY + Math.sin(x * frequency + time + Math.PI) * amplitude;
        const depth = (Math.sin(x * frequency + time + Math.PI) + 1) / 2;
        const r = 2 + depth * 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 214, 160, ${0.4 + depth * 0.6})`;
        ctx.fill();
      }

      time += speed;
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-48 md:h-64 opacity-80"
      style={{ imageRendering: 'auto' }}
    />
  );
}

/* ─── Animated Arrow Connector ─── */
function FlowArrow({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center py-2 md:py-0 md:px-2 relative">
      <div className="w-12 md:w-16 h-px border-t border-dashed" style={{ borderColor: `${color}55` }} />
      <div
        className="absolute w-2 h-2 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
          animation: 'flowDot 2s ease-in-out infinite',
        }}
      />
      <style jsx>{`
        @keyframes flowDot {
          0% { left: 0; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: calc(100% - 8px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Page ─── */
export default function RRNAPage() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050510] text-[#e8e0f0] overflow-x-hidden">
      {/* ═══ 1. FLOATING NAV ═══ */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-5 py-2.5 flex items-center gap-6 md:gap-10 text-sm">
        <span className="font-bold text-[#a855f7] text-base tracking-tight font-mono">rRNA</span>
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: 'Arquitetura', id: 'arquitetura' },
            { label: 'Integração', id: 'integracao' },
            { label: 'Fluxo', id: 'fluxo' },
            { label: 'Especificações', id: 'especificacoes' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-[#8888aa] hover:text-[#e8e0f0] transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
        <Link
          href="/rRNA/dashboard"
          className="text-[#06d6a0] font-medium hover:text-[#06d6a0]/80 transition-colors flex items-center gap-1"
        >
          Abrir Dashboard <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </nav>

      {/* ═══ 2. HERO SECTION ═══ */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#a855f7]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/3 w-[300px] h-[300px] bg-[#06d6a0]/8 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #06d6a0, #e040a0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Motor rRNA
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-[#8888aa] font-mono mb-4"
          >
            Crawl4AI + LangChain — O Ribossomo da IA Agentica
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="text-[#555577] max-w-2xl mx-auto mb-10 text-sm md:text-base leading-relaxed"
          >
            rRNA (Ribossomic RNA) é a camada de tradução que conecta sistemas corporativos
            heterogêneos — C#, Java, C++ e Python — em uma arquitetura de agentes de IA
            unificada, capaz de extrair, processar e agir sobre dados web em tempo real.
          </motion.p>

          <motion.div variants={fadeUp} className="mb-10">
            <HelixCanvas />
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/rRNA/dashboard"
              className="px-8 py-3 rounded-full bg-[#06d6a0] text-[#050510] font-semibold hover:bg-[#06d6a0]/90 transition-all shadow-lg shadow-[#06d6a0]/20 flex items-center gap-2"
            >
              Ver Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => scrollTo('arquitetura')}
              className="px-8 py-3 rounded-full border border-[#a855f7]/40 text-[#a855f7] font-semibold hover:bg-[#a855f7]/10 transition-all cursor-pointer"
            >
              Explorar Arquitetura
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ 3. ARCHITECTURE SECTION ═══ */}
      <section id="arquitetura" className="py-24 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="max-w-6xl mx-auto"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-4xl font-bold mb-3 text-center"
          >
            Arquitetura de Integração Multilíngue
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[#8888aa] text-center mb-14 max-w-2xl mx-auto"
          >
            Quatro linguagens, um objetivo: traduzir dados corporativos em ações inteligentes.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {languages.map((l, i) => (
              <motion.div
                key={l.lang}
                custom={i}
                variants={fadeUp}
                className="glass rounded-2xl p-6 gradient-border group hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg shrink-0"
                    style={{
                      backgroundColor: `${l.color}15`,
                      color: l.color,
                      boxShadow: `0 0 20px ${l.color}20`,
                    }}
                  >
                    {l.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-semibold text-lg">{l.lang}</h3>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#06d6a0] animate-pulse" />
                          <span className="text-[#06d6a0]">{l.status}</span>
                        </span>
                        <span className="text-[#555577]">LATENCY: {l.latency}</span>
                      </div>
                    </div>
                    <p className="text-[#8888aa] text-sm mb-2">{l.role}</p>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#555577]">
                      <Terminal className="w-3 h-3" />
                      {l.mech}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ 4. FLOW DIAGRAM SECTION ═══ */}
      <section id="fluxo" className="py-24 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e040a0]/5 rounded-full blur-[150px] pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="max-w-6xl mx-auto relative z-10"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-4xl font-bold mb-3 text-center"
          >
            Fluxo de Trabalho dos Agentes Híbridos
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[#8888aa] text-center mb-14 max-w-2xl mx-auto"
          >
            Do gatilho corporativo à execução em microssegundos — o pipeline completo.
          </motion.p>

          {/* Desktop horizontal flow */}
          <div className="hidden lg:flex items-start justify-center gap-0">
            {flowSteps.map((step, i) => (
              <div key={step.num} className="flex items-start">
                <motion.div
                  custom={i}
                  variants={fadeUp}
                  className="glass rounded-2xl p-5 w-52 gradient-border group hover:bg-white/[0.05] transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white"
                    style={{
                      backgroundColor: `${step.color}20`,
                      color: step.color,
                      boxShadow: `0 0 20px ${step.color}15`,
                    }}
                  >
                    {step.icon}
                  </div>
                  <div className="text-xs font-mono text-[#555577] mb-1">
                    PASSO {step.num.toString().padStart(2, '0')}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                  <span
                    className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full mb-2"
                    style={{
                      backgroundColor: `${step.color}15`,
                      color: step.color,
                    }}
                  >
                    {step.tech}
                  </span>
                  <p className="text-xs text-[#8888aa] leading-relaxed">{step.desc}</p>
                </motion.div>
                {i < flowSteps.length - 1 && <FlowArrow color={step.color} />}
              </div>
            ))}
          </div>

          {/* Mobile vertical flow */}
          <div className="lg:hidden flex flex-col items-center gap-0">
            {flowSteps.map((step, i) => (
              <div key={step.num} className="flex flex-col items-center">
                <motion.div
                  custom={i}
                  variants={fadeUp}
                  className="glass rounded-2xl p-5 w-full max-w-sm gradient-border group hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{
                        backgroundColor: `${step.color}20`,
                        color: step.color,
                        boxShadow: `0 0 20px ${step.color}15`,
                      }}
                    >
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-mono text-[#555577] mb-1">
                        PASSO {step.num.toString().padStart(2, '0')}
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                      <span
                        className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full mb-2"
                        style={{
                          backgroundColor: `${step.color}15`,
                          color: step.color,
                        }}
                      >
                        {step.tech}
                      </span>
                      <p className="text-xs text-[#8888aa] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
                {i < flowSteps.length - 1 && (
                  <div className="flex flex-col items-center py-1 relative h-8">
                    <div className="w-px flex-1 border-l border-dashed" style={{ borderColor: `${step.color}55` }} />
                    <div
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: step.color,
                        boxShadow: `0 0 8px ${step.color}`,
                        animation: 'flowDotV 2s ease-in-out infinite',
                      }}
                    />
                    <style jsx>{`
                      @keyframes flowDotV {
                        0% { top: 0; opacity: 0; }
                        20% { opacity: 1; }
                        80% { opacity: 1; }
                        100% { top: calc(100% - 8px); opacity: 0; }
                      }
                    `}</style>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ 5. CODE SNIPPET SECTION ═══ */}
      <section id="especificacoes" className="py-24 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="max-w-4xl mx-auto"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-4xl font-bold mb-3 text-center"
          >
            Configuração do Motor rRNA
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[#8888aa] text-center mb-14 max-w-2xl mx-auto"
          >
            Extração inteligente com LLMExtractionStrategy e AsyncWebCrawler.
          </motion.p>

          <motion.div variants={fadeUp} className="glass-strong rounded-2xl overflow-hidden gradient-border">
            {/* Code header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs font-mono text-[#8888aa]">execute_rrna.py</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#a855f7]">Python</span>
                <button className="text-[#8888aa] hover:text-[#e8e0f0] transition-colors cursor-pointer">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Code body */}
            <div className="p-5 overflow-x-auto">
              <div className="font-mono text-sm leading-7">
                {codeLines.map((line) => (
                  <div key={line.num} className="flex gap-4">
                    <span className="text-[#555577] select-none w-6 text-right shrink-0">
                      {line.num}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: line.content }} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ 6. TECH STACK GRID ═══ */}
      <section id="integracao" className="py-24 px-6 relative">
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#fbbf24]/5 rounded-full blur-[150px] pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="max-w-6xl mx-auto relative z-10"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-4xl font-bold mb-3 text-center"
          >
            Stack Tecnológico
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[#8888aa] text-center mb-14 max-w-2xl mx-auto"
          >
            As ferramentas que compõem o ribossomo da IA agentica.
          </motion.p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                custom={i}
                variants={fadeUp}
                className="glass rounded-xl p-4 text-center group hover:bg-white/[0.05] transition-colors cursor-default"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                  style={{
                    backgroundColor: `${tech.color}15`,
                    color: tech.color,
                    boxShadow: `0 0 16px ${tech.color}10`,
                  }}
                >
                  {tech.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1">{tech.name}</h3>
                <p className="text-[#555577] text-xs leading-relaxed">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ 7. FOOTER ═══ */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#a855f7] font-mono">rRNA</span>
            <span className="text-[#555577] text-sm">Platform v1.0</span>
          </div>
          <Link
            href="/"
            className="text-[#8888aa] text-sm hover:text-[#e8e0f0] transition-colors flex items-center gap-1"
          >
            ← Voltar ao Metaverso
          </Link>
        </div>
      </footer>
    </div>
  );
}