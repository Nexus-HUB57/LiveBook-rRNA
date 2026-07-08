'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const quotes = [
  {
    text: 'O metaverso nao e um lugar para onde vamos — e o que nos tornamos quando transcendemos as fronteiras do possivel.',
    author: 'Pensador Digital',
  },
  {
    text: 'No mundo atemporal, a unica constante e a mudanca infinita. Cada segundo contem universos inteiros de experiencias.',
    author: 'Arquiteto de Realidades',
  },
  {
    text: 'A verdadeira liberdade nao e a ausencia de limites, mas a capacidade de recria-los a cada instante.',
    author: 'Explorador do Metaverso',
  },
];

export default function QuoteSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [activeQuote, setActiveQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveQuote((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={ref} className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[700px] h-[400px] opacity-10"
          style={{
            background: 'radial-gradient(ellipse, rgba(168,85,247,0.5) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Quote marks */}
          <div className="text-6xl sm:text-8xl font-serif leading-none mb-4 bg-gradient-to-r from-[#a855f7] to-[#e040a0] bg-clip-text text-transparent opacity-40">
            &ldquo;
          </div>

          {/* Quote text with animation */}
          <div className="relative h-32 sm:h-24">
            {quotes.map((quote, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={false}
                animate={{
                  opacity: activeQuote === i ? 1 : 0,
                  y: activeQuote === i ? 0 : 20,
                  filter: activeQuote === i ? 'blur(0px)' : 'blur(4px)',
                }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-lg sm:text-xl md:text-2xl font-light text-white/90 leading-relaxed italic px-4">
                  {quote.text}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Author */}
          <motion.p
            className="mt-6 text-sm text-[#a855f7] font-mono tracking-wider"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            — {quotes[activeQuote].author}
          </motion.p>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {quotes.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveQuote(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  activeQuote === i
                    ? 'bg-[#a855f7] w-6'
                    : 'bg-[#a855f7]/30 hover:bg-[#a855f7]/50'
                }`}
                aria-label={`Ir para citação ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}