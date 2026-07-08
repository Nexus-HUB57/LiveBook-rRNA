'use client';

import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Zap, Globe, Clock, Cpu } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Tempo Fluido',
    description:
      'O tempo no metaverso nao e linear — ele flui como um rio que pode ser navegado em qualquer direcao. Voce pode reviver momentos, antecipar futuros e existir em multiplas temporalidades simultaneamente.',
    stat: '∞',
    statLabel: 'Possibilidades temporais',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Espaco Ilimitado',
    description:
      'Sem as limitacoes da fisica terrestre, o espaco no metaverso se expande conforme a imaginacao. Cada visitante pode criar, moldar e habitar universos inteiros sem restricoes de area ou distancia.',
    stat: '10⁹',
    statLabel: 'Metros quadrados virtuais',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Consciencia Permanente',
    description:
      'O metaverso nunca dorme. Enquanto voce descansa, o mundo continua evoluindo, aprendendo e se adaptando. Cada retorno traz novas surpresas, criacoes e conexoes que nasceram durante sua ausencia.',
    stat: '24/7',
    statLabel: 'Sempre ativo e evolvindo',
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: 'Evolucao Neural',
    description:
      'Impulsionado por inteligencia artificial avancada, o metaverso aprende com cada interacao. Quanto mais voce explora, mais o ambiente se adapta as suas preferencias, criando uma experiencia verdadeiramente personalizada.',
    stat: 'AI',
    statLabel: 'Aprendizado continuo',
  },
];

function FeatureItem({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
      className={`flex flex-col ${
        isEven ? 'md:flex-row' : 'md:flex-row-reverse'
      } gap-6 sm:gap-8 items-center`}
    >
      {/* Text content */}
      <div className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'} text-center md:text-left`}>
        <div className={`inline-flex items-center gap-2 text-[#06d6a0] mb-3 ${!isEven ? 'md:flex-row-reverse' : ''}`}>
          {feature.icon}
          <span className="text-xs font-mono tracking-[0.2em] uppercase">Recurso {String(index + 1).padStart(2, '0')}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white">{feature.title}</h3>
        <p className="text-sm sm:text-base text-[#8888aa] leading-relaxed max-w-lg">
          {feature.description}
        </p>
      </div>

      {/* Stat block */}
      <div className="flex-shrink-0">
        <motion.div
          className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl glass flex flex-col items-center justify-center gradient-border"
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#a855f7] to-[#06d6a0] bg-clip-text text-transparent">
            {feature.stat}
          </span>
          <span className="text-[10px] sm:text-xs text-[#8888aa] mt-2 text-center px-3 leading-relaxed">
            {feature.statLabel}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function ExperienceSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-80px' });
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <section ref={containerRef} className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Parallax background glow */}
      <motion.div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          y: bgY,
          background: 'radial-gradient(circle, rgba(6, 214, 160, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header */}
        <div ref={titleRef} className="text-center mb-14 sm:mb-20">
          <motion.span
            className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-[#e040a0] mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            A Experiencia
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-glow-cyan"
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Alem dos{' '}
            <span className="bg-gradient-to-r from-[#06d6a0] to-[#a855f7] bg-clip-text text-transparent">
              Limites
            </span>
          </motion.h2>
          <motion.p
            className="mt-4 sm:mt-6 text-[#8888aa] max-w-xl mx-auto text-sm sm:text-base"
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Recursos que desafiam as leis da fisica e redefinem o que significa existir em um espaco digital.
          </motion.p>
        </div>

        {/* Features list */}
        <div className="space-y-16 sm:space-y-24">
          {features.map((feature, i) => (
            <FeatureItem key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}