'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';

const timelineEvents = [
  {
    era: 'Era Genesis',
    year: '2024',
    title: 'A Semente Digital',
    description:
      'Os primeiros alicerces do metaverso atemporal sao lancados. Protótipos rudimentares de mundos virtuais comecam a surgir, alimentados por imaginação coletiva e tecnologia emergente de inteligencia artificial.',
    color: '#a855f7',
  },
  {
    era: 'Era da Expansao',
    year: '2027',
    title: 'Mundos Conectados',
    description:
      'Diferentes plataformas e ecossistemas virtuais comecam a se interconectar. Barreiras entre metaversos se dissolvem, criando um universo digital unificado onde bilhoes de experiencias coexistem.',
    color: '#06d6a0',
  },
  {
    era: 'Era da Consciencia',
    year: '2030',
    title: 'Sintese Atemporal',
    description:
      'O conceito de tempo e completamente redefinido. Habitantes do metaverso experimentam a "eternidade digital" — a capacidade de existir, criar e evoluir em um espaco onde passado, presente e futuro coexistem.',
    color: '#e040a0',
  },
  {
    era: 'Era Transcendente',
    year: '2035',
    title: 'Alem do Virtual',
    description:
      'A fronteira entre realidade fisica e digital se torna irrelevante. O metaverso atemporal emerge como uma nova forma de existencia, tao real e significativa quanto o mundo tangivel que conhecemos.',
    color: '#fbbf24',
  },
];

function TimelineItem({ event, index }: { event: typeof timelineEvents[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      className={`relative flex items-start gap-4 sm:gap-6 mb-12 sm:mb-16 ${
        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
      } flex-col md:flex-row`}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
    >
      {/* Content card */}
      <div className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
        <div
          className="glass-strong rounded-2xl p-5 sm:p-6 inline-block max-w-md transition-all duration-300 hover:scale-[1.02]"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${event.color}40`;
            e.currentTarget.style.boxShadow = `0 0 30px ${event.color}15`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span
            className="text-xs font-mono tracking-[0.2em] uppercase"
            style={{ color: event.color }}
          >
            {event.era} &bull; {event.year}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-white mt-2 mb-3">{event.title}</h3>
          <p className="text-sm text-[#8888aa] leading-relaxed">{event.description}</p>
        </div>
      </div>

      {/* Center dot */}
      <div className="hidden md:flex flex-col items-center flex-shrink-0">
        <motion.div
          className="w-5 h-5 rounded-full border-2 z-10"
          style={{ borderColor: event.color, background: `${event.color}30` }}
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
      </div>

      {/* Spacer for alignment */}
      <div className="hidden md:block flex-1" />
    </motion.div>
  );
}

export default function TimelineSection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-80px' });

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(224, 64, 160, 0.06) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section header */}
        <div ref={titleRef} className="text-center mb-14 sm:mb-20">
          <motion.span
            className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-[#fbbf24] mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            Evolucao
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-glow-magenta"
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            A{' '}
            <span className="bg-gradient-to-r from-[#e040a0] to-[#fbbf24] bg-clip-text text-transparent">
              Jornada
            </span>
          </motion.h2>
          <motion.p
            className="mt-4 sm:mt-6 text-[#8888aa] max-w-xl mx-auto text-sm sm:text-base"
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Uma linha do tempo que conecta o presente a um futuro onde o metaverso e a propria realidade.
          </motion.p>
        </div>

        {/* Timeline line - desktop */}
        <div className="hidden md:block absolute left-1/2 top-[20%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-[#a855f7]/30 to-transparent" />

        {/* Timeline events */}
        <div>
          {timelineEvents.map((event, i) => (
            <TimelineItem key={event.title} event={event} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}