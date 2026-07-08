import ParticlesCanvas from '@/components/metaverse/particles-canvas';
import HeroSection from '@/components/metaverse/hero-section';
import RealmsSection from '@/components/metaverse/realms-section';
import ExperienceSection from '@/components/metaverse/experience-section';
import TimelineSection from '@/components/metaverse/timeline-section';
import QuoteSection from '@/components/metaverse/quote-section';
import CTASection from '@/components/metaverse/cta-section';
import WormholeBlackholeSection from '@/components/metaverse/wormhole-blackhole-section';
import RecoverySection from '@/components/metaverse/recovery-section';
import ZettaScaleDashboard from '@/components/metaverse/zettascale-dashboard';
import AgenticRAGSection from '@/components/metaverse/agentic-rag-section';
import FooterSection from '@/components/metaverse/footer-section';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated particle background */}
      <ParticlesCanvas />

      {/* Main content */}
      <main className="relative z-10 flex-1">
        <HeroSection />
        <RealmsSection />
        <ExperienceSection />
        <TimelineSection />
        <QuoteSection />
        <CTASection />
        <WormholeBlackholeSection />
        <RecoverySection />
        <ZettaScaleDashboard />
        <AgenticRAGSection />
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}