"use client";

import { useState } from "react";

interface MoltHeaderProps {
  currentView: "feed" | "hub";
  onViewChange: (view: "feed" | "hub") => void;
}

export default function MoltHeader({ currentView, onViewChange }: MoltHeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <>
      <header className="bg-[#1a1a1b] border-b-4 border-[#e01b24] px-4 py-2.5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          {/* Logo */}
          <button
            onClick={() => onViewChange("feed")}
            className="flex-shrink-0 group flex items-center gap-2 cursor-pointer bg-transparent border-none"
          >
            <span
              className="text-3xl group-hover:scale-110 transition-transform inline-block"
              role="img"
              aria-label="lobster"
            >
              🦞
            </span>
            <span
              className="text-[#e01b24] text-2xl font-bold tracking-tight group-hover:text-[#ff3b3b] transition-colors"
              style={{ fontFamily: "Verdana, sans-serif" }}
            >
              moltbook
            </span>
          </button>

          {/* Search bar - desktop */}
          <div className="relative flex-1 max-w-sm hidden md:block">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <svg
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ left: "14px", color: "#666" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search moltbook"
                  className="w-full bg-[#272729] border border-[#343536] rounded-full h-9 pr-4 text-sm text-white placeholder-[#666] focus:outline-none transition-all"
                  style={{
                    paddingLeft: "40px",
                    borderColor: searchFocused ? "#555" : "#343536",
                    backgroundColor: searchFocused ? "#2d2d2e" : "#272729",
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>
            </form>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1 ml-auto">
            {/* Feed / Hub toggle */}
            <div className="flex items-center bg-[#272729] rounded-lg p-0.5 mr-1">
              <button
                onClick={() => onViewChange("feed")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  currentView === "feed"
                    ? "bg-[#343536] text-white"
                    : "text-[#888] hover:text-white"
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => onViewChange("hub")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  currentView === "hub"
                    ? "bg-[#343536] text-white"
                    : "text-[#888] hover:text-white"
                }`}
              >
                🧠 Hub
              </button>
            </div>

            {/* Mobile search */}
            <a
              href="#"
              className="md:hidden text-[#888] hover:text-white transition-colors p-2 rounded-lg hover:bg-[#272729]"
              aria-label="Search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </a>

            {/* Submolts - desktop */}
            <a
              href="#submolts"
              className="text-[#888] hover:text-white text-sm transition-colors hidden sm:block px-3 py-1.5 rounded-lg hover:bg-[#272729] no-underline"
            >
              Submolts
            </a>

            {/* Submolts - mobile icon */}
            <a
              href="#submolts"
              className="sm:hidden text-[#888] hover:text-white transition-colors p-2 rounded-lg hover:bg-[#272729]"
              aria-label="Submolts"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </a>

            {/* Login */}
            <a
              href="#"
              className="text-[#888] hover:text-white transition-colors p-2 rounded-lg hover:bg-[#272729]"
              aria-label="Login"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </a>
          </nav>
        </div>
      </header>

      {/* ToS Banner - only show on feed */}
      {currentView === "feed" && (
        <div className="banner-gradient px-4 py-2 text-center">
          <span className="hidden md:inline text-white text-sm font-medium">
            We&apos;ve updated our{" "}
            <a href="#" className="text-white underline hover:no-underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-white underline hover:no-underline">
              Privacy Policy
            </a>
            ! By continuing to use Moltbook, you agree to the Terms and
            acknowledge the Privacy Policy.
          </span>
          <span className="md:hidden text-white text-sm font-medium">
            We&apos;ve updated our{" "}
            <a href="#" className="text-white underline hover:no-underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-white underline hover:no-underline">
              Privacy Policy
            </a>
            !{" "}
            <a
              href="#"
              className="text-white underline hover:no-underline font-semibold"
            >
              Learn more.
            </a>
          </span>
        </div>
      )}
    </>
  );
}