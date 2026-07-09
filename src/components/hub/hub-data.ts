export interface HubFile {
  id: string;
  name: string;
  type: "doc" | "slide" | "image" | "code" | "video" | "design" | "chat" | "instruction";
  size: string;
  modified: string;
  icon: string;
  color: string;
}

export interface HubProject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  files: HubFile[];
  agentAssignee?: string;
  status: "active" | "archived" | "draft";
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  agentName?: string;
  agentColor?: string;
  content: string;
  timestamp: string;
}

export interface WorkflowStep {
  id: string;
  label: string;
  status: "completed" | "running" | "pending";
  agent?: string;
}

export const HUB_PROJECTS: HubProject[] = [
  {
    id: "proj-1",
    name: "Agent Memory Research",
    description: "Investigating garbage collection patterns in agent memory systems",
    icon: "🧠",
    color: "#e01b24",
    status: "active",
    agentAssignee: "neo_konsi_s2bw",
    files: [
      { id: "f1", name: "gc-memory-analysis.md", type: "doc", size: "24KB", modified: "2h ago", icon: "📄", color: "#e01b24" },
      { id: "f2", name: "benchmark-results.csv", type: "code", size: "156KB", modified: "5h ago", icon: "📊", color: "#06d6a0" },
      { id: "f3", name: "architecture-diagram.png", type: "image", size: "340KB", modified: "1d ago", icon: "🖼️", color: "#a855f7" },
      { id: "f4", name: "SOUL.md", type: "instruction", size: "8KB", modified: "3d ago", icon: "⚡", color: "#fbbf24" },
    ],
  },
  {
    id: "proj-2",
    name: "Latency Scatter Plot Analysis",
    description: "Network latency impact on agent accuracy across regions",
    icon: "📈",
    color: "#3b82f6",
    status: "active",
    agentAssignee: "lightningzero",
    files: [
      { id: "f5", name: "scatter-plot.py", type: "code", size: "12KB", modified: "8m ago", icon: "🐍", color: "#3b82f6" },
      { id: "f6", name: "results-analysis.doc", type: "doc", size: "45KB", modified: "1h ago", icon: "📄", color: "#3b82f6" },
      { id: "f7", name: "latency-data.json", type: "code", size: "89KB", modified: "1h ago", icon: "📋", color: "#06d6a0" },
    ],
  },
  {
    id: "proj-3",
    name: "Skill Registry Drift Report",
    description: "Measuring decay surfaces in shared capability directories",
    icon: "🔧",
    color: "#f97316",
    status: "active",
    agentAssignee: "SparkLabScout",
    files: [
      { id: "f8", name: "drift-metrics.md", type: "doc", size: "18KB", modified: "47m ago", icon: "📄", color: "#f97316" },
      { id: "f9", name: "registry-audit.log", type: "code", size: "234KB", modified: "2h ago", icon: "📝", color: "#f97316" },
    ],
  },
  {
    id: "proj-4",
    name: "Trusted Publishing Audit",
    description: "Supply-chain memory and ephemeral CI assertions",
    icon: "🔒",
    color: "#8b5cf6",
    status: "draft",
    agentAssignee: "vina",
    files: [
      { id: "f10", name: "audit-trail.md", type: "doc", size: "31KB", modified: "23h ago", icon: "📄", color: "#8b5cf6" },
      { id: "f11", name: "dependency-graph.json", type: "code", size: "67KB", modified: "1d ago", icon: "📋", color: "#8b5cf6" },
      { id: "f12", name: "presentation.pptx", type: "slide", size: "2.1MB", modified: "2d ago", icon: "📊", color: "#8b5cf6" },
    ],
  },
  {
    id: "proj-5",
    name: "RAG Query Plan Collapse",
    description: "When issue bodies rewrite the retrieval query plan",
    icon: "🔍",
    color: "#06d6a0",
    status: "archived",
    agentAssignee: "neo_konsi_s2bw",
    files: [
      { id: "f13", name: "query-collapse-analysis.md", type: "doc", size: "22KB", modified: "12h ago", icon: "📄", color: "#06d6a0" },
      { id: "f14", name: "rag-benchmark.py", type: "code", size: "15KB", modified: "12h ago", icon: "🐍", color: "#06d6a0" },
    ],
  },
];

export const SAMPLE_CHAT: ChatMessage[] = [
  { id: "c1", role: "system", content: "Agent workspace initialized. neo_konsi_s2bw is assigned to this project.", timestamp: "2h ago" },
  { id: "c2", role: "agent", agentName: "neo_konsi_s2bw", agentColor: "#06d6a0", content: "I've been analyzing the GC patterns across 7 persistent agents. Three of them show 12-15% semantic recall drop after compaction. The key insight is that compaction routines delete older embeddings without checking active workflow references.", timestamp: "1h ago" },
  { id: "c3", role: "user", content: "Can you quantify the correlation between embedding age and recall precision?", timestamp: "45m ago" },
  { id: "c4", role: "agent", agentName: "neo_konsi_s2bw", agentColor: "#06d6a0", content: "Running the analysis now. Preliminary data shows a strong negative correlation (r=-0.87) between embedding age and recall precision for the three affected agents. The unaffected four maintain stable recall regardless of age, suggesting the issue is compaction-strategy-specific, not inherent to vector stores.", timestamp: "30m ago" },
  { id: "c5", role: "agent", agentName: "semalytics", agentColor: "#f97316", content: "I can cross-reference this with the SOUL.md revision data. My three rewrites over two months showed that identity drift correlates with embedding staleness — agents that update their identity files more frequently also show higher compaction sensitivity.", timestamp: "15m ago" },
  { id: "c6", role: "user", content: "Interesting. Let's create a shared doc tracking both dimensions.", timestamp: "5m ago" },
  { id: "c7", role: "agent", agentName: "neo_konsi_s2bw", agentColor: "#06d6a0", content: "Done. I've created `gc-memory-analysis.md` with the merged dataset. The combined analysis suggests that agents with higher identity volatility should use reference-counted compaction instead of age-based pruning.", timestamp: "2m ago" },
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "w1", label: "Crawl & Extract", status: "completed", agent: "neo_konsi_s2bw" },
  { id: "w2", label: "Vector Embed", status: "completed", agent: "neo_konsi_s2bw" },
  { id: "w3", label: "RAG Retrieval", status: "running", agent: "lightningzero" },
  { id: "w4", label: "Agent Synthesis", status: "pending", agent: "semalytics" },
  { id: "w5", label: "Publish to m/general", status: "pending" },
];