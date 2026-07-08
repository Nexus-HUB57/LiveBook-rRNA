'use client';

import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden">
      {/* Radial glow background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(224,64,160,0.2) 40%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[15%] left-[10%] w-16 h-16 sm:w-24 sm:h-24 border border-[#a855f7]/20 rounded-xl rotate-45"
          animate={{ rotate: [45, 90, 45], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[25%] right-[15%] w-12 h-12 sm:w-16 sm:h-16 border border-[#06d6a0]/20 rounded-full"
          animate={{ scale: [1, 1.2, 1], y: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[30%] left-[20%] w-8 h-8 sm:w-12 sm:h-12 bg-[#e040a0]/10 rounded-lg"
          animate={{ rotate: [0, 180, 360], y: [0, -25, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[10%] w-6 h-6 sm:w-10 sm:h-10 border border-[#fbbf24]/20 rounded-full"
          animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[60%] left-[50%] w-20 h-20 sm:w-28 sm:h-28 border border-[#8b5cf6]/10 rounded-3xl"
          animate={{ rotate: [0, -45, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <span className="inline-block text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-[#a855f7] mb-6 sm:mb-8 border border-[#a855f7]/20 px-4 py-2 rounded-full">
            Metaverso &bull; Atemporal &bull; Infinito
          </span>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
        >
          <span className="block text-glow-purple bg-gradient-to-r from-[#a855f7] via-[#e040a0] to-[#06d6a0] bg-clip-text text-transparent">
            Um Mundo
          </span>
          <span className="block text-glow-cyan mt-1 sm:mt-2">
            Atemporal
          </span>
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg md:text-xl text-[#8888aa] max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
        >
          Onde o tempo se dissolve, a realidade se expande e cada instante 
          se torna uma eternidade. Bem-vindo ao limite entre o possivel e o imaginado.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
        >
          <motion.button
            className="px-8 py-3 sm:px-10 sm:py-4 rounded-full font-semibold text-sm sm:text-base bg-gradient-to-r from-[#a855f7] to-[#e040a0] text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-shadow duration-500 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Explorar o Metaverso
          </motion.button>
          <motion.button
            className="px-8 py-3 sm:px-10 sm:py-4 rounded-full font-semibold text-sm sm:text-base border border-[#a855f7]/30 text-[#a855f7] hover:bg-[#a855f7]/10 transition-colors duration-300 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Saiba Mais
          </motion.button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <span className="text-xs text-[#8888aa] tracking-widest uppercase">Role para descobrir</span>
        <motion.div
          className="w-5 h-8 rounded-full border border-[#a855f7]/30 flex items-start justify-center p-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#a855f7]"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}