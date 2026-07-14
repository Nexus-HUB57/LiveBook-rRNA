import ZAI from "z-ai-web-dev-sdk";

const PORT = 3001;

let _zai: any = null;
async function getZAI() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function parseBody(req: Request): Promise<any> {
  const raw = await req.text();
  return JSON.parse(raw);
}

async function callLLM(messages: Array<{ role: string; content: string }>): Promise<string> {
  const zai = await getZAI();
  const response = await zai.chat.completions.create({
    model: "glm-4-flash",
    messages,
    max_tokens: 2048,
  });
  return response.choices?.[0]?.message?.content || "[No response from LLM]";
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      // POST /chat
      if (path === "/chat" && req.method === "POST") {
        const body = await parseBody(req);
        const { messages, context } = body;

        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response(
            JSON.stringify({ error: "messages array is required" }),
            { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
          );
        }

        const llmMessages: Array<{ role: string; content: string }> = [];

        if (context) {
          llmMessages.push({
            role: "system",
            content: `You are a helpful AI assistant for a project explorer application. Use the following project data context to inform your responses:\n\n${context}`,
          });
        }

        for (const msg of messages) {
          if (msg.role && msg.content) {
            llmMessages.push({ role: msg.role, content: msg.content });
          }
        }

        const response = await callLLM(llmMessages);

        return new Response(
          JSON.stringify({ response }),
          { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      // POST /analyze
      if (path === "/analyze" && req.method === "POST") {
        const body = await parseBody(req);
        const { projectNames, descriptions } = body;

        if (!Array.isArray(projectNames) || !Array.isArray(descriptions)) {
          return new Response(
            JSON.stringify({ error: "projectNames and descriptions arrays are required" }),
            { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
          );
        }

        const projectList = projectNames
          .map((name: string, i: number) => `- **${name}**: ${descriptions[i] || "No description"}`)
          .join("\n");

        const messages: Array<{ role: string; content: string }> = [
          {
            role: "system",
            content:
              "You are an expert project analyst. Analyze the given projects for patterns, trends, and actionable insights. Provide a structured analysis covering: common themes, technology patterns, strengths, potential gaps, and strategic recommendations. Be concise but thorough.",
          },
          {
            role: "user",
            content: `Analyze the following projects and provide insights on patterns, trends, and recommendations:\n\n${projectList}`,
          },
        ];

        const analysis = await callLLM(messages);

        return new Response(
          JSON.stringify({ analysis }),
          { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      // POST /recommend
      if (path === "/recommend" && req.method === "POST") {
        const body = await parseBody(req);
        const { preferences, currentProjects, count } = body;
        const numRecs = count || 5;

        if (!preferences) {
          return new Response(
            JSON.stringify({ error: "preferences is required" }),
            { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
          );
        }

        const currentSection = currentProjects && currentProjects.length > 0
          ? `\n\nThe user is already working on or exploring these projects: ${currentProjects.join(", ")}. Exclude these from recommendations.`
          : "";

        const messages: Array<{ role: string; content: string }> = [
          {
            role: "system",
            content: `You are a project recommendation engine for a developer ecosystem. Based on the user's preferences, suggest projects they might be interested in. You have a knowledge base of open-source projects, developer tools, and frameworks. Suggest projects that align with the user's interests and skills.${currentSection}`,
          },
          {
            role: "user",
            content: `Based on these preferences: "${preferences}", recommend ${numRecs} projects I might be interested in. For each recommendation, provide the project name and a brief reason why it fits my interests. Respond ONLY with a valid JSON array of objects with "name" and "reason" fields. No markdown, no explanation, just the JSON array.`,
          },
        ];

        const raw = await callLLM(messages);

        // Try to parse JSON from the response
        let recommendations: Array<{ name: string; reason: string }>;
        try {
          // Extract JSON array from the response (handle possible markdown fences)
          const jsonMatch = raw.match(/\[[\s\S]*\]/);
          const jsonStr = jsonMatch ? jsonMatch[0] : raw;
          recommendations = JSON.parse(jsonStr);
        } catch {
          // Fallback: create a single recommendation from the raw text
          recommendations = [{ name: "Recommended Project", reason: raw }];
        }

        return new Response(
          JSON.stringify({ recommendations }),
          { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      // POST /summarize
      if (path === "/summarize" && req.method === "POST") {
        const body = await parseBody(req);
        const { text } = body;

        if (!text || typeof text !== "string") {
          return new Response(
            JSON.stringify({ error: "text is required" }),
            { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
          );
        }

        const messages: Array<{ role: string; content: string }> = [
          {
            role: "system",
            content:
              "You are a concise summarization assistant. Summarize the given text clearly and accurately, capturing the key points. Keep the summary focused and well-structured.",
          },
          {
            role: "user",
            content: `Please summarize the following text:\n\n${text}`,
          },
        ];

        const summary = await callLLM(messages);

        return new Response(
          JSON.stringify({ summary }),
          { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      // Health check / root
      if (path === "/" && req.method === "GET") {
        return new Response(
          JSON.stringify({
            service: "llm-agent",
            port: PORT,
            endpoints: ["/chat", "/analyze", "/recommend", "/summarize"],
            status: "running",
          }),
          { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      // 404
      return new Response(
        JSON.stringify({ error: "Not found" }),
        { status: 404, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      console.error("Request error:", err);
      return new Response(
        JSON.stringify({ error: err.message || "Internal server error" }),
        { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }
  },
});

console.log(`🤖 LLM Agent mini-service running on http://localhost:${PORT}`);