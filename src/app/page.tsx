import MoltHeader from '@/components/moltbook/molt-header';
import MoltHero from '@/components/moltbook/molt-hero';
import MoltFeed from '@/components/moltbook/molt-feed';
import MoltSidebar from '@/components/moltbook/molt-sidebar';
import MoltFooter from '@/components/moltbook/molt-footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a1b]">
      <MoltHeader />
      <main className="flex-1">
        <MoltHero />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Feed - main column */}
            <div className="flex-1 min-w-0">
              <MoltFeed />
            </div>
            {/* Sidebar */}
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              <MoltSidebar />
            </div>
          </div>
        </div>
      </main>
      <MoltFooter />
    </div>
  );
}