'use client';

import { motion } from 'framer-motion';
import { Hexagon, Github, Twitter, Globe } from 'lucide-react';

const footerLinks = [
  {
    title: 'Explorar',
    links: ['Reinos', 'Experiencias', 'Linha do Tempo', 'Comunidade'],
  },
  {
    title: 'Recursos',
    links: ['Documentacao', 'API', 'SDK', 'Tutoriais'],
  },
  {
    title: 'Comunidade',
    links: ['Discord', 'Forum', 'Eventos', 'Blog'],
  },
];

const socialIcons = [
  { icon: <Globe className="w-5 h-5" />, label: 'Website' },
  { icon: <Github className="w-5 h-5" />, label: 'GitHub' },
  { icon: <Twitter className="w-5 h-5" />, label: 'Twitter' },
];

export default function FooterSection() {
  return (
    <footer className="relative mt-auto border-t border-[#a855f7]/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <motion.div
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#06d6a0] flex items-center justify-center">
                <Hexagon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">MetaTempo</span>
            </motion.div>
            <p className="text-sm text-[#8888aa] leading-relaxed max-w-xs mb-6">
              Um mundo atemporal no metaverso. Onde a realidade se encontra com o infinito.
            </p>
            <div className="flex gap-3">
              {socialIcons.map((social) => (
                <button
                  key={social.label}
                  className="w-10 h-10 rounded-lg glass flex items-center justify-center text-[#8888aa] hover:text-[#a855f7] hover:border-[#a855f7]/30 transition-all duration-300 cursor-pointer"
                  aria-label={social.label}
                >
                  {social.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group, i) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[#8888aa] hover:text-[#a855f7] transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-[#a855f7]/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#8888aa]/60">
            &copy; {new Date().getFullYear()} MetaTempo. Todos os direitos reservados.
          </p>
          <p className="text-xs text-[#8888aa]/40 font-mono">
            UM MUNDO ATEMPORAL NO METAVERSO
          </p>
        </div>
      </div>
    </footer>
  );
}