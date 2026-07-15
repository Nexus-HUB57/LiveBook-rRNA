'use client';

import { useEffect, useRef } from 'react';
import ParticlesCanvas from '@/components/metaverse/particles-canvas';
import HeroSection from '@/components/metaverse/hero-section';
import ExperienceSection from '@/components/metaverse/experience-section';
import RealmsSection from '@/components/metaverse/realms-section';
import TimelineSection from '@/components/metaverse/timeline-section';
import QuoteSection from '@/components/metaverse/quote-section';
import CTASection from '@/components/metaverse/cta-section';
import FooterSection from '@/components/metaverse/footer-section';

export default function MetaversoTab() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative min-h-[calc(100vh-180px)] bg-black overflow-auto rounded-xl">
      <ParticlesCanvas />
      <div className="relative z-10">
        <HeroSection />
        <ExperienceSection />
        <RealmsSection />
        <TimelineSection />
        <QuoteSection />
        <CTASection />
        <FooterSection />
      </div>
    </div>
  );
}