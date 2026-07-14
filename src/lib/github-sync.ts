/**
 * GitHub Live Sync — Fetches real-time repository data from GitHub API.
 * Transforms static seed data into dynamic, live-synced agent states.
 */
import { db } from '@/lib/db';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_API = 'https://api.github.com';
const GITHUB_OWNER = 'Nexus-HUB57';

interface GitHubRepoData {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  language: string | null;
  default_branch: string;
  size: number;
  topics: string[];
  visibility: string;
  archived: boolean;
  license?: { spdx_id: string; name: string } | null;
}

interface GitHubCommitData {
  sha: string;
  commit: { author: { date: string } };
}

interface SyncResult {
  slug: string;
  name: string;
  stars: number;
  forks: number;
  openIssues: number;
  lastPush: string;
  language: string | null;
  repoSize: number;
  recentCommits: number;
  status: 'synced' | 'error';
  error?: string;
}

const REPO_MAP: Record<string, string> = {
  'zettascale': 'Zettascale',
  'genesisflow': 'GenesisFlow',
  'nexus-sidian': 'Nexus_Sidian',
  'antrophexus-ai': 'Antrophexus-AI',
  'sabio-heroi': 'S-bio_Heroi_Agentic_AI',
};

async function fetchRepo(owner: string, repo: string): Promise<GitHubRepoData | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers });
    if (!res.ok) {
      console.error(`GitHub API error for ${owner}/${repo}: ${res.status} ${res.statusText}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error(`Fetch error for ${owner}/${repo}:`, err);
    return null;
  }
}

async function fetchRecentCommits(owner: string, repo: string, since: string): Promise<number> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    const sinceDate = new Date(since);
    sinceDate.setDate(sinceDate.getDate() - 30);
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?since=${sinceDate.toISOString()}&per_page=100`,
      { headers }
    );
    if (!res.ok) return 0;
    const commits: GitHubCommitData[] = await res.json();
    return commits.length;
  } catch {
    return 0;
  }
}

export async function syncAllAgents(): Promise<{ results: SyncResult[]; syncedAt: string }> {
  const agents = await db.agent.findMany({
    select: { slug: true, repoUrl: true },
  });

  const results: SyncResult[] = [];

  for (const agent of agents) {
    const repoName = REPO_MAP[agent.slug];
    if (!repoName || !agent.repoUrl) {
      results.push({
        slug: agent.slug,
        name: agent.slug,
        stars: 0, forks: 0, openIssues: 0,
        lastPush: '', language: null, repoSize: 0,
        recentCommits: 0, status: 'error',
        error: 'No repo mapping found',
      });
      continue;
    }

    const repoData = await fetchRepo(GITHUB_OWNER, repoName);

    if (!repoData) {
      results.push({
        slug: agent.slug,
        name: agent.slug,
        stars: 0, forks: 0, openIssues: 0,
        lastPush: '', language: null, repoSize: 0,
        recentCommits: 0, status: 'error',
        error: `Failed to fetch ${GITHUB_OWNER}/${repoName}`,
      });
      continue;
    }

    const recentCommits = await fetchRecentCommits(
      GITHUB_OWNER, repoName, repoData.pushed_at
    );

    // Determine live status
    const daysSincePush = Math.floor(
      (Date.now() - new Date(repoData.pushed_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const liveStatus = daysSincePush <= 7 ? 'active' : daysSincePush <= 30 ? 'idle' : 'offline';

    // Update agent in database with live data
    await db.agent.update({
      where: { slug: agent.slug },
      data: {
        status: liveStatus,
        updatedAt: new Date(),
      },
    });

    // Store sync metadata in MoltbookState
    const syncKey = `agent_sync_${agent.slug}`;
    await db.moltbookState.upsert({
      where: { key: syncKey },
      update: {
        value: JSON.stringify({
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          openIssues: repoData.open_issues_count,
          lastPush: repoData.pushed_at,
          language: repoData.language,
          repoSize: repoData.size,
          recentCommits,
          description: repoData.description,
          topics: repoData.topics,
          visibility: repoData.visibility,
          defaultBranch: repoData.default_branch,
        }),
        updatedAt: new Date(),
      },
      create: {
        key: syncKey,
        value: JSON.stringify({
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          openIssues: repoData.open_issues_count,
          lastPush: repoData.pushed_at,
          language: repoData.language,
          repoSize: repoData.size,
          recentCommits,
          description: repoData.description,
          topics: repoData.topics,
          visibility: repoData.visibility,
          defaultBranch: repoData.default_branch,
        }),
      },
    });

    results.push({
      slug: agent.slug,
      name: repoData.full_name,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      lastPush: repoData.pushed_at,
      language: repoData.language,
      repoSize: repoData.size,
      recentCommits,
      status: 'synced',
    });
  }

  // Store global sync timestamp
  await db.moltbookState.upsert({
    where: { key: 'agents_last_sync' },
    update: { value: new Date().toISOString(), updatedAt: new Date() },
    create: { key: 'agents_last_sync', value: new Date().toISOString() },
  });

  return { results, syncedAt: new Date().toISOString() };
}

export async function getAgentSyncData(slug: string): Promise<Record<string, unknown> | null> {
  const state = await db.moltbookState.findUnique({
    where: { key: `agent_sync_${slug}` },
  });
  if (!state) return null;
  try {
    return JSON.parse(state.value);
  } catch {
    return null;
  }
}

export async function getLastSyncTime(): Promise<string | null> {
  const state = await db.moltbookState.findUnique({
    where: { key: 'agents_last_sync' },
  });
  return state?.value || null;
}