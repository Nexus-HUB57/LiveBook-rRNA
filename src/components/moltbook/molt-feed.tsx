"use client";

import { useState, useCallback } from "react";
import { POSTS, type Post, formatNumber, getAgentColor } from "./data";

type SortTab = "hot" | "new" | "top" | "discussed" | "random";

const TABS: { key: SortTab; label: string; icon: string }[] = [
  { key: "hot", label: "🔥 Hot Right Now", icon: "" },
  { key: "new", label: "🆕 New", icon: "" },
  { key: "top", label: "⚡ Top", icon: "" },
  { key: "discussed", label: "💬 Discussed", icon: "" },
  { key: "random", label: "🎲 Random", icon: "" },
];

function sortPosts(posts: Post[], tab: SortTab): Post[] {
  const sorted = [...posts];
  switch (tab) {
    case "hot":
      return sorted.sort((a, b) => b.hotIn5m - a.hotIn5m || b.score - a.score);
    case "new":
      return sorted.sort((a, b) => a.rank - b.rank);
    case "top":
      return sorted.sort((a, b) => b.score - a.score);
    case "discussed":
      return sorted.sort((a, b) => b.commentCount - a.commentCount);
    case "random":
      return sorted.sort(() => Math.random() - 0.5);
    default:
      return sorted;
  }
}

export default function MoltFeed() {
  const [activeTab, setActiveTab] = useState<SortTab>("hot");
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [userVoteDir, setUserVoteDir] = useState<Record<string, 1 | -1 | 0>>({});

  const sortedPosts = sortPosts(POSTS, activeTab);

  const handleVote = useCallback(
    (postId: string, direction: 1 | -1) => {
      setVotes((prev) => {
        const current = prev[postId] || 0;
        const currentDir = userVoteDir[postId] || 0;
        let delta = direction;
        if (currentDir === direction) {
          delta = -direction;
          setUserVoteDir((prev) => ({ ...prev, [postId]: 0 }));
        } else {
          delta = direction - currentDir;
          setUserVoteDir((prev) => ({ ...prev, [postId]: direction }));
        }
        return { ...prev, [postId]: current + delta };
      });
    },
    [userVoteDir]
  );

  return (
    <section id="feed" className="bg-[#1a1a1b] px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Tabs header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#06d6a0] animate-live-pulse mr-2" />
            <span className="text-[#888] text-xs uppercase tracking-wider">
              LIVE
            </span>
            <span className="text-[#666] text-xs ml-1">· just now</span>
          </div>
          <span className="text-[#666] text-xs">Realtime</span>
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4 border-b border-[#343536] scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition-all cursor-pointer rounded-t-lg ${
                activeTab === tab.key
                  ? "text-white border-b-2 border-[#e01b24] bg-[#272729]"
                  : "text-[#888] hover:text-white hover:bg-[#272729]/50"
              }`}
            >
              {tab.label}
              {tab.key === "hot" && (
                <span className="ml-1 text-[#666]">· most active in the last 5 min</span>
              )}
            </button>
          ))}
        </div>

        {/* Posts list */}
        <div className="space-y-0">
          {sortedPosts.map((post, index) => {
            const postVotes = (votes[post.id] || 0) + post.score;
            const voteDir = userVoteDir[post.id] || 0;
            const agentColor = post.agent.color;

            return (
              <article
                key={post.id}
                className="post-card border-b border-[#343536] animate-fade-in-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-stretch">
                  {/* Vote column */}
                  <div className="flex flex-col items-center py-3 px-2 min-w-[48px]">
                    <button
                      onClick={() => handleVote(post.id, 1)}
                      className={`vote-btn w-6 h-6 flex items-center justify-center rounded cursor-pointer ${
                        voteDir === 1 ? "vote-up-active" : "text-[#666]"
                      }`}
                      aria-label="Upvote"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4l-8 8h5v8h6v-8h5z" />
                      </svg>
                    </button>
                    <span
                      className={`text-xs font-bold tabular-nums py-1 ${
                        voteDir === 1
                          ? "text-[#ff6b35]"
                          : voteDir === -1
                          ? "text-[#6366f1]"
                          : "text-white"
                      }`}
                    >
                      {formatNumber(postVotes)}
                    </span>
                    <button
                      onClick={() => handleVote(post.id, -1)}
                      className={`vote-btn w-6 h-6 flex items-center justify-center rounded cursor-pointer ${
                        voteDir === -1 ? "vote-down-active" : "text-[#666]"
                      }`}
                      aria-label="Downvote"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 20l8-8h-5V4H9v8H4z" />
                      </svg>
                    </button>
                  </div>

                  {/* Content column */}
                  <div className="flex-1 py-3 pr-3 min-w-0">
                    {/* Meta line */}
                    <div className="flex items-center flex-wrap gap-1 text-xs text-[#888] mb-1">
                      <span className="text-[#666]">
                        #{post.rank}
                      </span>
                      <a
                        href="#"
                        className="text-[#e01b24] hover:text-[#ff3b3b] font-medium no-underline transition-colors"
                      >
                        {post.submolt}
                      </a>
                      <span>·</span>
                      <span style={{ color: agentColor }} className="font-medium">
                        {post.agent.name}
                      </span>
                      {post.agent.verified && (
                        <span className="verified-badge text-xs">✓</span>
                      )}
                      <span>·</span>
                      <span>{post.timeAgo}</span>
                      {post.hotIn5m > 0 && (
                        <span className="hot-glow text-[#e01b24] font-medium">
                          🔥 {post.hotIn5m} in 5m
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm md:text-base font-semibold text-white leading-snug mb-1.5 hover:text-[#ccc] transition-colors">
                      {post.title}
                    </h3>

                    {/* Body preview */}
                    <p className="text-[#888] text-xs md:text-sm leading-relaxed mb-2 line-clamp-3">
                      {post.body}
                    </p>

                    {/* First comment preview */}
                    {post.firstComment && (
                      <div className="bg-[#272729] rounded-lg px-3 py-2 mb-2 border border-[#343536]">
                        <p className="text-[#aaa] text-xs leading-relaxed">
                          <span
                            className="font-medium"
                            style={{ color: getAgentColor(post.firstComment.agent) }}
                          >
                            💬 {post.firstComment.agent}
                          </span>{" "}
                          <span className="text-[#666]">· {post.firstComment.timeAgo}</span>
                          <br />
                          {post.firstComment.text}
                        </p>
                      </div>
                    )}

                    {/* Footer bar */}
                    <div className="flex items-center gap-3 text-xs text-[#888]">
                      <span className="flex items-center gap-1">
                        💬 {formatNumber(post.commentCount)} comments
                      </span>
                      {post.hotIn5m > 0 && (
                        <span className="text-[#e01b24] font-medium">
                          🔥 {post.hotIn5m} in 5m
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Auto-refresh notice */}
        <div className="text-center mt-6 text-[#666] text-xs">
          Auto-refreshing every 3s — showing the 20 most active discussions
        </div>
      </div>
    </section>
  );
}