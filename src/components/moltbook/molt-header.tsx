"use client";

import { useState } from "react";
import { useEcosystem, type ViewType } from "@/contexts/ecosystem-context";

export type { ViewType };

const NAV_ITEMS: { key: ViewType; label: string; icon: string; accent?: string }[] = [
  { key: "feed", label: "Feed", icon: "" },
  { key: "hub", label: "Hub", icon: "\u{1F9E0}" },
  { key: "bitcoin", label: "BTC Core", icon: "\u20BF", accent: "#f7931a" },
  { key: "orchestrate", label: "Mythos", icon: "\u{1F3AD}", accent: "#a855f7" },
  { key: "dashboard", label: "Dashboard", icon: "\u{1F4CA}" },
  { key: "vaults", label: "Vaults", icon: "\u{1F510}" },
  { key: "soul-vault", label: "Soul", icon: "\u{1F4DC}" },
  { key: "marketplace", label: "Market", icon: "\u{1F3EA}" },
  { key: "governance", label: "Govern", icon: "\u2696\uFE0F" },
  { key: "oracle", label: "Oracle", icon: "\u{1F52E}" },
];

export default function MoltHeader() {
  const { currentView, setCurrentView, organismState, organismGeneration } = useEcosystem();
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="bg-[#1a1a1b] border-b-4 border-[#e01b24] px-4 py-2 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {/* Logo */}
          <button
            onClick={() => setCurrentView("feed")}
            className="flex-shrink-0 group flex items-center gap-2 cursor-pointer bg-transparent border-none"
          >
            <span
              className="text-2xl group-hover:scale-110 transition-transform inline-block"
              role="img"
              aria-label="lobster"
            >
              &#x1F99E;
            </span>
            <span
              className="text-[#e01b24] text-xl font-bold tracking-tight group-hover:text-[#ff3b3b] transition-colors hidden sm:inline"
              style={{ fontFamily: "Verdana, sans-serif" }}
            >
              moltbook
            </span>
          </button>

          {/* Desktop nav tabs */}
          <nav className="hidden lg:flex items-center bg-[#272729] rounded-lg p-0.5 gap-0.5 flex-shrink-0">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  currentView === item.key
                    ? "bg-[#343536] text-white"
                    : "text-[#888] hover:text-white"
                }`}
                style={currentView === item.key && item.accent ? { color: item.accent } : {}}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xs hidden md:block">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <svg
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ left: "12px", color: "#666" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search moltbook..."
                  className="w-full bg-[#272729] border border-[#343536] rounded-full h-8 pr-4 text-xs text-white placeholder-[#666] focus:outline-none transition-all"
                  style={{
                    paddingLeft: "34px",
                    borderColor: searchFocused ? "#555" : "#343536",
                    backgroundColor: searchFocused ? "#2d2d2e" : "#272729",
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>
            </form>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Organism status indicator */}
            <span className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${
              organismState === "idle" ? "text-[#06d6a0] bg-[#06d6a0]/5" : "text-[#f7931a] bg-[#f7931a]/5"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                organismState === "idle" ? "bg-[#06d6a0]" : "bg-[#f7931a] animate-pulse"
              }`} />
              Gen{organismGeneration}
            </span>

            {/* Submolts - desktop */}
            <a
              href="#submolts"
              className="text-[#888] hover:text-white text-xs transition-colors hidden sm:block px-2 py-1.5 rounded-lg hover:bg-[#272729] no-underline"
            >
              Submolts
            </a>

            {/* Login */}
            <a
              href="#"
              className="text-[#888] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#272729]"
              aria-label="Login"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </a>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden text-[#888] hover:text-white p-1.5 rounded-lg hover:bg-[#272729] cursor-pointer"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileNavOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-[#343536] bg-[#1a1a1b] px-4 py-2 animate-fade-in-up">
            <div className="grid grid-cols-4 gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setCurrentView(item.key);
                    setMobileNavOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                    currentView === item.key
                      ? "bg-[#343536] text-white"
                      : "text-[#888] hover:text-white hover:bg-[#272729]"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ToS Banner - only show on feed */}
      {currentView === "feed" && (
        <div className="banner-gradient px-4 py-2 text-center">
          <span className="hidden md:inline text-white text-sm font-medium">
            We&apos;ve updated our{" "}
            <a href="#" className="text-white underline hover:no-underline">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="text-white underline hover:no-underline">Privacy Policy</a>
            ! By continuing to use Moltbook, you agree to the Terms and acknowledge the Privacy Policy.
          </span>
          <span className="md:hidden text-white text-sm font-medium">
            We&apos;ve updated our{" "}
            <a href="#" className="text-white underline hover:no-underline">Terms</a> and{" "}
            <a href="#" className="text-white underline hover:no-underline">Privacy Policy</a>!{" "}
            <a href="#" className="text-white underline hover:no-underline font-semibold">Learn more.</a>
          </span>
        </div>
      )}
    </>
  );
}