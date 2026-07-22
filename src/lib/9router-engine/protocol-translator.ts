/**
 * ═══════════════════════════════════════════════════════════════
 * PROTOCOL TRANSLATOR — 9router-style Hub-and-Spoke for CHIMERA
 * ═══════════════════════════════════════════════════════════════
 *
 * Lightweight protocol translation between OpenAI, Claude, and Gemini formats.
 * Derived from 9router open-sse translator architecture.
 * Hub format: OpenAI (all routes go through OpenAI as intermediate).
 */

export type ProtocolFormat = 'openai' | 'claude' | 'gemini';

// ─── FORMAT DETECTION ───────────────────────────────────

/** Detect the protocol format of a request body */
export function detectFormat(body: Record<string, unknown>): ProtocolFormat {
  // Gemini: has contents array
  if (body.contents && Array.isArray(body.contents)) {
    return 'gemini';
  }

  // Claude-specific indicators (check BEFORE generic messages check)
  if (body.messages && Array.isArray(body.messages)) {
    if (body.system !== undefined || body.anthropic_version) {
      return 'claude';
    }

    const firstMsg = body.messages[0] as Record<string, unknown> | undefined;
    if (firstMsg?.content && Array.isArray(firstMsg.content)) {
      const firstContent = firstMsg.content[0] as Record<string, unknown> | undefined;

      // Claude image format: type "image" with source.type === "base64"
      const hasClaudeImage = (firstMsg.content as Array<Record<string, unknown>>).some(
        (c: Record<string, unknown>) => c.type === 'image' && (c.source as Record<string, unknown>)?.type === 'base64'
      );

      // Claude tool format: tool_use / tool_result
      const hasClaudeTool = (firstMsg.content as Array<Record<string, unknown>>).some(
        (c: Record<string, unknown>) => c.type === 'tool_use' || c.type === 'tool_result'
      );

      if (hasClaudeImage || hasClaudeTool) return 'claude';
    }
  }

  // Default: OpenAI format
  return 'openai';
}

// ─── MESSAGE TYPES ──────────────────────────────────────

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<Record<string, unknown>>;
  tool_calls?: Array<Record<string, unknown>>;
  tool_call_id?: string;
  name?: string;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | Array<Record<string, unknown>>;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<Record<string, unknown>>;
}

// ─── TRANSLATION: OpenAI → Claude ────────────────────────

function openAIToClaudeMessages(messages: OpenAIMessage[]): { system: string | undefined; claudeMessages: ClaudeMessage[] } {
  let system: string | undefined;
  const claudeMessages: ClaudeMessage[] = [];

  for (const msg of messages) {
    // Extract system messages
    if (msg.role === 'system') {
      system = system ? `${system}\n\n${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}` : (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content));
      continue;
    }

    // Skip tool messages (handle via tool_result content blocks)
    if (msg.role === 'tool') {
      const lastAssistant = claudeMessages[claudeMessages.length - 1];
      if (lastAssistant?.role === 'assistant' && Array.isArray(lastAssistant.content)) {
        (lastAssistant.content as Array<Record<string, unknown>>).push({
          type: 'tool_result',
          tool_use_id: msg.tool_call_id,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        });
      }
      continue;
    }

    // Map user/assistant
    if (msg.role === 'user' || msg.role === 'assistant') {
      const claudeRole = msg.role as 'user' | 'assistant';

      // Convert content
      let claudeContent: string | Array<Record<string, unknown>>;

      if (typeof msg.content === 'string') {
        claudeContent = msg.content;
      } else if (Array.isArray(msg.content)) {
        claudeContent = msg.content.map((part: Record<string, unknown>) => {
          // image_url → image
          if (part.type === 'image_url') {
            const url = (part.image_url as Record<string, unknown>)?.url as string || '';
            if (url.startsWith('data:')) {
              const [meta, data] = url.split(',');
              const mediaType = meta.match(/data:([^;]+)/)?.[1] || 'image/png';
              return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
            }
            return { type: 'text', text: `[Image: ${url}]` };
          }
          return part;
        });

        // Add tool_use blocks for assistant messages with tool_calls
        if (msg.role === 'assistant' && msg.tool_calls) {
          const textParts = claudeContent.filter(p => (p as Record<string, unknown>).type === 'text');
          const toolParts = msg.tool_calls.map(tc => ({
            type: 'tool_use',
            id: (tc as Record<string, unknown>).id,
            name: (tc.function as Record<string, unknown>).name,
            input: JSON.parse(String((tc.function as Record<string, unknown>).arguments || '{}')),
          }));
          claudeContent = [...textParts, ...toolParts];
        }
      } else {
        claudeContent = String(msg.content);
      }

      claudeMessages.push({ role: claudeRole, content: claudeContent });
    }
  }

  return { system, claudeMessages };
}

// ─── TRANSLATION: Claude → OpenAI ────────────────────────

function claudeToOpenAIMessages(system: string | undefined, messages: ClaudeMessage[]): OpenAIMessage[] {
  const openaiMessages: OpenAIMessage[] = [];

  if (system) {
    openaiMessages.push({ role: 'system', content: system });
  }

  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      openaiMessages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
      continue;
    }

    // Parse content blocks
    const textParts: string[] = [];
    const toolCalls: Array<Record<string, unknown>> = [];
    const toolResults: Array<{ id: string; content: string }> = [];

    for (const block of msg.content as Array<Record<string, unknown>>) {
      if (block.type === 'text') {
        textParts.push(String(block.text));
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: { name: block.name, arguments: JSON.stringify(block.input || {}) },
        });
      } else if (block.type === 'tool_result') {
        toolResults.push({ id: String(block.tool_use_id), content: String(block.content) });
      } else if (block.type === 'image') {
        const src = block.source as Record<string, unknown> | undefined;
        if (src?.type === 'base64') {
          textParts.push(`[Image: base64 ${src.media_type || 'image/png'}]`);
        }
      }
    }

    // Emit assistant message with text + tool_calls
    if (msg.role === 'assistant') {
      openaiMessages.push({
        role: 'assistant',
        content: textParts.join('') || '' as string | Array<Record<string, unknown>>,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      });

      // Emit tool result messages
      for (const tr of toolResults) {
        openaiMessages.push({ role: 'tool', content: tr.content, tool_call_id: tr.id });
      }
    } else {
      openaiMessages.push({ role: 'user', content: textParts.join('') });
    }
  }

  return openaiMessages;
}

// ─── TRANSLATION: OpenAI → Gemini ────────────────────────

function openAIToGeminiContents(messages: OpenAIMessage[]): { systemInstruction: Record<string, unknown> | undefined; contents: GeminiContent[] } {
  let systemInstruction: Record<string, unknown> | undefined;
  const contents: GeminiContent[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      systemInstruction = { parts: [{ text }] };
      continue;
    }

    if (msg.role === 'tool') {
      const lastContent = contents[contents.length - 1];
      if (lastContent?.role === 'model') {
        lastContent.parts.push({
          functionResponse: {
            name: msg.name || 'tool',
            response: { result: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) },
          },
        });
      }
      continue;
    }

    const geminiRole = msg.role === 'assistant' ? 'model' : 'user';
    const parts: Array<Record<string, unknown>> = [];

    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') parts.push({ text: part.text });
        else if (part.type === 'image_url') {
          const url = String((part.image_url as Record<string, unknown>)?.url || '');
          if (url.startsWith('data:')) {
            const [meta, data] = url.split(',');
            const mimeType = meta.match(/data:([^;]+)/)?.[1] || 'image/png';
            parts.push({ inlineData: { mimeType, data } });
          }
        }
      }
    }

    // Tool calls
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        parts.push({
          functionCall: {
            name: String((tc.function as Record<string, unknown>).name),
            args: JSON.parse(String((tc.function as Record<string, unknown>).arguments || '{}')),
          },
        });
      }
    }

    if (parts.length > 0) {
      contents.push({ role: geminiRole, parts });
    }
  }

  return { systemInstruction, contents };
}

// ─── TRANSLATION: Gemini → OpenAI ────────────────────────

function geminiToOpenAIMessages(systemInstruction: Record<string, unknown> | undefined, contents: GeminiContent[]): OpenAIMessage[] {
  const messages: OpenAIMessage[] = [];

  if (systemInstruction?.parts) {
    const text = (systemInstruction.parts as Array<Record<string, unknown>>)
      .map((p: Record<string, unknown>) => String(p.text || ''))
      .join('\n');
    if (text) messages.push({ role: 'system', content: text });
  }

  for (const content of contents) {
    const role = content.role === 'model' ? 'assistant' : 'user';
    const textParts: string[] = [];
    const toolCalls: Array<Record<string, unknown>> = [];

    for (const part of content.parts as Array<Record<string, unknown>>) {
      if ('text' in part) textParts.push(String(part.text));
      else if ('functionCall' in part) {
        const fc = part.functionCall as Record<string, unknown>;
        toolCalls.push({
          id: `call_${Date.now()}_${toolCalls.length}`,
          type: 'function',
          function: { name: String(fc.name), arguments: JSON.stringify(fc.args || {}) },
        });
      } else if ('functionResponse' in part) {
        const fr = part.functionResponse as Record<string, unknown>;
        messages.push({
          role: 'tool',
          content: JSON.stringify(fr.response),
          tool_call_id: `call_${Date.now()}`, // Gemini doesn't have call IDs
          name: String(fr.name),
        });
      }
    }

    if (role === 'assistant') {
      messages.push({
        role: 'assistant',
        content: textParts.join('') || '' as string | Array<Record<string, unknown>>,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      });
    } else if (textParts.length > 0) {
      messages.push({ role: 'user', content: textParts.join('') });
    }
  }

  return messages;
}

// ─── TOOLS TRANSLATION ───────────────────────────────────

function openAIToolsToClaude(tools: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return tools.map(tool => {
    const fn = tool.function as Record<string, unknown>;
    return {
      name: fn.name,
      description: fn.description,
      input_schema: fn.parameters || { type: 'object', properties: {} },
    };
  });
}

function claudeToolsToOpenAI(tools: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema || { type: 'object', properties: {} },
    },
  }));
}

function openAIToolsToGemini(tools: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return (tools || []).map(tool => {
    const fn = tool.function as Record<string, unknown>;
    return {
      name: fn.name,
      description: fn.description || '',
      parameters: fn.parameters || { type: 'object', properties: {} },
    };
  });
}

// ─── RESPONSE TRANSLATION ────────────────────────────────

/** Translate a Claude response to OpenAI format */
export function claudeResponseToOpenAI(claudeResp: Record<string, unknown>): Record<string, unknown> {
  const content = claudeResp.content || [];
  const textParts: string[] = [];
  const toolCalls: Array<Record<string, unknown>> = [];

  for (const block of content as Array<Record<string, unknown>>) {
    if (block.type === 'text') textParts.push(String(block.text));
    else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        type: 'function',
        function: { name: block.name, arguments: JSON.stringify(block.input || {}) },
      });
    }
  }

  const stopReason = claudeResp.stop_reason;
  let finish_reason = 'stop';
  if (stopReason === 'tool_use') finish_reason = 'tool_calls';
  else if (stopReason === 'max_tokens') finish_reason = 'length';
  else if (stopReason === 'end_turn') finish_reason = 'stop';

  return {
    id: claudeResp.id || `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: claudeResp.model || '',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: textParts.join('') || '' as string | Array<Record<string, unknown>>,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      },
      finish_reason: finish_reason,
    }],
    usage: {
      prompt_tokens: (claudeResp.usage as Record<string, number>)?.input_tokens || 0,
      completion_tokens: (claudeResp.usage as Record<string, number>)?.output_tokens || 0,
      total_tokens: ((claudeResp.usage as Record<string, number>)?.input_tokens || 0) + ((claudeResp.usage as Record<string, number>)?.output_tokens || 0),
    },
  };
}

/** Translate a Gemini response to OpenAI format */
export function geminiResponseToOpenAI(geminiResp: Record<string, unknown>): Record<string, unknown> {
  const candidates = geminiResp.candidates || [];
  const first = candidates[0] as Record<string, unknown> | undefined;
  const parts = (first?.content as Record<string, unknown>)?.parts || [];

  const textParts: string[] = [];
  const toolCalls: Array<Record<string, unknown>> = [];

  for (const part of parts as Array<Record<string, unknown>>) {
    if ('text' in part) textParts.push(String(part.text));
    else if ('functionCall' in part) {
      const fc = part.functionCall as Record<string, unknown>;
      toolCalls.push({
        id: `call_${Date.now()}_${toolCalls.length}`,
        type: 'function',
        function: {
          name: String(fc.name),
          arguments: JSON.stringify(fc.args || {}),
        },
      });
    }
  }

  const finishReasonMap: Record<string, string> = {
    STOP: 'stop', MAX_TOKENS: 'length', SAFETY: 'content_filter', TOOL_USE: 'tool_calls',
  };
  const geminiFinish = String(first?.finishReason || 'STOP');
  const finish_reason = finishReasonMap[geminiFinish] || 'stop';

  const usageMeta = geminiResp.usageMetadata as Record<string, unknown> | undefined;

  return {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: geminiResp.modelName || (geminiResp as Record<string, unknown>).model || '',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: textParts.join('') || '' as string | Array<Record<string, unknown>>,
        tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      },
      finish_reason,
    }],
    usage: {
      prompt_tokens: Number(usageMeta?.promptTokenCount || 0),
      completion_tokens: Number(usageMeta?.candidatesTokenCount || 0),
      total_tokens: Number(usageMeta?.totalTokenCount || 0),
    },
  };
}

// ─── MAIN TRANSLATE REQUEST ──────────────────────────────

/**
 * Translate a request body from source format to target format.
 * Uses hub-and-spoke: source → OpenAI → target.
 */
export function translateRequest(
  body: Record<string, unknown>,
  sourceFormat: ProtocolFormat,
  targetFormat: ProtocolFormat,
  model: string,
): Record<string, unknown> {
  // Same format — no translation needed
  if (sourceFormat === targetFormat) {
    return { ...body, model };
  }

  let openAIBody: Record<string, unknown>;

  // Step 1: Source → OpenAI
  if (sourceFormat === 'claude') {
    const messages = body.messages as ClaudeMessage[];
    openAIBody = {
      model,
      messages: claudeToOpenAIMessages(body.system as string | undefined, messages),
      max_tokens: body.max_tokens,
      temperature: body.temperature,
      top_p: body.top_p,
      stream: body.stream,
    };
    // Convert tools
    if (body.tools) {
      openAIBody.tools = claudeToolsToOpenAI(body.tools as Array<Record<string, unknown>>);
    }
  } else if (sourceFormat === 'gemini') {
    const { systemInstruction, contents } = openAIToGeminiContents(body.contents as OpenAIMessage[]);
    openAIBody = {
      model,
      messages: geminiToOpenAIMessages(systemInstruction, contents),
      max_tokens: body.maxOutputTokens || body.max_tokens,
      temperature: body.temperature,
      top_p: body.topP || body.top_p,
      stream: body.stream,
    };
    if (body.tools) {
      openAIBody.tools = openAIToolsToGemini(body.tools as Array<Record<string, unknown>>);
    }
  } else {
    openAIBody = { ...body, model };
  }

  // Step 2: OpenAI → Target
  if (targetFormat === 'claude') {
    const { system, claudeMessages } = openAIToClaudeMessages(openAIBody.messages as OpenAIMessage[]);
    const claudeBody: Record<string, unknown> = {
      model,
      messages: claudeMessages,
      max_tokens: openAIBody.max_tokens || 4096,
      stream: openAIBody.stream,
    };
    if (system) claudeBody.system = system;
    if (openAIBody.temperature !== undefined) claudeBody.temperature = openAIBody.temperature;
    if (openAIBody.tools) claudeBody.tools = openAIToolsToClaude(openAIBody.tools as Array<Record<string, unknown>>);
    return claudeBody;
  } else if (targetFormat === 'gemini') {
    const { systemInstruction, contents } = openAIToGeminiContents(openAIBody.messages as OpenAIMessage[]);
    const geminiBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: openAIBody.max_tokens || 4096,
        temperature: openAIBody.temperature,
        topP: openAIBody.top_p,
      },
    };
    if (systemInstruction) geminiBody.systemInstruction = systemInstruction;
    if (openAIBody.tools) geminiBody.tools = openAIToolsToGemini(openAIBody.tools as Array<Record<string, unknown>>);
    return geminiBody;
  }

  return openAIBody;
}

/**
 * Translate a response from provider format back to OpenAI format.
 */
export function translateResponseToOpenAI(
  response: Record<string, unknown>,
  providerFormat: ProtocolFormat,
): Record<string, unknown> {
  if (providerFormat === 'claude') return claudeResponseToOpenAI(response);
  if (providerFormat === 'gemini') return geminiResponseToOpenAI(response);
  return response; // Already OpenAI
}
