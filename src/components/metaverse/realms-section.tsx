'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Infinity, Eye, Layers, Sparkles } from 'lucide-react';

interface RealmCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  glowColor: string;
}

const realms: RealmCard[] = [
  {
    icon: <Infinity className="w-8 h-8" />,
    title: 'Eternidade Digital',
    description:
      'No metaverso, o conceito de tempo se dissolve. Espacos que existem fora do relogio, onde cada momento e simultaneamente passado, presente e futuro. Aqui, as experiencias nao envelhecem — elas se transformam, evoluem e renascem a cada interacao.',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.15)',
  },
  {
    icon: <Eye className="w-8 h-8" />,
    title: 'Percepcao Expandida',
    description:
      'Alem da realidade fisica, o metaverso oferece camadas de percepcao que desafiam os sentidos convencionais. Visualize dados como paisagens, sinta emocoes como texturas e navegue por dimensoes onde a fisica e apenas uma sugestao.',
    color: '#06d6a0',
    glowColor: 'rgba(6, 214, 160, 0.15)',
  },
  {
    icon: <Layers className="w-8 h-8" />,
    title: 'Dimensoes Sobrepostas',
    description:
      'Multiplas camadas de realidade coexistem em harmonia. Cada dimensao oferece uma perspectiva unica do mesmo universo, criando um caleidoscopio infinito de possibilidades que se entrelacam e criam novas formas de existencia.',
    color: '#e040a0',
    glowColor: 'rgba(224, 64, 160, 0.15)',
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: 'Criacao Coletiva',
    description:
      'Mentes de todo o mundo convergem para construir algo que nenhuma poderia criar sozinha. O metaverso e a maior obra de arte colaborativa da humanidade — um espaco onde cada acao de um visitante reshape a realidade compartilhada.',
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.15)',
  },
];

function RealmCard({ realm, index }: { realm: RealmCard; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: 'easeOut' }}
      className="group relative"
    >
      <div
        className="relative h-full p-6 sm:p-8 rounded-2xl transition-all duration-500 hover:-translate-y-2"
        style={{
          background: 'rgba(13, 13, 36, 0.6)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${realm.color}20`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 0 40px ${realm.glowColor}, inset 0 0 40px ${realm.glowColor}`;
          e.currentTarget.style.borderColor = `${realm.color}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = `${realm.color}20`;
        }}
      >
        {/* Icon */}
        <div
          className="mb-5 sm:mb-6 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all duration-500"
          style={{ background: `${realm.color}15`, color: realm.color }}
        >
          {realm.icon}
        </div>

        {/* Title */}
        <h3
          className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4"
          style={{ color: realm.color }}
        >
          {realm.title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-[#8888aa] leading-relaxed">
          {realm.description}
        </p>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(to right, transparent, ${realm.color}, transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}

export default function RealmsSection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-80px' });

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div ref={titleRef} className="text-center mb-14 sm:mb-20">
          <motion.span
            className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-[#06d6a0] mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            Explorar Dimensoes
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-glow-purple"
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Reinos do{' '}
            <span className="bg-gradient-to-r from-[#a855f7] to-[#e040a0] bg-clip-text text-transparent">
              Metaverso
            </span>
          </motion.h2>
          <motion.p
            className="mt-4 sm:mt-6 text-[#8888aa] max-w-xl mx-auto text-sm sm:text-base"
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Cada reino oferece uma experiencia unica, um fragmento de um universo infinito que espera ser descoberto.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {realms.map((realm, i) => (
            <RealmCard key={realm.title} realm={realm} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}