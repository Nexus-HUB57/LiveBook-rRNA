/**
 * useChat — Custom hook for streaming chat with persistence.
 *
 * Manages:
 * - Session creation and recovery
 * - Token-by-token streaming UI updates
 * - Message history loading
 * - Abort control
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export type ChatMessage = {
  id?: string;
  role: 'user' | 'agent';
  content: string;
  sources?: Array<{ title: string; content: string; score?: number; agent?: string }>;
  createdAt?: string;
};

export type ChatSession = {
  id: string;
  agentSlug: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
};

export function useChat(initialSessionId?: string) {
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load history when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    fetch(`/api/chat/history?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.messages) {
          setMessages(data.messages);
        }
      })
      .catch(err => {
        if (!cancelled) console.error('[useChat] Failed to load history:', err);
      });

    return () => { cancelled = true; };
  }, [sessionId]);

  const sendMessage = useCallback(async (query: string, agentSlug?: string) => {
    if (!query.trim() || isLoading) return;

    // Add user message locally (optimistic)
    const userMsg: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);

    // Add empty agent message placeholder
    setMessages(prev => [...prev, { role: 'agent', content: '' }]);

    setIsLoading(true);

    // Abort previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/agent/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          agentSlug,
          sessionId: sessionId || undefined,
        }),
        signal: controller.signal,
      });

      // Capture session ID from headers
      const newSessionId = response.headers.get('X-Session-Id');
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Sem leitor de stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.token) {
              fullContent += data.token;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated.length - 1;
                if (updated[last]?.role === 'agent') {
                  updated[last] = { ...updated[last], content: fullContent };
                }
                return updated;
              });
            }

            if (data.done) {
              // Update with sources and metadata
              setMessages(prev => {
                const updated = [...prev];
                const last = updated.length - 1;
                if (updated[last]?.role === 'agent') {
                  updated[last] = {
                    ...updated[last],
                    sources: data.sources || undefined,
                  };
                }
                return updated;
              });
              if (data.sessionId) setSessionId(data.sessionId);
            }

            if (data.error) {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            // Ignore malformed lines
            if ((parseErr as Error).message !== data?.error) {
              // Not a data.error, just a parse issue
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[useChat] Stream error:', error);
        setMessages(prev => {
          const updated = [...prev];
          const last = updated.length - 1;
          if (updated[last]?.role === 'agent') {
            updated[last] = {
              ...updated[last],
              content: 'Erro ao processar a resposta. Tente novamente.',
            };
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [sessionId, isLoading]);

  const clearHistory = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setSessionId('');
  }, []);

  const loadSession = useCallback((newSessionId: string) => {
    if (abortRef.current) abortRef.current.abort();
    setSessionId(newSessionId);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    sessionId,
    clearHistory,
    loadSession,
  };
}