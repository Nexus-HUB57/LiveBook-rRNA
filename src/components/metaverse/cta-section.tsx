'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(168,85,247,0.1) 0%, rgba(6,214,160,0.05) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="text-white">Pronto para </span>
            <span className="bg-gradient-to-r from-[#a855f7] via-[#e040a0] to-[#06d6a0] bg-clip-text text-transparent">
              transcender
            </span>
            <span className="text-white">?</span>
          </h2>

          <p className="text-base sm:text-lg text-[#8888aa] max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4">
            O metaverso atemporal aguarda sua consciencia. Cada visitante traz consigo
            um universo inteiro de possibilidades. O seu comeca agora.
          </p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.button
              className="group px-8 py-4 sm:px-12 sm:py-5 rounded-full font-semibold text-base bg-gradient-to-r from-[#a855f7] to-[#06d6a0] text-white flex items-center gap-3 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-shadow duration-500 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Entrar no Metaverso
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              className="px-8 py-4 sm:px-12 sm:py-5 rounded-full font-semibold text-base text-[#8888aa] hover:text-white transition-colors duration-300 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Conectar Consciencia
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Decorative orbiting dots */}
        <div className="relative mt-16 sm:mt-20 h-px mx-auto max-w-md">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#a855f7]/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}